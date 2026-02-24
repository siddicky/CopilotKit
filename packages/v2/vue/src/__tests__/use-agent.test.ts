import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h, ref, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { CopilotKitPlugin } from "../copilotkit";
import { useAgent } from "../use-agent";
import type { AgentStore } from "../use-agent";
import type { Ref } from "vue";

class MockAgent {
  readonly agentId: string;
  messages: any[] = [];
  state: any;
  #listeners = new Set<any>();
  unsubscribeCount = 0;

  constructor(id: string) {
    this.agentId = id;
  }

  subscribe(subscriber: any) {
    this.#listeners.add(subscriber);
    return {
      unsubscribe: () => {
        this.#listeners.delete(subscriber);
        this.unsubscribeCount += 1;
      },
    };
  }

  emitMessages(messages: any[]) {
    this.messages = messages;
    for (const listener of this.#listeners) {
      listener.onMessagesChanged?.();
    }
  }

  emitState(state: any) {
    this.state = state;
    for (const listener of this.#listeners) {
      listener.onStateChanged?.();
    }
  }

  emitRunInitialized() {
    for (const listener of this.#listeners) {
      listener.onRunInitialized?.();
    }
  }

  emitRunFinalized() {
    for (const listener of this.#listeners) {
      listener.onRunFinalized?.();
    }
  }

  emitRunFailed() {
    for (const listener of this.#listeners) {
      listener.onRunFailed?.();
    }
  }
}

const mockGetAgent = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });

let coreAgents: Record<string, any> = {};

vi.mock("@copilotkitnext/core", () => {
  class MockCopilotKitCore {
    readonly subscribe = mockSubscribe;
    readonly addTool = vi.fn();
    readonly removeTool = vi.fn();
    readonly setRuntimeUrl = vi.fn();
    readonly setHeaders = vi.fn();
    readonly setProperties = vi.fn();
    readonly setAgents__unsafe_dev_only = vi.fn();
    readonly getAgent = mockGetAgent;
    readonly addContext = vi.fn();
    readonly removeContext = vi.fn();
    listener?: any;

    get agents() {
      return coreAgents;
    }

    constructor() {
      mockSubscribe.mockImplementationOnce((listener: any) => {
        this.listener = listener;
        return { unsubscribe: vi.fn() };
      });
    }
  }

  return { CopilotKitCore: MockCopilotKitCore } as any;
});

describe("useAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreAgents = {};
    mockGetAgent.mockReset();
  });

  it("resolves agent and tracks messages, state, and run status", async () => {
    const agent = new MockAgent("test-agent");
    coreAgents = { "test-agent": agent };
    mockGetAgent.mockImplementation((id: string) =>
      id === "test-agent" ? agent : undefined,
    );

    let store: Ref<AgentStore | undefined> | undefined;

    const Comp = defineComponent({
      setup() {
        const result = useAgent({ agentId: "test-agent" });
        store = result.agentStore;
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [
          [CopilotKitPlugin, { agents: { "test-agent": agent as any } }],
        ],
      },
    });

    await nextTick();

    expect(store?.value).toBeDefined();
    expect(store?.value?.agent).toBe(agent);

    // Test messages tracking
    agent.emitMessages([{ content: "Hello" }]);
    expect(store?.value?.messages.value).toEqual([{ content: "Hello" }]);

    // Test state tracking
    agent.emitState({ loaded: true });
    expect(store?.value?.state.value).toEqual({ loaded: true });

    // Test run status tracking
    agent.emitRunInitialized();
    expect(store?.value?.isRunning.value).toBe(true);

    agent.emitRunFailed();
    expect(store?.value?.isRunning.value).toBe(false);

    agent.emitRunInitialized();
    expect(store?.value?.isRunning.value).toBe(true);

    agent.emitRunFinalized();
    expect(store?.value?.isRunning.value).toBe(false);
  });

  it("returns undefined when agent is not found", async () => {
    coreAgents = {};
    mockGetAgent.mockReturnValue(undefined);

    let store: Ref<AgentStore | undefined> | undefined;

    const Comp = defineComponent({
      setup() {
        const result = useAgent({ agentId: "missing" });
        store = result.agentStore;
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    await nextTick();

    expect(store?.value).toBeUndefined();
  });
});
