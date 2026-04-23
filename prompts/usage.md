# Usage Instructions

You can start customizing the template frontend by modifying `src/pages/HomePage.tsx`. The page auto-updates as you edit the file.

The active chat API is powered by the Node/Express backend in `server/index.js` and exposed at `/api/chat/:sessionId/*`. Use that path for the current app flow.

The current app stores session state in the server process. Legacy Cloudflare Durable Object code still exists in `worker/`, but it is not the primary runtime path for this project anymore.

There are already several models presupplied with the template along with proper configuration (apikeys and base url). You should develop using them instead of adding mock methods.

- Built with:
  * **React + Vite** for fast frontend development with hot module replacement
  * **Express** for the active backend API
  * **Model Context Protocol (MCP)** client for real server integration
  * **OpenAI SDK** for Gemini integration through the OpenAI-compatible endpoint
  * **Tailwind CSS** for utility-first styling with glass morphism effects
  * **Framer Motion** for smooth chat animations and loading states
  * **Lucide Icons** (React) for modern, consistent iconography
  * **Shadcn/UI** (v2.3.0) for accessible chat components built on Radix UI primitives
  * **TypeScript** for type safety and extensible architecture
  * **Zustand** for persisted client-side rubric state

- Agent Features:
  * **Real MCP Integration**: Connects to actual MCP servers, not simulated implementations
  * **Intelligent Tool Usage**: AI automatically detects when to use tools (D1, R2, Workers, Web browsing)
  * **Gemini-First Generation**: The current UI and backend flow use Gemini as the primary provider
  * **Editable Rubrics**: Generated rubric content can be revised before export
  * **PDF Export**: Export branded rubric PDFs from the frontend
  * **Tool Visualization**: Shows which tools were used with results in the chat interface

- Adding New MCP Servers:
  * **Step 1**: Decide whether the MCP integration belongs in the active Express backend or the legacy worker path
  * **Step 2**: Tools are automatically discovered and registered from MCP server definitions
  * **Step 3**: The system automatically routes tool calls to appropriate MCP servers
  * **Real Protocol**: Uses actual MCP protocol for server communication, not simulation

- Environment Variables:
  * **GEMINI_API_KEY**: Gemini API key for rubric generation (required)
  * **VITE_API_BASE_URL**: Frontend API base URL (required for local split-port development)
  * **ANTHROPIC_API_KEY**: Optional, retained in code but not required for the Gemini-only flow

- Restrictions:
  * **Environment variables**: GEMINI_API_KEY must be configured
  * **API keys**: Never expose API keys to the client; keep them on the Node server only
  * **Tool Safety**: Tool functions should validate inputs and handle errors gracefully
  * **Do not regress the active Express runtime** while changing legacy worker code

- Styling:
  * Must generate **fully responsive** and beautiful UI with agent-focused design
  * Use Shadcn preinstalled components rather than writing custom ones when possible
  * Use **Tailwind's spacing, layout, and typography utilities** for all components
  * Include tool interaction indicators and loading states for better UX

- Components:
  * All Shadcn components are available and can be imported from `@/components/ui/...`
  * Current chat uses: `Button`, `Input`, `Card`, `Select`, `Badge` for the interface
  * Tool results are displayed with badges and icons from the UI library
  * Do not write custom components if shadcn components are available
  * Icons from Lucide should be imported directly from `lucide-react`

- Animation:
  * Use `framer-motion`'s `motion` components for chat message animations
  * Animate tool usage indicators, model selection, and loading states
  * You can integrate variants and transitions using Tailwind utility classes alongside motion props

- Backend Architecture (Active Path):
  * **`server/index.js`**: Main Express API and provider routing
  * **`src/lib/chat.ts`**: Frontend API client
  * **`src/lib/pdf-export.ts`**: PDF export logic
  * **`src/lib/store.ts`**: Persisted rubric workspace state
  * **`worker/`**: Legacy Cloudflare implementation retained in repo, not primary runtime

---

# Important Notes
- Conversations and persistence are already handled by the template. Utilize existing utilities and apis to build something greater.
- For example, to build a chatgpt clone - You just need to build the frontend and use existing APIs without modifying them.

# Legacy Worker Note:
Legacy Cloudflare bindings and `wrangler.jsonc` still exist in the repo, but they are no longer the primary app contract. Prefer the Express backend unless the task explicitly targets the legacy worker path.

# IMPORTANT NOTE: You must inform the user that although this project has AI capaibilities, There is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.
Add the above note in an appropriate and visible location in the app - like in the footer or in the chat interface or as a modal

---

## Routing (CRITICAL)

Uses `createBrowserRouter` - do NOT switch to `BrowserRouter`/`HashRouter`.

If you switch routers, `RouteErrorBoundary`/`useRouteError()` will not work (you'll get a router configuration error screen instead of proper route error handling).

**Add routes in `src/main.tsx`:**
```tsx
const router = createBrowserRouter([
  { path: "/", element: <HomePage />, errorElement: <RouteErrorBoundary /> },
  { path: "/new", element: <NewPage />, errorElement: <RouteErrorBoundary /> },
]);
```

**Navigation:** `import { Link } from 'react-router-dom'` then `<Link to="/new">New</Link>`

**Don't:**
- Use `BrowserRouter`, `HashRouter`, `MemoryRouter`
- Remove `errorElement` from routes
- Use `useRouteError()` in your components

## UI Components
All ShadCN components are in `./src/components/ui/*`. Import and use them directly:
```tsx
import { Button } from "@/components/ui/button";
```
**Do not rewrite these components.**
