import { h, type Component, type VNodeChild } from "vue";
import type { VueToolCallRendererRenderProps } from "../types";

/**
 * Check if a function value is actually a Vue component rather than a render function.
 * Vue SFCs compile to functions/objects with specific markers.
 */
function isVueComponent(value: unknown): boolean {
  if (typeof value !== "function") return false;
  const fn = value as Record<string, unknown>;
  // __vccOpts: present on compiled SFC components
  // setup: Composition API component defined via defineComponent
  // render: Options API component defined via defineComponent
  return "__vccOpts" in fn || "setup" in fn || "render" in fn;
}

/**
 * Normalize a Vue component or render function to a render function.
 * If a Component is provided, returns `(props) => h(Component, props)`.
 */
export function normalizeVueRenderer<T>(
  render:
    | ((props: VueToolCallRendererRenderProps<T>) => VNodeChild)
    | Component<VueToolCallRendererRenderProps<T>>,
): (props: VueToolCallRendererRenderProps<T>) => VNodeChild {
  // Detect Vue component objects (SFC, Options API, or Composition API components)
  // by checking for internal Vue markers. If none match, treat as a render function.
  if (typeof render === "object" || isVueComponent(render)) {
    return (props: VueToolCallRendererRenderProps<T>) =>
      h(render as Component, props);
  }
  return render as (props: VueToolCallRendererRenderProps<T>) => VNodeChild;
}
