import { ref, watch, onScopeDispose, type Ref, shallowRef } from "vue";
import type { AbstractAgent, Message } from "@ag-ui/client";
import { DEFAULT_AGENT_ID } from "@copilotkitnext/shared";
import { useCopilotKit } from "./copilotkit";

/**
 * Reactive store for an agent, tracking messages, state, and run status.
 */
export interface AgentStore {
  /** The underlying AbstractAgent instance. */
  readonly agent: AbstractAgent;
  /** Whether the agent is currently running. */
  readonly isRunning: Ref<boolean>;
  /** Reactive list of agent messages. */
  readonly messages: Ref<Message[]>;
  /** Reactive agent state. */
  readonly state: Ref<unknown>;
}

/**
 * Options for the `useAgent` composable.
 */
export interface UseAgentOptions {
  /** The agent ID to resolve. Defaults to the default agent ID. */
  agentId?: string | Ref<string | undefined>;
}

/**
 * Composable that resolves an agent by ID and provides reactive access
 * to its messages, state, and run status.
 *
 * @example
 * ```ts
 * const { agentStore } = useAgent({ agentId: 'my-agent' });
 *
 * // In template: agentStore.value?.messages.value
 * ```
 */
export function useAgent(options: UseAgentOptions = {}): {
  agentStore: Ref<AgentStore | undefined>;
} {
  const copilotkit = useCopilotKit();
  const agentStore = shallowRef<AgentStore | undefined>(undefined);
  let currentSubscription: { unsubscribe: () => void } | undefined;

  function resolveAgent(agentId: string): void {
    const agent = copilotkit.getAgent(agentId);

    if (!agent) {
      // Agent no longer exists; clean up any existing subscription and store.
      if (currentSubscription) {
        currentSubscription.unsubscribe();
        currentSubscription = undefined;
      }
      agentStore.value = undefined;
      return;
    }

    // Skip re-initialization if the agent reference hasn't changed.
    if (agentStore.value?.agent === agent) {
      return;
    }

    // Agent instance changed; clean up previous subscription before subscribing to the new one.
    if (currentSubscription) {
      currentSubscription.unsubscribe();
      currentSubscription = undefined;
    }

    const isRunning = ref(false);
    const messages = ref<Message[]>([...agent.messages]);
    const state = ref<unknown>(agent.state);

    currentSubscription = agent.subscribe({
      onMessagesChanged: () => {
        messages.value = [...agent.messages];
      },
      onStateChanged: () => {
        state.value = agent.state;
      },
      onRunInitialized: () => {
        isRunning.value = true;
      },
      onRunFinalized: () => {
        isRunning.value = false;
      },
      onRunFailed: () => {
        isRunning.value = false;
      },
    });

    agentStore.value = {
      agent,
      isRunning,
      messages,
      state,
    };
  }

  const agentIdOption = options.agentId;
  const getAgentId = (): string => {
    if (agentIdOption === undefined) return DEFAULT_AGENT_ID;
    if (typeof agentIdOption === "string") return agentIdOption;
    return agentIdOption.value ?? DEFAULT_AGENT_ID;
  };

  // Watch for the specific agent in the registry rather than deep-watching all agents
  watch(
    () => copilotkit.agents[getAgentId()],
    () => {
      resolveAgent(getAgentId());
    },
    { immediate: true },
  );

  // Watch for agentId ref changes
  if (typeof agentIdOption === "object" && "value" in agentIdOption) {
    watch(agentIdOption, () => {
      resolveAgent(getAgentId());
    });
  }

  onScopeDispose(() => {
    if (currentSubscription) {
      currentSubscription.unsubscribe();
      currentSubscription = undefined;
    }
  });

  return { agentStore };
}
