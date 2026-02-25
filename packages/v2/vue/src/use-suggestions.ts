import { computed, ref, watch, type Ref } from "vue";
import type { Suggestion, CopilotKitCore } from "@copilotkitnext/core";
import { DEFAULT_AGENT_ID } from "@copilotkitnext/shared";
import { useCopilotKit } from "./copilotkit";

export interface UseSuggestionsOptions {
  /** The agent ID to fetch suggestions for. Defaults to the default agent ID. */
  agentId?: string;
}

export interface UseSuggestionsResult {
  /** Reactive list of current suggestions. */
  suggestions: Ref<Suggestion[]>;
  /** Whether suggestions are currently being generated. */
  isLoading: Ref<boolean>;
  /** Manually trigger a suggestions reload for the agent. */
  reloadSuggestions: () => void;
  /** Clear current suggestions for the agent. */
  clearSuggestions: () => void;
}

/**
 * Composable that provides reactive access to CopilotKit suggestions.
 *
 * @example
 * ```ts
 * const { suggestions, isLoading, reloadSuggestions } = useSuggestions();
 *
 * // In template: v-for="s in suggestions" ...
 * ```
 */
export function useSuggestions(options: UseSuggestionsOptions = {}): UseSuggestionsResult {
  const copilotkit = useCopilotKit();
  const resolvedAgentId = computed(() => options.agentId ?? DEFAULT_AGENT_ID);

  const suggestions = ref<Suggestion[]>([]);
  const isLoading = ref(false);

  const initState = () => {
    const result = copilotkit.core.getSuggestions(resolvedAgentId.value);
    suggestions.value = result.suggestions;
    isLoading.value = result.isLoading;
  };

  watch(resolvedAgentId, () => initState(), { immediate: true });

  watch(
    resolvedAgentId,
    (_newVal, _old, onCleanup) => {
      const agentId = resolvedAgentId.value;
      const core: CopilotKitCore = copilotkit.core;
      const sub = core.subscribe({
        onSuggestionsChanged: (event) => {
          if (event.agentId !== agentId) return;
          suggestions.value = event.suggestions;
        },
        onSuggestionsStartedLoading: (event) => {
          if (event.agentId !== agentId) return;
          isLoading.value = true;
        },
        onSuggestionsFinishedLoading: (event) => {
          if (event.agentId !== agentId) return;
          isLoading.value = false;
        },
        onSuggestionsConfigChanged: () => {
          const result = core.getSuggestions(agentId);
          suggestions.value = result.suggestions;
          isLoading.value = result.isLoading;
        },
      });
      onCleanup(() => sub.unsubscribe());
    },
    { immediate: true },
  );

  const reloadSuggestions = () => {
    copilotkit.core.reloadSuggestions(resolvedAgentId.value);
  };

  const clearSuggestions = () => {
    copilotkit.core.clearSuggestions(resolvedAgentId.value);
  };

  return { suggestions, isLoading, reloadSuggestions, clearSuggestions };
}
