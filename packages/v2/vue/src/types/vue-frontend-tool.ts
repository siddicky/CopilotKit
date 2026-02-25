import { FrontendTool } from "@copilotkitnext/core";
import type { VueToolCallRenderer } from "./vue-tool-call-renderer";

/**
 * A frontend tool that can optionally include a Vue render function
 * for displaying the tool call in the UI.
 */
export type VueFrontendTool<
  T extends Record<string, unknown> = Record<string, unknown>,
> = FrontendTool<T> & {
  render?: VueToolCallRenderer<T>["render"];
};
