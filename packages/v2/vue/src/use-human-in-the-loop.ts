import { h, onScopeDispose, ref, watch } from "vue";
import type { WatchSource, VNodeChild } from "vue";
import { useCopilotKit } from "./copilotkit";
import type { HumanInTheLoopConfig } from "./types";
import type { VueHumanInTheLoop } from "./types/vue-human-in-the-loop";
import type { VueFrontendTool } from "./types/vue-frontend-tool";
import type {
  VueToolCallRenderer,
  VueToolCallRendererRenderProps,
} from "./types/vue-tool-call-renderer";
import { useFrontendTool } from "./use-frontend-tool";

/**
 * Composable that registers a human-in-the-loop tool with CopilotKit.
 * The tool is automatically removed when the component is unmounted.
 *
 * @deprecated Use the `VueHumanInTheLoop` overload with a `render` property instead.
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
>(config: HumanInTheLoopConfig<Args>): void;

/**
 * Composable that registers a human-in-the-loop tool with CopilotKit using
 * the Vue render API. The `respond` callback is automatically wired to the
 * render props during the "executing" status.
 *
 * @example
 * ```ts
 * useHumanInTheLoop({
 *   name: 'approval',
 *   description: 'Require user approval',
 *   parameters: z.object({ summary: z.string() }),
 *   render: (props) => {
 *     if (props.status === 'executing' && props.respond) {
 *       return h('button', { onClick: () => props.respond({ approved: true }) }, 'Approve');
 *     }
 *     return h('div', 'Waiting...');
 *   },
 * });
 * ```
 */
export function useHumanInTheLoop<
  Args extends Record<string, unknown> = Record<string, unknown>,
>(tool: VueHumanInTheLoop<Args>, deps?: WatchSource<unknown>[]): void;

export function useHumanInTheLoop<
  Args extends Record<string, unknown> = Record<string, unknown>,
>(
  configOrTool: HumanInTheLoopConfig<Args> | VueHumanInTheLoop<Args>,
  deps?: WatchSource<unknown>[],
): void {
  const copilotkit = useCopilotKit();

  // Detect which type was passed: VueHumanInTheLoop has "render", legacy has "component"
  if ("render" in configOrTool) {
    // New VueHumanInTheLoop path with render component wrapping
    const tool = configOrTool as VueHumanInTheLoop<Args>;
    const resolvePromiseRef = ref<((result: unknown) => void) | null>(null);

    const respond = async (result: unknown): Promise<void> => {
      if (resolvePromiseRef.value) {
        resolvePromiseRef.value(result);
        resolvePromiseRef.value = null;
      }
    };

    const handler = async (): Promise<unknown> => {
      return new Promise<unknown>((resolve) => {
        resolvePromiseRef.value = resolve;
      });
    };

    // Create a render wrapper that injects respond based on tool call status
    const RenderComponent: VueToolCallRenderer<Args>["render"] = (
      props: VueToolCallRendererRenderProps<Args>,
    ): VNodeChild => {
      const ToolComponent = tool.render;
      if (props.status === "inProgress") {
        return h(ToolComponent as Parameters<typeof h>[0], {
          ...props,
          name: tool.name,
          description: tool.description || "",
          respond: undefined,
        });
      }
      if (props.status === "executing") {
        return h(ToolComponent as Parameters<typeof h>[0], {
          ...props,
          name: tool.name,
          description: tool.description || "",
          respond,
        });
      }
      if (props.status === "complete") {
        return h(ToolComponent as Parameters<typeof h>[0], {
          ...props,
          name: tool.name,
          description: tool.description || "",
          respond: undefined,
        });
      }
      return h(ToolComponent as Parameters<typeof h>[0], props);
    };

    // Compose into a VueFrontendTool with both handler and render, delegate to useFrontendTool
    const frontendTool: VueFrontendTool<Args> = {
      ...tool,
      handler,
      render: RenderComponent,
    };

    useFrontendTool(frontendTool, deps);

    // Clean up render tool calls on unmount so orphaned UI doesn't persist
    watch(
      [() => tool.name, () => tool.agentId],
      (_newValues, _old, onCleanup) => {
        const keyOf = (rc: VueToolCallRenderer<unknown>) =>
          `${rc.agentId ?? ""}:${rc.name}`;
        const key = keyOf({
          name: tool.name,
          agentId: tool.agentId,
        } as VueToolCallRenderer<unknown>);

        onCleanup(() => {
          const current =
            copilotkit.renderToolCalls as VueToolCallRenderer<unknown>[];
          const filtered = current.filter((rc) => keyOf(rc) !== key);
          copilotkit.setRenderToolCalls(filtered);
        });
      },
      { immediate: true },
    );
  } else {
    // Legacy HumanInTheLoopConfig path
    const config = configOrTool as HumanInTheLoopConfig<Args>;
    copilotkit.addHumanInTheLoop(config as HumanInTheLoopConfig);

    onScopeDispose(() => {
      copilotkit.removeTool(config.name, config.agentId);
    });
  }
}
