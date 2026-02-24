import { watch, onScopeDispose, type Ref, isRef } from "vue";
import type { Context } from "@ag-ui/client";
import { useCopilotKit } from "./copilotkit";

/**
 * Composable that connects context to the agent. The context is automatically
 * removed when the component is unmounted.
 *
 * When a ref is passed, the context is updated reactively — the previous
 * context is removed and the new value is added whenever the ref changes.
 *
 * @example
 * ```ts
 * // Static context
 * useAgentContext({
 *   name: 'user-profile',
 *   description: 'Current user profile',
 *   value: JSON.stringify(userProfile),
 * });
 *
 * // Reactive context
 * const ctx = ref<Context>({ ... });
 * useAgentContext(ctx);
 * ```
 */
export function useAgentContext(context: Context | Ref<Context>): void {
  const copilotkit = useCopilotKit();
  let currentId: string | undefined;

  function addContext(value: Context): void {
    if (currentId !== undefined) {
      copilotkit.core.removeContext(currentId);
    }
    currentId = copilotkit.core.addContext(value);
  }

  if (isRef(context)) {
    watch(
      context,
      (newValue) => {
        addContext(newValue);
      },
      { immediate: true },
    );
  } else {
    addContext(context);
  }

  onScopeDispose(() => {
    if (currentId !== undefined) {
      copilotkit.core.removeContext(currentId);
      currentId = undefined;
    }
  });
}
