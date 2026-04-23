# LinearEd

LinearEd is an AI-powered teaching plan creator for teachers. The current application runs as a React frontend with a Node/Express API backend and supports Gemini-based rubric generation, editable rubric tables, session persistence, and PDF export.

## 🚀 Overview

LinearEd helps teachers generate classroom-ready grading rubrics from assignment details, subject, grade level, tone, and formatting preferences. The active local and hosting-friendly runtime is a standard Node server, which makes it suitable for traditional hosts such as SiteGround.

The repository still contains legacy Cloudflare worker code and related config under [worker/](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/worker) and [wrangler.jsonc](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/wrangler.jsonc), but that is no longer the primary app path.

### Key Features

-   **Gemini-First Rubric Generation**: Generates grading rubrics from assignment and classroom context.
-   **Teacher Controls**: Adjust grade level, tone, rubric scale, temperature, and feedback detail.
-   **Editable Workspace**: Refine rubric criteria and performance-level descriptions before exporting.
-   **Session Management**: In-memory chat/session state for local and hosted app usage.
-   **Modern Frontend**: A responsive React SPA built with Vite, Tailwind CSS, and Shadcn UI.
-   **PDF Export**: Exports branded rubric PDFs including assignment context.

## 🛠️ Tech Stack

-   **Runtime**: Node.js + Express
-   **Framework**: React 18 with Vite
-   **Routing**: Express (Backend), React Router 6 (Frontend)
-   **Styling**: Tailwind CSS & Shadcn UI
-   **AI Providers**: Gemini via the OpenAI-compatible SDK, optional Anthropic support retained in code
-   **Package Manager**: npm

## 📋 Prerequisites

Before you begin, ensure you have:
1.  Node.js 18+
2.  npm
3.  A Gemini API key
4.  Optional: An Anthropic API key if you want to keep Claude available for future use

## ⚙️ Getting Started

### 1. Clone and Install

```bash
# Clone the repository (replace with your URL)
git clone <your-repo-url>
cd lineared

# Install dependencies
npm install
```

### 2. Configuration

Copy [.env.example](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/.env.example) to `.env` and set your local values:

```dotenv
GEMINI_API_KEY=your-real-key
GEMINI_MODEL=gemini-2.5-flash
VITE_API_BASE_URL=http://localhost:8787

# Optional
# ANTHROPIC_API_KEY=your-real-key
# AI_DEFAULT_MODEL=gemini-2.5-flash
```

### 3. Local Development

Start the development server (runs both the Vite frontend and the Express backend):

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

-   `server/`: Primary Node/Express backend used for local development and traditional hosting.
-   `src/`: React frontend application.
    -   `components/`: UI components and layout.
    -   `lib/`: Chat, export, and utility functions.
    -   `pages/`: Main application views.
-   `worker/`: Legacy Cloudflare worker implementation retained in the repo but not used by the primary app flow.
-   `src/`: The React frontend application.

## 🚢 Deployment

The current recommended deployment target is any Node-compatible host that can run the Express server and serve the Vite build output.

### Generic Node Deployment

```bash
# Build the frontend
npm run build

# Start the API server
npm run start
```

Serve the contents of `dist/` with your host or reverse proxy, and proxy API traffic to the Node server.

### Legacy Cloudflare Deployment

Cloudflare-related files still exist in the repo, but they are now considered legacy/optional. If you intend to revive that path, review [worker/](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/worker), [wrangler.jsonc](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/wrangler.jsonc), and the related scripts in [package.json](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/package.json).

## 🔧 Extending the AI

### Adding Custom Tools
You can extend rubric generation or add new AI workflows in [server/index.js](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/server/index.js) and the UI flows under [src/](c:/Users/linea/Documents/Dev/teaching-plan-with-ai/src).

### Adding MCP Servers
Legacy MCP integration still exists in the worker code. If you want MCP in the current Node runtime, wire it into the Express backend instead of relying on the old worker-only path.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
Built with a React frontend and a Node/Express backend.