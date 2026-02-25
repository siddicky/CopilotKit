import { onScopeDispose } from "vue";
import { useCopilotKit } from "./copilotkit";
import type { RenderToolCallConfig } from "./types";

/**
 * Composable that registers a render tool call with CopilotKit.
 * The tool is automatically removed when the component is unmounted.
 *
 * @example
 * ```ts
 * useRenderToolCall({
 *   name: 'chart',
 *   args: z.object({ data: z.array(z.number()) }),
 *   component: ChartRendererComponent,
 * });
 * ```
 */
export function useRenderToolCall<
  Args extends Record<string, unknown> = Record<string, unknown>,
>(config: RenderToolCallConfig<Args>): void {
  const copilotkit = useCopilotKit();

  copilotkit.addRenderToolCall(config as RenderToolCallConfig);

  onScopeDispose(() => {
    copilotkit.removeTool(config.name, config.agentId);
  });
}
