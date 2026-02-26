# Vue + React CopilotKit Micro-Frontend with LangGraph Interrupts

This example demonstrates embedding CopilotKit's React components as a micro-frontend inside a Vue 3 application, with bidirectional shared state and LangGraph interrupt (human-in-the-loop) support.

## Architecture

```
Vue 3 Host App (Vite)
├── ProverbsList.vue          ← Vue-native UI, renders shared state
├── CopilotKitWrapper.vue     ← Mounts React root (micro-frontend)
│   └── React Component Tree
│       ├── <CopilotKit>      ← Provider (runtimeUrl, agent)
│       ├── useCoAgent        ← Bidirectional shared state
│       ├── useInterrupt      ← LangGraph interrupt handling
│       ├── useCopilotAction  ← Frontend tools
│       └── <CopilotSidebar>  ← Chat UI

Express Runtime Server (port 4000)
└── CopilotRuntime + LangGraphAgent

LangGraph Agent (port 8125)
└── Graph with interrupt() for human-in-the-loop
```

## State Bridge

Vue and React share state through a callback bridge:
- **Agent → Vue**: `useCoAgent` state changes trigger a callback that updates Vue's reactive state
- **Vue → Agent**: Vue UI actions call `bridge.reactApi.setAgentState()` which calls React's `setState`

## Prerequisites

- Node.js >= 18
- pnpm
- An OpenAI API key (for the LangGraph agent)

## Setup

All commands below should be run from this example's root directory (`examples/v2/vue-react-langgraph/`).

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file in `apps/agent/`:
   ```
   OPENAI_API_KEY=your-key-here
   ```

3. Start all three services (in separate terminals):

   **Terminal 1 — LangGraph Agent:**
   ```bash
   cd apps/agent
   pnpm dev
   ```

   **Terminal 2 — CopilotKit Runtime:**
   ```bash
   cd apps/runtime
   pnpm dev
   ```

   **Terminal 3 — Vue App:**
   ```bash
   cd apps/web
   pnpm dev
   ```

4. Open http://localhost:5173

## Features to Try

- **Shared State**: "Write a proverb about AI" — appears in the Vue-rendered list
- **Interrupts**: "Delete the first proverb" — triggers a confirmation dialog in the sidebar
- **Frontend Tools**: "Set the theme to orange" — changes the page background
- **Generative UI**: "Get the weather in SF" — renders a weather card in the chat
- **Vue → Agent**: Click the ✕ button on a proverb to delete it from Vue's UI (syncs to agent)
