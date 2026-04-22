# RubricFlow

An advanced AI-powered chat platform built on Cloudflare Workers, Cloudflare Agents (Durable Objects), and the Model Context Protocol (MCP). RubricFlow provides a production-ready foundation for building intelligent, stateful AI agents with built-in session management and real-time tool execution.

[cloudflarebutton]

## 🚀 Overview

RubricFlow leverages the full power of the Cloudflare ecosystem to deliver a low-latency, scalable AI chat experience. Unlike stateless chat implementations, RubricFlow uses Durable Objects (via the Agents SDK) to maintain persistent conversation state and session memory directly at the edge.

### Key Features

-   **Stateful AI Agents**: Powered by `@cloudflare/agents` for persistent, consistent session handling.
-   **Multi-Model Support**: Integrated with OpenAI-compatible providers (Gemini, etc.) via Cloudflare AI Gateway.
-   **Tool Architecture**: Built-in support for custom tools and the Model Context Protocol (MCP) for extensible AI capabilities.
-   **Session Management**: A dedicated `AppController` Durable Object manages user sessions, titles, and history.
-   **Modern Frontend**: A responsive React SPA built with Vite, Tailwind CSS, and Shadcn UI.
-   **Streaming Responses**: Real-time token streaming for a responsive user experience.
-   **Web Search Integration**: Native integration with SerpAPI for real-time web browsing capabilities.

## 🛠️ Tech Stack

-   **Runtime**: Cloudflare Workers
-   **State/Memory**: Cloudflare Durable Objects (Agents SDK)
-   **Framework**: React 18 with Vite
-   **Routing**: Hono (Backend), React Router 6 (Frontend)
-   **Styling**: Tailwind CSS & Shadcn UI
-   **API**: OpenAI SDK (compatible with AI Gateway)
-   **Package Manager**: Bun

## 📋 Prerequisites

Before you begin, ensure you have:
1.  A [Cloudflare Account](https://dash.cloudflare.com/)
2.  [Bun](https://bun.sh/) installed on your machine
3.  Optional: A [SerpAPI Key](https://serpapi.com/) for web search capabilities

## ⚙️ Getting Started

### 1. Clone and Install

```bash
# Clone the repository (replace with your URL)
git clone <your-repo-url>
cd rubricflow

# Install dependencies
bun install
```

### 2. Configuration

Edit `wrangler.jsonc` to configure your environment variables and Cloudflare account details:

```jsonc
{
  "vars": {
    "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai",
    "CF_AI_API_KEY": "your-cloudflare-api-key",
    "SERPAPI_KEY": "your-serpapi-key" // Optional
  }
}
```

### 3. Local Development

Start the development server (runs both the Vite frontend and the Worker backend via Wrangler):

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

-   `worker/`: The Cloudflare Worker source code.
    -   `agent.ts`: The primary ChatAgent implementation using Agents SDK.
    -   `app-controller.ts`: Global session and state management.
    -   `chat.ts`: OpenAI integration and streaming logic.
    -   `tools.ts`: Tool definitions and execution logic.
    -   `userRoutes.ts`: Custom API endpoints.
-   `src/`: The React frontend application.
    -   `components/`: UI components and layout.
    -   `lib/`: Chat service and utility functions.
    -   `pages/`: Main application views.

## 🚢 Deployment

Deploying to Cloudflare is seamless. You can deploy manually using the CLI or use the button below.

[cloudflarebutton]

### Manual Deployment

```bash
# Build the frontend and deploy the worker
bun run deploy
```

## 🔧 Extending the AI

### Adding Custom Tools
You can add new tools to the AI in `worker/tools.ts`. Simply add a new tool definition to the `customTools` array and implement the logic in the `executeTool` function.

### Adding MCP Servers
RubricFlow is designed to work with Model Context Protocol servers. To add a new MCP server, update the `MCP_SERVERS` configuration in `worker/mcp-client.ts` with the appropriate SSE URL.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ using Cloudflare Workers and Agents.*