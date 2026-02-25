import { FrontendTool, ToolCallStatus } from "@copilotkitnext/core";
import type { Component, VNodeChild } from "vue";

export type VueHumanInTheLoopRenderProps<T> =
  | {
      name: string;
      description: string;
      args: Partial<T>;
      status: ToolCallStatus.InProgress;
      result: undefined;
      respond: undefined;
    }
  | {
      name: string;
      description: string;
      args: T;
      status: ToolCallStatus.Executing;
      result: undefined;
      respond: (result: unknown) => Promise<void>;
    }
  | {
      name: string;
      description: string;
      args: T;
      status: ToolCallStatus.Complete;
      result: string;
      respond: undefined;
    };

export type VueHumanInTheLoopRenderFn<T> =
  | ((props: VueHumanInTheLoopRenderProps<T>) => VNodeChild)
  | Component<VueHumanInTheLoopRenderProps<T>>;

/**
 * A human-in-the-loop tool definition for Vue.
 * Unlike a regular frontend tool, the handler is omitted because it is
 * automatically generated from the render function.
 */
export type VueHumanInTheLoop<
  T extends Record<string, unknown> = Record<string, unknown>,
> = Omit<FrontendTool<T>, "handler"> & {
  render: VueHumanInTheLoopRenderFn<T>;
};
