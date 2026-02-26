import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { CopilotKitBridge } from "./CopilotKitBridge";
import type { VueToReactBridge, StateBridge } from "../bridge/types";

interface CopilotKitAppProps {
  vueToReactBridge: VueToReactBridge;
  stateBridge: StateBridge;
}

/**
 * Top-level React component tree mounted inside the Vue host.
 * Wraps children in the CopilotKit provider, connecting to the
 * Express runtime via the Vite dev server proxy.
 */
export function CopilotKitApp({
  vueToReactBridge,
  stateBridge,
}: CopilotKitAppProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="default">
      <CopilotKitBridge
        vueToReactBridge={vueToReactBridge}
        stateBridge={stateBridge}
      />
    </CopilotKit>
  );
}
