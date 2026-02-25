import { describe, it, expect, vi, beforeEach } from "vitest";
import { CopilotKitCoreVue } from "../lib/vue-core";
import type { CopilotKitCoreVueSubscriber } from "../lib/vue-core";

const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
const mockNotifySubscribers = vi.fn();

vi.mock("@copilotkitnext/core", () => {
  class MockCopilotKitCore {
    readonly subscribe = mockSubscribe;
    readonly addTool = vi.fn();
    readonly removeTool = vi.fn();
    readonly setRuntimeUrl = vi.fn();
    readonly setHeaders = vi.fn();
    readonly setProperties = vi.fn();
    readonly setAgents__unsafe_dev_only = vi.fn();
    readonly getAgent = vi.fn();
    readonly addContext = vi.fn();
    readonly removeContext = vi.fn();
    agents: Record<string, unknown> = {};

    // Expose notifySubscribers for subclass use
    async notifySubscribers(
      callback: (subscriber: unknown) => void,
      _errorPrefix: string,
    ): Promise<void> {
      mockNotifySubscribers(callback);
      // Actually invoke the callback for each registered subscriber
      for (const sub of this._subscribers) {
        callback(sub);
      }
    }

    private _subscribers: unknown[] = [];

    constructor() {
      mockSubscribe.mockImplementation((subscriber: unknown) => {
        this._subscribers.push(subscriber);
        return {
          unsubscribe: () => {
            this._subscribers = this._subscribers.filter((s) => s !== subscriber);
          },
        };
      });
    }
  }

  return { CopilotKitCore: MockCopilotKitCore } as any;
});

describe("CopilotKitCoreVue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("constructor initializes with provided renderToolCalls", () => {
    const renderer = { name: "test", args: {} as any, render: () => null };
    const core = new CopilotKitCoreVue({
      renderToolCalls: [renderer],
    } as any);

    expect(core.renderToolCalls).toHaveLength(1);
    expect(core.renderToolCalls[0]).toBe(renderer);
  });

  it("constructor defaults to empty arrays when renderers not provided", () => {
    const core = new CopilotKitCoreVue({} as any);

    expect(core.renderToolCalls).toHaveLength(0);
    expect(core.renderActivityMessages).toHaveLength(0);
    expect(core.renderCustomMessages).toHaveLength(0);
  });

  it("constructor initializes renderActivityMessages and renderCustomMessages", () => {
    const activityRenderer = { name: "activity", render: () => null };
    const customRenderer = { position: "before" as const, render: () => null };
    const core = new CopilotKitCoreVue({
      renderActivityMessages: [activityRenderer],
      renderCustomMessages: [customRenderer],
    } as any);

    expect(core.renderActivityMessages).toHaveLength(1);
    expect(core.renderCustomMessages).toHaveLength(1);
  });

  it("setRenderToolCalls updates renderToolCalls", () => {
    const core = new CopilotKitCoreVue({} as any);

    const renderer = { name: "updated", args: {} as any, render: () => null };
    core.setRenderToolCalls([renderer]);

    expect(core.renderToolCalls).toHaveLength(1);
    expect(core.renderToolCalls[0]).toEqual(renderer);
  });

  it("setRenderToolCalls creates a copy of the array", () => {
    const core = new CopilotKitCoreVue({} as any);

    const renderers = [{ name: "test", args: {} as any, render: () => null }];
    core.setRenderToolCalls(renderers);

    // Mutating the original array should not affect the internal state
    renderers.push({ name: "extra", args: {} as any, render: () => null });
    expect(core.renderToolCalls).toHaveLength(1);
  });

  it("setRenderToolCalls notifies subscribers with onRenderToolCallsChanged", () => {
    const core = new CopilotKitCoreVue({} as any);
    const onRenderToolCallsChanged = vi.fn();

    core.subscribe({ onRenderToolCallsChanged } as CopilotKitCoreVueSubscriber);

    const renderer = { name: "test", args: {} as any, render: () => null };
    core.setRenderToolCalls([renderer]);

    expect(onRenderToolCallsChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        copilotkit: core,
        renderToolCalls: expect.arrayContaining([expect.objectContaining({ name: "test" })]),
      }),
    );
  });

  it("subscribe returns a subscription with unsubscribe", () => {
    const core = new CopilotKitCoreVue({} as any);
    const subscriber = { onRenderToolCallsChanged: vi.fn() };
    const sub = core.subscribe(subscriber);

    expect(sub).toHaveProperty("unsubscribe");
    expect(typeof sub.unsubscribe).toBe("function");
  });
});
