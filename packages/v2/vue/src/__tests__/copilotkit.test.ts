import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import {
  CopilotKitPlugin,
  CopilotKitKey,
  provideCopilotKit,
  useCopilotKit,
} from "../copilotkit";
import type { CopilotKitInstance } from "../copilotkit";

const mockSubscribe = vi.fn();
const mockAddTool = vi.fn();
const mockRemoveTool = vi.fn();
const mockSetRuntimeUrl = vi.fn();
const mockSetHeaders = vi.fn();
const mockSetProperties = vi.fn();
const mockSetAgents = vi.fn();
const mockGetAgent = vi.fn();
const mockAddContext = vi.fn().mockReturnValue("ctx-1");
const mockRemoveContext = vi.fn();

let lastCoreConfig: any;
let lastCoreInstance: any;

vi.mock("@copilotkitnext/core", () => {
  class MockCopilotKitCore {
    readonly subscribe = mockSubscribe;
    readonly addTool = mockAddTool;
    readonly removeTool = mockRemoveTool;
    readonly setRuntimeUrl = mockSetRuntimeUrl;
    readonly setHeaders = mockSetHeaders;
    readonly setProperties = mockSetProperties;
    readonly setAgents__unsafe_dev_only = mockSetAgents;
    readonly getAgent = mockGetAgent;
    readonly addContext = mockAddContext;
    readonly removeContext = mockRemoveContext;
    agents: Record<string, any> = {};
    listener?: any;

    async notifySubscribers(
      _callback: (subscriber: unknown) => void,
      _errorPrefix: string,
    ): Promise<void> {
      // No-op for testing
    }

    constructor(config: any) {
      lastCoreConfig = config;
      lastCoreInstance = this;
      mockSubscribe.mockImplementationOnce((listener: any) => {
        this.listener = listener;
        return { unsubscribe: vi.fn() };
      });
    }
  }

  return { CopilotKitCore: MockCopilotKitCore } as any;
});

describe("CopilotKitPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides CopilotKit instance via plugin", () => {
    let captured: CopilotKitInstance | undefined;

    const Child = defineComponent({
      setup() {
        captured = useCopilotKit();
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [
          [CopilotKitPlugin, { runtimeUrl: "https://runtime.local" }],
        ],
      },
    });

    expect(captured).toBeDefined();
    expect(lastCoreConfig.runtimeUrl).toBe("https://runtime.local");
  });

  it("initialises core with provided config", () => {
    const tools = [
      {
        name: "search",
        description: "Search",
        parameters: {} as any,
        handler: async () => "done",
      },
    ];

    const Child = defineComponent({
      setup() {
        useCopilotKit();
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [
          [
            CopilotKitPlugin,
            {
              runtimeUrl: "https://runtime.local",
              headers: { Authorization: "token" },
              properties: { region: "eu" },
              tools,
            },
          ],
        ],
      },
    });

    expect(lastCoreConfig.runtimeUrl).toBe("https://runtime.local");
    expect(lastCoreConfig.headers).toEqual({ Authorization: "token" });
    expect(lastCoreConfig.tools).toBe(tools);
  });
});

describe("provideCopilotKit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides CopilotKit at component level", () => {
    let captured: CopilotKitInstance | undefined;

    const Child = defineComponent({
      setup() {
        captured = useCopilotKit();
        return () => h("div");
      },
    });

    const Parent = defineComponent({
      setup() {
        provideCopilotKit({ runtimeUrl: "https://local" });
        return () => h(Child);
      },
    });

    mount(Parent);

    expect(captured).toBeDefined();
    expect(lastCoreConfig.runtimeUrl).toBe("https://local");
  });
});

describe("useCopilotKit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when no provider exists", () => {
    const Comp = defineComponent({
      setup() {
        useCopilotKit();
        return () => h("div");
      },
    });

    expect(() => mount(Comp)).toThrow("useCopilotKit() requires a CopilotKit provider");
  });

  it("addFrontendTool registers a tool on core", () => {
    let instance: CopilotKitInstance | undefined;

    const Child = defineComponent({
      setup() {
        instance = useCopilotKit();
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    const toolConfig = {
      name: "myTool",
      description: "A tool",
      parameters: {} as any,
      handler: vi.fn().mockResolvedValue("ok"),
    };

    instance!.addFrontendTool(toolConfig);

    expect(mockAddTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "myTool", description: "A tool" }),
    );
    expect(instance!.frontendToolConfigs).toHaveLength(1);
  });

  it("removeTool removes tool from core and configs", () => {
    let instance: CopilotKitInstance | undefined;

    const Child = defineComponent({
      setup() {
        instance = useCopilotKit();
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    instance!.addRenderToolCall({
      name: "temp",
      args: {} as any,
      component: defineComponent({ template: "" }),
    });

    expect(instance!.toolCallRenderConfigs).toHaveLength(1);

    instance!.removeTool("temp");

    expect(mockRemoveTool).toHaveBeenCalledWith("temp", undefined);
    expect(instance!.toolCallRenderConfigs).toHaveLength(0);
  });

  it("updateRuntime delegates to core methods", () => {
    let instance: CopilotKitInstance | undefined;

    const Child = defineComponent({
      setup() {
        instance = useCopilotKit();
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    instance!.updateRuntime({
      runtimeUrl: "https://other",
      headers: { Authorization: "different" },
      properties: { locale: "en" },
      agents: { a: {} as any },
    });

    expect(mockSetRuntimeUrl).toHaveBeenCalledWith("https://other");
    expect(mockSetHeaders).toHaveBeenCalledWith({ Authorization: "different" });
    expect(mockSetProperties).toHaveBeenCalledWith({ locale: "en" });
    expect(mockSetAgents).toHaveBeenCalledWith({ a: {} });
  });

  it("reflects agent updates from core subscriptions", async () => {
    let instance: CopilotKitInstance | undefined;

    const Child = defineComponent({
      setup() {
        instance = useCopilotKit();
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [[CopilotKitPlugin, { agents: { agent1: { id: "agent1" } as any } }]],
      },
    });

    const core = lastCoreInstance!;
    core.agents = { agent1: { id: "agent1" }, agent2: { id: "agent2" } };

    // Fire the onAgentsChanged callback
    core.listener!.onAgentsChanged();
    await nextTick();

    expect(instance!.agents).toHaveProperty("agent2");
  });
});
