import type { Message, ChatState, ToolCall, WeatherResult, MCPResult, ErrorResult, SessionInfo } from '../../worker/types';

export interface ChatResponse {
  success: boolean;
  data?: ChatState;
  error?: string;
}

export const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (Preview)' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
];

class ChatService {
  private sessionId: string;
  private baseUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    this.baseUrl = `${this.apiBaseUrl}/api/chat/${this.sessionId}`;
  }

  async sendMessage(
    message: string, 
    model?: string, 
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      
      if (!response.ok) {
        let details = `HTTP ${response.status}`;
        try {
          const cloned = response.clone();
          const json = await cloned.json();
          if (json && typeof json.error === 'string' && json.error.trim()) {
            details = json.error;
          }
        } catch {
          try {
            const text = await response.text();
            if (text && text.trim()) {
              details = text;
            }
          } catch {
            // Fall back to the HTTP status message above.
          }
        }

        if (details.includes('credit balance is too low')) {
          throw new Error('Your Anthropic account does not have enough credits. Please add credits, then try again.');
        }

        throw new Error(details);
      }

      if (onChunk && response.body) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (chunk) {
              fullResponse += chunk;
              onChunk(chunk);
            }
          }
        } finally {
          reader.releaseLock();
        }

        return { success: true };
      }
      
      // Non-streaming response
      return await response.json();
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Failed to send message';
      if (message === 'Failed to fetch') {
        const apiOrigin = this.apiBaseUrl || window.location.origin;
        message = `Cannot reach API at ${apiOrigin}. Make sure the backend is running on http://localhost:8787.`;
      }
      console.error('Failed to send message:', message);
      return { success: false, error: message };
    }
  }

  async getMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get messages:', error);
      return { success: false, error: 'Failed to load messages' };
    }
  }

  async clearMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to clear messages:', error);
      return { success: false, error: 'Failed to clear messages' };
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  newSession(): void {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `${this.apiBaseUrl}/api/chat/${this.sessionId}`;
  }

  switchSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.baseUrl = `${this.apiBaseUrl}/api/chat/${sessionId}`;
  }

  // Session Management Methods
  async createSession(title?: string, sessionId?: string, firstMessage?: string): Promise<{ success: boolean; data?: { sessionId: string; title: string }; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sessionId, firstMessage })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to create session' };
    }
  }

  async listSessions(): Promise<{ success: boolean; data?: SessionInfo[]; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sessions`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to list sessions' };
    }
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sessions/${sessionId}`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to delete session' };
    }
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sessions/${sessionId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to update session title' };
    }
  }

  async clearAllSessions(): Promise<{ success: boolean; data?: { deletedCount: number }; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sessions`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to clear all sessions' };
    }
  }

  async updateModel(model: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update model:', error);
      return { success: false, error: 'Failed to update model' };
    }
  }
}

export const chatService = new ChatService();

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const generateSessionTitle = (firstUserMessage?: string): string => {
  const now = new Date();
  const dateTime = now.toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (!firstUserMessage || !firstUserMessage.trim()) {
    return `Chat ${dateTime}`;
  }

  // Clean and truncate the message
  const cleanMessage = firstUserMessage.trim().replace(/\s+/g, ' ');
  const truncated = cleanMessage.length > 40 
    ? cleanMessage.slice(0, 37) + '...' 
    : cleanMessage;

  return `${truncated} • ${dateTime}`;
};

export const renderToolCall = (toolCall: ToolCall): string => {
  const result = toolCall.result as WeatherResult | MCPResult | ErrorResult | undefined;
  
  if (!result) return `⚠️ ${toolCall.name}: No result`;
  if ('error' in result) return `❌ ${toolCall.name}: ${result.error}`;
  if ('content' in result) return `🔧 ${toolCall.name}: Executed`;
  if (toolCall.name === 'get_weather') {
    const weather = result as WeatherResult;
    return `🌤️ Weather in ${weather.location}: ${weather.temperature}°C, ${weather.condition}`;
  }

  return `🔧 ${toolCall.name}: Done`;
};