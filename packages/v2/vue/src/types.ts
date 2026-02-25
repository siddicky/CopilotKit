import type { AbstractAgent } from "@ag-ui/client";
import type { FrontendTool, FrontendToolHandlerContext } from "@copilotkitnext/core";
import type { Component } from "vue";
import type { z } from "zod";

/**
 * Vue-specific tool call status types, mirroring the Angular pattern.
 * @deprecated Use `VueToolCallRendererRenderProps` from `./types/vue-tool-call-renderer` instead.
 */
export type VueToolCall<
  Args extends Record<string, unknown> = Record<string, unknown>,
> =
  | {
      args: Partial<Args>;
      status: "in-progress";
      result: undefined;
    }
  | {
      args: Args;
      status: "executing";
      result: undefined;
    }
  | {
      args: Args;
      status: "complete";
      result: string;
    };

/**
 * @deprecated Use `VueHumanInTheLoopRenderProps` from `./types/vue-human-in-the-loop` instead.
 */
export type HumanInTheLoopToolCall<
  Args extends Record<string, unknown> = Record<string, unknown>,
> =
  | {
      args: Partial<Args>;
      status: "in-progress";
      result: undefined;
      respond: (result: unknown) => void;
    }
  | {
      args: Args;
      status: "executing";
      result: undefined;
      respond: (result: unknown) => void;
    }
  | {
      args: Args;
      status: "complete";
      result: string;
      respond: (result: unknown) => void;
    };

/**
 * Configuration for CopilotKit plugin.
 */
export interface CopilotKitConfig {
  runtimeUrl?: string;
  headers?: Record<string, string>;
  properties?: Record<string, unknown>;
  agents?: Record<string, AbstractAgent>;
  tools?: FrontendTool[];
}

/**
 * Configuration for a frontend tool in Vue.
 */
export interface FrontendToolConfig<
  Args extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  description: string;
  parameters: z.ZodType<Args>;
  handler: (
    args: Args,
    context: FrontendToolHandlerContext,
  ) => Promise<unknown>;
  agentId?: string;
}

/**
 * Configuration for a render tool call in Vue.
 * @deprecated Use `VueToolCallRenderer` from `./types/vue-tool-call-renderer` instead.
 */
export interface RenderToolCallConfig<
  Args extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  args: z.ZodType<Args>;
  component: Component;
  agentId?: string;
}

/**
 * Configuration for a human-in-the-loop tool in Vue.
 * @deprecated Use `VueHumanInTheLoop` from `./types/vue-human-in-the-loop` instead.
 */
export interface HumanInTheLoopConfig<
  Args extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  description: string;
  parameters: z.ZodType<Args>;
  component: Component;
  agentId?: string;
}
