import { onScopeDispose } from "vue";
import { useCopilotKit } from "./copilotkit";
import type { HumanInTheLoopConfig } from "./types";

/**
 * Composable that registers a human-in-the-loop tool with CopilotKit.
 * The tool is automatically removed when the component is unmounted.
 *
 * @example
 * ```ts
 * useHumanInTheLoop({
 *   name: 'approval',
 *   description: 'Require user approval',
 *   parameters: z.object({ summary: z.string() }),
 *   component: ApprovalDialogComponent,
 * });
 * ```
 */
export function useHumanInTheLoop<
  Args extends Record<string, unknown> = Record<string, unknown>,
>(config: HumanInTheLoopConfig<Args>): void {
  const copilotkit = useCopilotKit();

  copilotkit.addHumanInTheLoop(config as HumanInTheLoopConfig);

  onScopeDispose(() => {
    copilotkit.removeTool(config.name, config.agentId);
  });
}
