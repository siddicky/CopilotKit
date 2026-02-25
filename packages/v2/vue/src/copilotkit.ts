import type { InjectionKey, Plugin } from "vue";
import { inject, provide, reactive } from "vue";
import type { AbstractAgent } from "@ag-ui/client";
import { CopilotKitCoreVue } from "./lib/vue-core";
import type { VueToolCallRenderer } from "./types/vue-tool-call-renderer";
import type {
  CopilotKitConfig,
  FrontendToolConfig,
  RenderToolCallConfig,
  HumanInTheLoopConfig,
} from "./types";

/**
 * The injection key used to provide/inject the CopilotKit instance in a Vue component tree.
 */
export const CopilotKitKey: InjectionKey<CopilotKitInstance> =
  Symbol("CopilotKit");

/**
 * The CopilotKit instance exposed to Vue composables via `useCopilotKit()`.
 */
export interface CopilotKitInstance {
  /** The underlying Vue-specific core (extends CopilotKitCore). */
  readonly core: CopilotKitCoreVue;

  /** Reactive list of registered render tool call configs. */
  readonly toolCallRenderConfigs: RenderToolCallConfig[];

  /** Reactive list of registered frontend tool configs. */
  readonly frontendToolConfigs: FrontendToolConfig[];

  /** Reactive list of registered human-in-the-loop tool configs. */
  readonly humanInTheLoopConfigs: HumanInTheLoopConfig[];

  /** Reactive snapshot of registered agents. */
  readonly agents: Record<string, AbstractAgent>;

  /** Add a render tool call configuration. */
  addRenderToolCall(config: RenderToolCallConfig): void;

  /** Register a frontend tool. */
  addFrontendTool(config: FrontendToolConfig): void;

  /** Register a human-in-the-loop tool. */
  addHumanInTheLoop(config: HumanInTheLoopConfig): void;

  /** Map of pending human-in-the-loop respond callbacks, keyed by toolCall.id. */
  readonly pendingHitlResponders: Map<string, (result: unknown) => void>;

  /** Vue-typed render tool calls registered on the core. */
  readonly renderToolCalls: Readonly<VueToolCallRenderer<unknown>[]>;

  /** Replace the set of render tool calls on the core. */
  setRenderToolCalls(renderToolCalls: VueToolCallRenderer<unknown>[]): void;

  /** Remove a tool by name and optional agent ID. */
  removeTool(name: string, agentId?: string): void;

  /** Get an agent by ID. */
  getAgent(agentId: string): AbstractAgent | undefined;

  /** Update runtime configuration. */
  updateRuntime(options: {
    runtimeUrl?: string;
    headers?: Record<string, string>;
    properties?: Record<string, unknown>;
    agents?: Record<string, AbstractAgent>;
  }): void;
}

function createCopilotKitInstance(config: CopilotKitConfig): CopilotKitInstance {
  const core = new CopilotKitCoreVue({
    runtimeUrl: config.runtimeUrl,
    headers: config.headers,
    properties: config.properties,
    agents__unsafe_dev_only: config.agents,
    tools: config.tools,
  });

  const pendingHitlResponders = new Map<string, (result: unknown) => void>();

  const state = reactive({
    toolCallRenderConfigs: [] as RenderToolCallConfig[],
    frontendToolConfigs: [] as FrontendToolConfig[],
    humanInTheLoopConfigs: [] as HumanInTheLoopConfig[],
    agents: { ...(config.agents ?? {}) } as Record<string, AbstractAgent>,
  });

  core.subscribe({
    onAgentsChanged: () => {
      Object.assign(state.agents, core.agents);
      // Remove any keys that are no longer present
      for (const key of Object.keys(state.agents)) {
        if (!(key in core.agents)) {
          delete state.agents[key];
        }
      }
    },
  });

  function isSameAgentId<T extends { agentId?: string }>(
    target: T,
    agentId?: string,
  ): boolean {
    return agentId ? target.agentId === agentId : true;
  }

  const instance: CopilotKitInstance = {
    core,

    get toolCallRenderConfigs() {
      return state.toolCallRenderConfigs;
    },
    get frontendToolConfigs() {
      return state.frontendToolConfigs;
    },
    get humanInTheLoopConfigs() {
      return state.humanInTheLoopConfigs;
    },
    get agents() {
      return state.agents;
    },
    get pendingHitlResponders() {
      return pendingHitlResponders;
    },

    get renderToolCalls() {
      return core.renderToolCalls;
    },

    setRenderToolCalls(renderToolCalls: VueToolCallRenderer<unknown>[]): void {
      core.setRenderToolCalls(renderToolCalls);
    },

    addRenderToolCall(renderConfig: RenderToolCallConfig): void {
      // Render tools are UI-only and should not be registered with the core runtime.
      // They are tracked locally for rendering purposes only.
      state.toolCallRenderConfigs.push(renderConfig);
    },

    addFrontendTool(toolConfig: FrontendToolConfig): void {
      core.addTool(toolConfig);
      state.frontendToolConfigs.push(toolConfig);
    },

    addHumanInTheLoop(hitlConfig: HumanInTheLoopConfig): void {
      core.addTool({
        name: hitlConfig.name,
        description: hitlConfig.description,
        parameters: hitlConfig.parameters,
        agentId: hitlConfig.agentId,
        handler: async (_args, { toolCall }) => {
          return new Promise<unknown>((resolve) => {
            pendingHitlResponders.set(toolCall.id, (result) => {
              pendingHitlResponders.delete(toolCall.id);
              resolve(result);
            });
          });
        },
      });
      state.humanInTheLoopConfigs.push(hitlConfig);
    },

    removeTool(toolName: string, agentId?: string): void {
      core.removeTool(toolName, agentId);

      const keep = (config: { name: string; agentId?: string }) =>
        config.name !== toolName ||
        (agentId === undefined
          ? !!config.agentId
          : !isSameAgentId(config, agentId));

      state.frontendToolConfigs.splice(
        0,
        state.frontendToolConfigs.length,
        ...state.frontendToolConfigs.filter(keep),
      );
      state.humanInTheLoopConfigs.splice(
        0,
        state.humanInTheLoopConfigs.length,
        ...state.humanInTheLoopConfigs.filter(keep),
      );
      state.toolCallRenderConfigs.splice(
        0,
        state.toolCallRenderConfigs.length,
        ...state.toolCallRenderConfigs.filter(keep),
      );
    },

    getAgent(agentId: string): AbstractAgent | undefined {
      return core.getAgent(agentId);
    },

    updateRuntime(options): void {
      if (options.runtimeUrl !== undefined) {
        core.setRuntimeUrl(options.runtimeUrl);
      }
      if (options.headers !== undefined) {
        core.setHeaders(options.headers);
      }
      if (options.properties !== undefined) {
        core.setProperties(options.properties);
      }
      if (options.agents !== undefined) {
        core.setAgents__unsafe_dev_only(options.agents);
      }
    },
  };

  return instance;
}

/**
 * Vue plugin that installs CopilotKit into the application.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { CopilotKitPlugin } from '@copilotkitnext/vue';
 *
 * const app = createApp(App);
 * app.use(CopilotKitPlugin, { runtimeUrl: '/api/copilotkit' });
 * ```
 */
export const CopilotKitPlugin: Plugin<[CopilotKitConfig?]> = {
  install(app, config = {}) {
    const instance = createCopilotKitInstance(config);
    app.provide(CopilotKitKey, instance);
  },
};

/**
 * Provide a CopilotKit instance in the current component's subtree.
 * Useful for component-level scoping as an alternative to the plugin.
 *
 * @example
 * ```ts
 * // In setup()
 * provideCopilotKit({ runtimeUrl: '/api/copilotkit' });
 * ```
 */
export function provideCopilotKit(config: CopilotKitConfig): CopilotKitInstance {
  const instance = createCopilotKitInstance(config);
  provide(CopilotKitKey, instance);
  return instance;
}

/**
 * Inject the CopilotKit instance from the closest provider in the component tree.
 *
 * @example
 * ```ts
 * // In setup()
 * const copilotkit = useCopilotKit();
 * ```
 */
export function useCopilotKit(): CopilotKitInstance {
  const instance = inject(CopilotKitKey);
  if (!instance) {
    throw new Error(
      "useCopilotKit() requires a CopilotKit provider. " +
        "Use app.use(CopilotKitPlugin, config) or provideCopilotKit(config) in a parent component.",
    );
  }
  return instance;
}
