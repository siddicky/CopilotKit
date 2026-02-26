/**
 * Shared types for the Vue ↔ React state bridge.
 *
 * AgentState mirrors the LangGraph agent state shape (agent.ts AgentStateAnnotation).
 * The bridge interfaces define callback contracts for bidirectional synchronization.
 */

/** Agent state shared between the LangGraph agent, React hooks, and Vue UI. */
export type AgentState = {
  proverbs: string[];
};

/** Callbacks that Vue provides to React for state synchronization. */
export interface VueToReactBridge {
  /** Called by React when useCoAgent state changes (agent → Vue). */
  onAgentStateChanged: (state: AgentState) => void;
  /** Initial state from Vue to seed useCoAgent. */
  initialState: AgentState;
}

/** API that React exposes to Vue once the React root is mounted. */
export interface ReactToVueBridge {
  /** Vue calls this to push state changes into useCoAgent (Vue → agent). */
  setAgentState: (state: AgentState) => void;
}

/** Mutable bridge object shared between Vue and React. */
export interface StateBridge {
  /** Populated by React on mount; null before mount or after unmount. */
  reactApi: ReactToVueBridge | null;
}
