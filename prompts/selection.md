# Template Selection Guidelines

This project is now primarily a React + Express application for AI-assisted rubric generation. Legacy Cloudflare worker code remains in the repository, but it is not the main runtime path.

* Use this template when you need:
  * AI-assisted rubric generation and editable rubric workflows
  * A standard Node/Express backend suitable for traditional hosting
  * Gemini-powered content generation with optional Claude support retained in code
  * React/Vite frontend customization for educator-facing tools
  * PDF export and saved rubric workspace features

* Do not use it for:
  * Simple static websites without AI functionality
  * Applications that don't need AI capabilities
  * Projects that specifically require Cloudflare Workers as the primary runtime without additional migration work
  * Simple question-answer bots without rubric or structured-generation requirements

IMPORTANT NOTE: Use the Express backend as the default implementation surface. Only touch the legacy worker path when a task explicitly calls for Cloudflare-specific functionality.

* Built with:
  * **React + Vite** for fast, modern frontend development
  * **Express** for the active backend API
  * **OpenAI SDK** for Gemini-compatible model integration
  * **Tailwind CSS** with glass morphism effects and responsive design
  * **Framer Motion** for smooth chat animations and loading states
  * **Shadcn/UI** components for polished interface elements
  * **TypeScript** for type safety and extensible architecture
  * **Legacy Cloudflare worker files** retained in-repo but not primary