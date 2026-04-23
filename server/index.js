import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

for (const envFile of ['.env', '.env.local', '.dev.vars']) {
  const envPath = path.join(projectRoot, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const PORT = Number(process.env.API_PORT || 8787);
const DEFAULT_ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const distPath = path.resolve(__dirname, '../dist');

const sessions = new Map();

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiBaseURL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
const gemini = geminiApiKey
  ? new OpenAI({
      apiKey: geminiApiKey,
      baseURL: geminiBaseURL,
    })
  : null;

const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || (gemini ? DEFAULT_GEMINI_MODEL : DEFAULT_ANTHROPIC_MODEL);

function createMessage(role, content, toolCalls) {
  return {
    role,
    content,
    timestamp: Date.now(),
    id: randomUUID(),
    ...(toolCalls ? { toolCalls } : {}),
  };
}

function getSession(sessionId) {
  let state = sessions.get(sessionId);
  if (!state) {
    state = {
      messages: [],
      sessionId,
      isProcessing: false,
      model: DEFAULT_MODEL,
    };
    sessions.set(sessionId, state);
  }
  return state;
}

function toAnthropicMessages(history, userMessage) {
  const normalized = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  return [...normalized, { role: 'user', content: userMessage }];
}

function toGeminiMessages(history, userMessage) {
  const normalized = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  return [...normalized, { role: 'user', content: userMessage }];
}

function isGeminiModel(model) {
  return typeof model === 'string' && model.toLowerCase().startsWith('gemini');
}

function getErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRetryableProviderError(error) {
  const message = getErrorMessage(error).toLowerCase();
  const status = typeof error?.status === 'number' ? error.status : undefined;

  if (status && (status === 429 || status >= 500)) {
    return true;
  }

  return (
    message.includes('503') ||
    message.includes('status code (no body)') ||
    message.includes('temporarily unavailable') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('econnreset') ||
    message.includes('fetch failed') ||
    message.includes('network')
  );
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withProviderRetry(fn, label, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableProviderError(error) || attempt === maxAttempts) {
        break;
      }

      const delayMs = 600 * Math.pow(2, attempt - 1);
      console.warn(`${label} transient error (attempt ${attempt}/${maxAttempts}): ${getErrorMessage(error)}. Retrying in ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function shouldFallbackToGemini(error) {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
  return (
    msg.includes('credit balance is too low') ||
    msg.includes('insufficient') ||
    msg.includes('anthropic_api_key is missing')
  );
}

function getGeminiFallbackModels(preferredModel) {
  const candidates = [
    preferredModel,
    DEFAULT_GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ].filter((m) => typeof m === 'string' && m.trim());

  return [...new Set(candidates)];
}

function generateSessionTitle(firstMessage) {
  const now = new Date();
  const dateTime = now.toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!firstMessage || !firstMessage.trim()) {
    return `Chat ${dateTime}`;
  }

  const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
  const truncated = cleanMessage.length > 40 ? `${cleanMessage.slice(0, 37)}...` : cleanMessage;
  return `${truncated} • ${dateTime}`;
}

async function createAnthropicText({ model, history, message, stream, onChunk, temperature }) {
  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY is missing. Set it in your environment.');
  }

  const payload = {
    model,
    max_tokens: 16000,
    ...(typeof temperature === 'number' ? { temperature } : {}),
    system:
      'You are a helpful AI assistant that helps users build and deploy web applications. You provide clear, concise guidance on development, deployment, and troubleshooting. Keep responses practical and actionable.',
    messages: toAnthropicMessages(history, message),
  };

  return withProviderRetry(async () => {
    if (stream) {
      const response = await anthropic.messages.create({ ...payload, stream: true });
      let full = '';
      for await (const event of response) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          full += event.delta.text;
          onChunk(event.delta.text);
        }
      }
      return full;
    }

    const response = await anthropic.messages.create(payload);
    return response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
  }, 'Anthropic');
}

function normalizeTemperature(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(1, value));
}

async function createGeminiText({ model, history, message, stream, onChunk, temperature }) {
  if (!gemini) {
    throw new Error('GEMINI_API_KEY is missing. Set it in your environment.');
  }

  const payload = {
    model,
    ...(typeof temperature === 'number' ? { temperature } : {}),
    messages: toGeminiMessages(history, message),
  };

  return withProviderRetry(async () => {
    if (stream) {
      const response = await gemini.chat.completions.create({ ...payload, stream: true });
      let full = '';
      for await (const chunk of response) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          full += delta;
          onChunk(delta);
        }
      }
      return full;
    }

    const response = await gemini.chat.completions.create(payload);
    return (response.choices?.[0]?.message?.content || '').trim();
  }, 'Gemini');
}

async function createTextWithProvider({ model, history, message, stream, onChunk, temperature }) {
  if (isGeminiModel(model)) {
    const fallbackModels = getGeminiFallbackModels(model);
    let lastError;

    for (const geminiModel of fallbackModels) {
      try {
        if (geminiModel !== model) {
          console.warn(`Primary Gemini model failed. Retrying with fallback model: ${geminiModel}`);
        }

        return await createGeminiText({
          model: geminiModel,
          history,
          message,
          stream,
          onChunk,
          temperature,
        });
      } catch (error) {
        lastError = error;
        if (!isRetryableProviderError(error)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  // Non-Gemini (Claude) model path — only reached if user explicitly selects a Claude model
  return createAnthropicText({ model, history, message, stream, onChunk, temperature });
}

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      defaultModel: DEFAULT_MODEL,
      providers: {
        anthropic: !!anthropic,
        gemini: !!gemini,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/api/chat/:sessionId/messages', (req, res) => {
  const state = getSession(req.params.sessionId);
  res.json({ success: true, data: state });
});

app.post('/api/chat/:sessionId/model', (req, res) => {
  const state = getSession(req.params.sessionId);
  const nextModel = req.body?.model;

  if (typeof nextModel === 'string' && nextModel.trim()) {
    state.model = nextModel.trim();
  }

  sessions.set(state.sessionId, state);
  res.json({ success: true, data: state });
});

app.delete('/api/chat/:sessionId/clear', (req, res) => {
  const state = getSession(req.params.sessionId);
  state.messages = [];
  state.isProcessing = false;
  sessions.set(state.sessionId, state);
  res.json({ success: true, data: state });
});

app.post('/api/chat/:sessionId/chat', async (req, res) => {
  const sessionId = req.params.sessionId;
  const state = getSession(sessionId);
  const { message, model, stream, temperature } = req.body || {};
  const normalizedTemperature = normalizeTemperature(temperature);

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message required' });
  }

  if (typeof model === 'string' && model.trim()) {
    state.model = model.trim();
  }

  const userMessage = createMessage('user', message.trim());
  state.messages.push(userMessage);
  state.isProcessing = true;
  sessions.set(sessionId, state);

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const content = await createTextWithProvider({
        model: state.model,
        history: state.messages,
        message: message.trim(),
        stream: true,
        onChunk: (chunk) => res.write(chunk),
        temperature: normalizedTemperature,
      });

      const assistantMessage = createMessage('assistant', content || 'I could not generate a response.');
      state.messages.push(assistantMessage);
      state.isProcessing = false;
      sessions.set(sessionId, state);
      res.end();
      return;
    }

    const content = await createTextWithProvider({
      model: state.model,
      history: state.messages,
      message: message.trim(),
      stream: false,
      onChunk: () => {},
      temperature: normalizedTemperature,
    });

    const assistantMessage = createMessage('assistant', content || 'I could not generate a response.');
    state.messages.push(assistantMessage);
    state.isProcessing = false;
    sessions.set(sessionId, state);

    return res.json({ success: true, data: state });
  } catch (error) {
    state.isProcessing = false;
    sessions.set(sessionId, state);
    let msg = error instanceof Error ? error.message : 'Failed to process message';
    if (isRetryableProviderError(error)) {
      msg = 'AI provider is temporarily unavailable (503). Please try again in a few seconds.';
    }
    console.error('Chat processing error:', msg);

    if (stream) {
      res.write('Sorry, I encountered an error processing your request.');
      res.end();
      return;
    }

    return res.status(500).json({ success: false, error: msg });
  }
});

app.get('/api/sessions', (_req, res) => {
  const data = Array.from(sessions.values()).map((session) => {
    const firstUser = session.messages.find((m) => m.role === 'user')?.content;
    const firstAssistant = session.messages.find((m) => m.role === 'assistant')?.content;
    return {
      id: session.sessionId,
      title: generateSessionTitle(firstUser || firstAssistant),
      createdAt: session.messages[0]?.timestamp || Date.now(),
      lastActive: session.messages[session.messages.length - 1]?.timestamp || Date.now(),
    };
  });

  res.json({ success: true, data });
});

app.post('/api/sessions', (req, res) => {
  const providedSessionId = req.body?.sessionId;
  const firstMessage = req.body?.firstMessage;
  const generatedSessionId = typeof providedSessionId === 'string' && providedSessionId ? providedSessionId : randomUUID();

  const state = getSession(generatedSessionId);
  const title = req.body?.title || generateSessionTitle(firstMessage);

  res.json({
    success: true,
    data: {
      sessionId: state.sessionId,
      title,
    },
  });
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  const deleted = sessions.delete(req.params.sessionId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  return res.json({ success: true, data: { deleted: true } });
});

app.put('/api/sessions/:sessionId/title', (req, res) => {
  const state = sessions.get(req.params.sessionId);
  if (!state) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  const title = req.body?.title;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  return res.json({ success: true, data: { title } });
});

app.get('/api/sessions/stats', (_req, res) => {
  res.json({ success: true, data: { totalSessions: sessions.size } });
});

app.delete('/api/sessions', (_req, res) => {
  const deletedCount = sessions.size;
  sessions.clear();
  res.json({ success: true, data: { deletedCount } });
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
