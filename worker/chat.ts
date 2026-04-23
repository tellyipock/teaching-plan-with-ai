import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import type { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';

/**
 * ChatHandler - Handles all chat-related operations
 * 
 * This class encapsulates the OpenAI integration and tool execution logic,
 * making it easy for AI developers to understand and extend the functionality.
 */
export class ChatHandler {
  private openAiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private model: string;

  constructor(aiGatewayUrl: string, apiKey: string, model: string, anthropicApiKey?: string) {
    if (aiGatewayUrl && apiKey) {
      this.openAiClient = new OpenAI({
        baseURL: aiGatewayUrl,
        apiKey,
      });
    }

    if (anthropicApiKey) {
      this.anthropicClient = new Anthropic({ apiKey: anthropicApiKey });
    }

    this.model = model;
  }

  /**
   * Process a user message and generate AI response with optional tool usage
   */
  async processMessage(
    message: string, 
    conversationHistory: Message[], 
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    if (this.isAnthropicModel(this.model)) {
      return this.processAnthropicMessage(message, conversationHistory, onChunk);
    }

    if (!this.openAiClient) {
      throw new Error('OpenAI-compatible client is not configured.');
    }

    return this.processOpenAIMessage(message, conversationHistory, onChunk);
  }

  private isAnthropicModel(model: string): boolean {
    return model.startsWith('claude-');
  }

  private async processAnthropicMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    if (!this.anthropicClient) {
      throw new Error('ANTHROPIC_API_KEY is not configured in the Worker environment.');
    }

    const messages = this.buildAnthropicMessages(message, conversationHistory);

    if (onChunk) {
      const stream = await this.anthropicClient.messages.create({
        model: this.model,
        max_tokens: 16000,
        system:
          'You are a helpful AI assistant that helps users build and deploy web applications. You provide clear, concise guidance on development, deployment, and troubleshooting. Keep responses practical and actionable.',
        messages,
        stream: true,
      });

      let fullContent = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullContent += event.delta.text;
          onChunk(event.delta.text);
        }
      }

      return {
        content: fullContent || 'I apologize, but I encountered an issue processing your request.',
      };
    }

    const completion = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 16000,
      system:
        'You are a helpful AI assistant that helps users build and deploy web applications. You provide clear, concise guidance on development, deployment, and troubleshooting. Keep responses practical and actionable.',
      messages,
    });

    const content = completion.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    return {
      content: content || 'I apologize, but I encountered an issue processing your request.',
    };
  }

  private async processOpenAIMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const client = this.openAiClient!;
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    
    if (onChunk) {
      // Use streaming with callback
      const stream = await client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_completion_tokens: 16000,
        stream: true,
        // reasoning_effort: 'low'
      });

      return this.handleStreamResponse(stream, message, conversationHistory, onChunk);
    }

    // Non-streaming response
    const completion = await client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 16000,
      stream: false
    });

    return this.handleNonStreamResponse(completion, message, conversationHistory);
  }

  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }
        
        // Accumulate tool calls from streaming chunks
        if (delta?.tool_calls) {
          for (let i = 0; i < delta.tool_calls.length; i++) {
            const deltaToolCall = delta.tool_calls[i];
            if (!accumulatedToolCalls[i]) {
              accumulatedToolCalls[i] = {
                id: deltaToolCall.id || `tool_${Date.now()}_${i}`,
                type: 'function',
                function: {
                  name: deltaToolCall.function?.name || '',
                  arguments: deltaToolCall.function?.arguments || ''
                }
              };
            } else {
              // Append to existing tool call
              if (deltaToolCall.function?.name && !accumulatedToolCalls[i].function.name) {
                accumulatedToolCalls[i].function.name = deltaToolCall.function.name;
              }
              if (deltaToolCall.function?.arguments) {
                accumulatedToolCalls[i].function.arguments += deltaToolCall.function.arguments;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new Error('Stream processing failed');
    }
    
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    
    return { content: fullContent };
  }

  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[]
  ) {
    const responseMessage = completion.choices[0]?.message;
    
    if (!responseMessage) {
      return { content: 'I apologize, but I encountered an issue processing your request.' };
    }

    if (!responseMessage.tool_calls) {
      return { 
        content: responseMessage.content || 'I apologize, but I encountered an issue.' 
      };
    }

    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(
      message, 
      conversationHistory, 
      responseMessage.tool_calls, 
      toolCalls
    );

    return { content: finalResponse, toolCalls };
  }

  /**
   * Execute all tool calls from OpenAI response
   */
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: args,
            result
          };
        } catch (error) {
          console.error(`Tool execution failed for ${tc.function.name}:`, error);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: {},
            result: { error: `Failed to execute ${tc.function.name}: ${error instanceof Error ? error.message : 'Unknown error'}` }
          };
        }
      })
    );
  }

  /**
   * Generate final response after tool execution
   */
  private async generateToolResponse(
    userMessage: string, 
    history: Message[], 
    openAiToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[], 
    toolResults: ToolCall[]
  ): Promise<string> {
    const client = this.openAiClient;
    if (!client) {
      throw new Error('OpenAI-compatible client is not configured.');
    }

    const followUpCompletion = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant. Respond naturally to the tool results.' },
        ...history.slice(-3).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
        { 
          role: 'assistant', 
          content: null,
          tool_calls: openAiToolCalls
        },
        ...toolResults.map((result, index) => ({
          role: 'tool' as const,
          content: JSON.stringify(result.result),
          tool_call_id: openAiToolCalls[index]?.id || result.id
        }))
      ],
      max_tokens: 16000
    });

    return followUpCompletion.choices[0]?.message?.content || 'Tool results processed successfully.';
  }

  /**
   * Build conversation messages for OpenAI API
   */
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      { 
        role: 'system' as const, 
        content: 'You are a helpful AI assistant that helps users build and deploy web applications. You provide clear, concise guidance on development, deployment, and troubleshooting. Keep responses practical and actionable.' 
      },
      ...history.slice(-5).map(m => ({ 
        role: m.role, 
        content: m.content 
      })),
      { role: 'user' as const, content: userMessage }
    ];
  }

  private buildAnthropicMessages(userMessage: string, history: Message[]) {
    const normalized = history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-5)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    return [...normalized, { role: 'user' as const, content: userMessage }];
  }

  /**
   * Update the model for this chat handler
   */
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}