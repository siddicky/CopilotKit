import { onScopeDispose } from "vue";
import { useCopilotKit } from "./copilotkit";
import type { FrontendToolConfig } from "./types";

/**
 * Composable that registers a frontend tool with CopilotKit.
 * The tool is automatically removed when the component is unmounted.
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
>(tool: FrontendToolConfig<Args>): void {
  const copilotkit = useCopilotKit();

  copilotkit.addFrontendTool(tool as FrontendToolConfig);

  onScopeDispose(() => {
    copilotkit.removeTool(tool.name, tool.agentId);
  });
}
