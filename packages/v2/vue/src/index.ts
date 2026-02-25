// Re-export AG-UI runtime and types to provide a single import surface
// This helps avoid version mismatches by letting apps import everything from '@copilotkitnext/vue'
export * from "@ag-ui/client";

// Vue composables and utilities for CopilotKit
export * from "./copilotkit";
// Legacy types (CopilotKitConfig, FrontendToolConfig, RenderToolCallConfig, HumanInTheLoopConfig, etc.)
// Maintained for backward compatibility. Prefer the Vue-specific types below for new code.
export * from "./types";
export * from "./use-agent";
export * from "./use-frontend-tool";
export * from "./use-render-tool-call";
export * from "./use-human-in-the-loop";
export * from "./use-agent-context";
export * from "./use-configure-suggestions";
export * from "./use-suggestions";

// Vue-specific types (VueToolCallRenderer, VueHumanInTheLoop, VueFrontendTool, etc.)
// These are the recommended types for new code.
export * from "./types/index";

// Vue-specific core and utilities
export * from "./lib/vue-core";
export * from "./lib/render-utils";
