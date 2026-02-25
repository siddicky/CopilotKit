import { watch } from "vue";
import type { WatchSource } from "vue";
import { useCopilotKit } from "./copilotkit";
import type { FrontendToolConfig } from "./types";
import type { VueFrontendTool } from "./types/vue-frontend-tool";
import type { VueToolCallRenderer } from "./types/vue-tool-call-renderer";

/**
 * Composable that registers a frontend tool with CopilotKit.
 * The tool is automatically removed when the component is unmounted.
 *
 * If the tool includes a `render` property, its render function is also
 * registered as a render tool call on the core for UI rendering.
 *
 * @example
 * ```ts
 * useFrontendTool({
 *   name: 'search',
 *   description: 'Search for items',
 *   parameters: z.object({ query: z.string() }),
 *   handler: async (args) => {
 *     const results = await searchAPI(args.query);
 *     return JSON.stringify(results);
 *   },
 * });
 * ```
 */
export function useFrontendTool<
  Args extends Record<string, unknown> = Record<string, unknown>,
>(tool: FrontendToolConfig<Args> | VueFrontendTool<Args>, deps?: WatchSource<unknown>[]): void {
  const copilotkit = useCopilotKit();
  const extraDeps = deps ?? [];

  watch(
    [() => tool.name, () => tool.agentId, () => extraDeps.length, ...extraDeps],
    (_newValues, _old, onCleanup) => {
      const name = tool.name;

      copilotkit.addFrontendTool(tool as FrontendToolConfig);

      // If the tool has a render function, register it as a render tool call
      if ("render" in tool && tool.render) {
        const keyOf = (rc: VueToolCallRenderer<unknown>) =>
          `${rc.agentId ?? ""}:${rc.name}`;
        const currentRenderToolCalls =
          copilotkit.renderToolCalls as VueToolCallRenderer<unknown>[];
        const mergedMap = new Map<string, VueToolCallRenderer<unknown>>();
        for (const rc of currentRenderToolCalls) {
          mergedMap.set(keyOf(rc), rc);
        }
        const newEntry = {
          name,
          args: tool.parameters,
          agentId: tool.agentId,
          render: tool.render,
        } as VueToolCallRenderer<unknown>;
        mergedMap.set(keyOf(newEntry), newEntry);
        copilotkit.setRenderToolCalls(Array.from(mergedMap.values()));
      }

      onCleanup(() => {
        copilotkit.removeTool(name, tool.agentId);
      });
    },
    { immediate: true },
  );
}
