import { computed, ref, watch } from "vue";
import type { WatchSource } from "vue";
import { DEFAULT_AGENT_ID } from "@copilotkitnext/shared";
import type {
  DynamicSuggestionsConfig,
  Suggestion,
  StaticSuggestionsConfig,
  SuggestionsConfig,
} from "@copilotkitnext/core";
import { useCopilotKit } from "./copilotkit";

type StaticSuggestionInput = Omit<Suggestion, "isLoading"> &
  Partial<Pick<Suggestion, "isLoading">>;

type StaticSuggestionsConfigInput = Omit<StaticSuggestionsConfig, "suggestions"> & {
  suggestions: StaticSuggestionInput[];
};

type SuggestionsConfigInput = DynamicSuggestionsConfig | StaticSuggestionsConfigInput;

function isDynamicConfig(config: SuggestionsConfigInput): config is DynamicSuggestionsConfig {
  return "instructions" in config;
}

function normalizeStaticSuggestions(suggestions: StaticSuggestionInput[]): Suggestion[] {
  return suggestions.map((s) => ({ ...s, isLoading: s.isLoading ?? false }));
}

/**
 * Composable that registers a suggestion configuration with CopilotKit.
 * The config is automatically removed when the component is unmounted.
 *
 * @example
 * ```ts
 * // Static suggestions
 * useConfigureSuggestions({
 *   suggestions: [{ title: 'Summarize', message: 'Summarize this' }],
 * });
 *
 * // Dynamic (AI-generated) suggestions
 * useConfigureSuggestions({
 *   instructions: 'Generate 3 relevant follow-up questions',
 * });
 * ```
 */
export function useConfigureSuggestions(
  config: SuggestionsConfigInput | null | undefined,
  deps?: WatchSource<unknown>[],
): void {
  const copilotkit = useCopilotKit();
  const extraDeps = deps ?? [];

  const normalizedConfig = computed<SuggestionsConfig | null>(() => {
    if (!config || ("available" in config && config.available === "disabled")) {
      return null;
    }
    if (isDynamicConfig(config)) {
      return { ...config };
    }
    return { ...config, suggestions: normalizeStaticSuggestions(config.suggestions) };
  });

  const serializedConfig = computed(() =>
    normalizedConfig.value ? JSON.stringify(normalizedConfig.value) : null,
  );

  const targetAgentId = computed(() => {
    if (!normalizedConfig.value) return DEFAULT_AGENT_ID;
    const consumer = (normalizedConfig.value as StaticSuggestionsConfig | DynamicSuggestionsConfig)
      .consumerAgentId;
    if (!consumer || consumer === "*") return DEFAULT_AGENT_ID;
    return consumer;
  });

  const previousSerializedConfig = ref<string | null>(null);

  watch(
    [serializedConfig, targetAgentId, () => extraDeps.length, ...extraDeps],
    (_newValues, _old, onCleanup) => {
      const cfg = normalizedConfig.value;
      if (!cfg) {
        previousSerializedConfig.value = null;
        return;
      }
      const core = copilotkit.core;

      const id = core.addSuggestionsConfig(cfg);

      // Only reload if the serialized config actually changed
      const currentSerialized = serializedConfig.value;
      if (currentSerialized && previousSerializedConfig.value !== currentSerialized) {
        previousSerializedConfig.value = currentSerialized;
        const aid = targetAgentId.value;
        if (aid) {
          core.reloadSuggestions(aid);
        }
      }

      onCleanup(() => {
        core.removeSuggestionsConfig(id);
      });
    },
    { immediate: true },
  );
}
