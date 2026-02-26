import { reactive, readonly } from "vue";
import type {
  AgentState,
  VueToReactBridge,
  StateBridge,
} from "../bridge/types";

/**
 * Vue composable that manages the shared agent state and provides
 * a bridge for bidirectional synchronization with the React micro-frontend.
 *
 * - `agentState`: readonly reactive state rendered by Vue components
 * - `bridge`: mutable object whose `reactApi` is populated by React on mount
 * - `vueToReactBridge`: callback object passed to the React root as props
 */
export function useStateBridge() {
  const agentState = reactive<AgentState>({
    proverbs: [
      "CopilotKit may be new, but its the best thing since sliced bread.",
    ],
  });

  const bridge: StateBridge = reactive({
    reactApi: null,
  });

  // Called by React when useCoAgent state changes (agent → Vue)
  const onAgentStateChanged = (newState: AgentState) => {
    agentState.proverbs = newState.proverbs ?? [];
  };

  // Called by Vue UI to update agent state through React's useCoAgent.setState
  const updateProverbs = (proverbs: string[]) => {
    agentState.proverbs = proverbs;
    if (bridge.reactApi) {
      bridge.reactApi.setAgentState({ proverbs });
    }
  };

  const removeProverb = (index: number) => {
    const newProverbs = agentState.proverbs.filter((_, i) => i !== index);
    updateProverbs(newProverbs);
  };

  const vueToReactBridge: VueToReactBridge = {
    onAgentStateChanged,
    initialState: { proverbs: [...agentState.proverbs] },
  };

  return {
    agentState: readonly(agentState),
    bridge,
    vueToReactBridge,
    updateProverbs,
    removeProverb,
  };
}
