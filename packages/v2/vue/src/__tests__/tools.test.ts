import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { CopilotKitPlugin } from "../copilotkit";
import { useFrontendTool } from "../use-frontend-tool";
import { useRenderToolCall } from "../use-render-tool-call";
import { useHumanInTheLoop } from "../use-human-in-the-loop";
import type { VueHumanInTheLoop } from "../types/vue-human-in-the-loop";

const mockAddTool = vi.fn();
const mockRemoveTool = vi.fn();
const mockGetTool = vi.fn().mockReturnValue(undefined);
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });

vi.mock("@copilotkitnext/core", () => {
  class MockCopilotKitCore {
    readonly subscribe = mockSubscribe;
    readonly addTool = mockAddTool;
    readonly removeTool = mockRemoveTool;
    readonly getTool = mockGetTool;
    readonly setRuntimeUrl = vi.fn();
    readonly setHeaders = vi.fn();
    readonly setProperties = vi.fn();
    readonly setAgents__unsafe_dev_only = vi.fn();
    readonly getAgent = vi.fn();
    readonly addContext = vi.fn();
    readonly removeContext = vi.fn();
    agents: Record<string, any> = {};

    async notifySubscribers(
      _callback: (subscriber: unknown) => void,
      _errorPrefix: string,
    ): Promise<void> {
      // No-op for testing
    }

    constructor() {
      mockSubscribe.mockImplementationOnce((listener: any) => {
        return { unsubscribe: vi.fn() };
      });
    }
  }

  return { CopilotKitCore: MockCopilotKitCore } as any;
});

describe("useFrontendTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers tool on mount and removes on unmount", () => {
    const handler = vi.fn().mockResolvedValue("result");

    const Comp = defineComponent({
      setup() {
        useFrontendTool({
          name: "search",
          description: "Search stuff",
          parameters: {} as any,
          handler,
        });
        return () => h("div");
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(mockAddTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "search" }),
    );

    wrapper.unmount();

    expect(mockRemoveTool).toHaveBeenCalledWith("search", undefined);
  });

  it("passes agentId when removing scoped tool", () => {
    const Comp = defineComponent({
      setup() {
        useFrontendTool({
          name: "tool",
          description: "Scoped tool",
          parameters: {} as any,
          handler: vi.fn().mockResolvedValue("ok"),
          agentId: "agent-1",
        });
        return () => h("div");
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    wrapper.unmount();

    expect(mockRemoveTool).toHaveBeenCalledWith("tool", "agent-1");
  });
});

describe("useRenderToolCall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers render tool call on mount and removes on unmount", () => {
    const DummyComponent = defineComponent({ template: "<div/>" });

    const Comp = defineComponent({
      setup() {
        useRenderToolCall({
          name: "chart",
          args: {} as any,
          component: DummyComponent,
        });
        return () => h("div");
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    wrapper.unmount();

    expect(mockRemoveTool).toHaveBeenCalledWith("chart", undefined);
  });
});

describe("useHumanInTheLoop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers human-in-the-loop tool on mount and removes on unmount", () => {
    const DummyComponent = defineComponent({ template: "<div/>" });

    const Comp = defineComponent({
      setup() {
        useHumanInTheLoop({
          name: "approval",
          description: "Require approval",
          parameters: {} as any,
          component: DummyComponent,
        });
        return () => h("div");
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    // Should register tool on core
    expect(mockAddTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "approval" }),
    );

    wrapper.unmount();

    expect(mockRemoveTool).toHaveBeenCalledWith("approval", undefined);
  });

  it("registers VueHumanInTheLoop with render component and wired handler", () => {
    const renderFn = (props: any) => h("div", String(props.status));

    const tool: VueHumanInTheLoop = {
      name: "confirm",
      description: "Confirm action",
      parameters: {} as any,
      render: renderFn,
    };

    const Comp = defineComponent({
      setup() {
        useHumanInTheLoop(tool);
        return () => h("div");
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    // Should register tool on core via useFrontendTool
    expect(mockAddTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "confirm",
        description: "Confirm action",
      }),
    );

    // The registered tool should have a handler (promise-based)
    const registeredTool = mockAddTool.mock.calls.find(
      (call: any[]) => call[0]?.name === "confirm",
    );
    expect(registeredTool).toBeDefined();
    expect(typeof registeredTool![0].handler).toBe("function");

    wrapper.unmount();

    expect(mockRemoveTool).toHaveBeenCalledWith("confirm", undefined);
  });
});
