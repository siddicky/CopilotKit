import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { CopilotKitPlugin } from "../copilotkit";
import { useConfigureSuggestions } from "../use-configure-suggestions";
import { useSuggestions } from "../use-suggestions";
import type { UseSuggestionsResult } from "../use-suggestions";

const mockAddSuggestionsConfig = vi.fn().mockReturnValue("suggestions-1");
const mockRemoveSuggestionsConfig = vi.fn();
const mockReloadSuggestions = vi.fn();
const mockClearSuggestions = vi.fn();
const mockGetSuggestions = vi.fn().mockReturnValue({ suggestions: [], isLoading: false });
const mockSubscribe = vi.fn();

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
    readonly addSuggestionsConfig = mockAddSuggestionsConfig;
    readonly removeSuggestionsConfig = mockRemoveSuggestionsConfig;
    readonly reloadSuggestions = mockReloadSuggestions;
    readonly clearSuggestions = mockClearSuggestions;
    readonly getSuggestions = mockGetSuggestions;
    agents: Record<string, any> = {};

    async notifySubscribers(
      _callback: (subscriber: unknown) => void,
      _errorPrefix: string,
    ): Promise<void> {
      // No-op for testing
    }

    constructor() {
      mockSubscribe.mockImplementation((listener: any) => {
        return { unsubscribe: vi.fn() };
      });
    }
  }

  return { CopilotKitCore: MockCopilotKitCore } as any;
});

describe("useConfigureSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddSuggestionsConfig.mockReturnValue("suggestions-1");
  });

  it("registers config on mount and removes on unmount", () => {
    const Comp = defineComponent({
      setup() {
        useConfigureSuggestions({
          suggestions: [{ title: "Help", message: "Help me" }],
        });
        return () => h("div");
      },
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(mockAddSuggestionsConfig).toHaveBeenCalled();

    wrapper.unmount();

    expect(mockRemoveSuggestionsConfig).toHaveBeenCalledWith("suggestions-1");
  });

  it("does not register when config is null", () => {
    const Comp = defineComponent({
      setup() {
        useConfigureSuggestions(null);
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(mockAddSuggestionsConfig).not.toHaveBeenCalled();
  });

  it("does not register when available is disabled", () => {
    const Comp = defineComponent({
      setup() {
        useConfigureSuggestions({
          available: "disabled",
          suggestions: [{ title: "X", message: "Y" }],
        } as any);
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(mockAddSuggestionsConfig).not.toHaveBeenCalled();
  });

  it("reloads suggestions on registration", () => {
    const Comp = defineComponent({
      setup() {
        useConfigureSuggestions({
          suggestions: [{ title: "Go", message: "Go now" }],
        });
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(mockReloadSuggestions).toHaveBeenCalled();
  });

  it("registers dynamic suggestions config", () => {
    const Comp = defineComponent({
      setup() {
        useConfigureSuggestions({
          instructions: "Generate 3 follow-up questions",
        });
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(mockAddSuggestionsConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: "Generate 3 follow-up questions",
      }),
    );
  });
});

describe("useSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSuggestions.mockReturnValue({ suggestions: [], isLoading: false });
  });

  it("initializes with current suggestions from core", () => {
    mockGetSuggestions.mockReturnValue({
      suggestions: [{ title: "Test", message: "Test message", isLoading: false }],
      isLoading: false,
    });

    let result: UseSuggestionsResult | undefined;

    const Comp = defineComponent({
      setup() {
        result = useSuggestions();
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(result).toBeDefined();
    expect(result!.suggestions.value).toHaveLength(1);
    expect(result!.suggestions.value[0].title).toBe("Test");
    expect(result!.isLoading.value).toBe(false);
  });

  it("initializes with loading state from core", () => {
    mockGetSuggestions.mockReturnValue({
      suggestions: [],
      isLoading: true,
    });

    let result: UseSuggestionsResult | undefined;

    const Comp = defineComponent({
      setup() {
        result = useSuggestions();
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(result!.isLoading.value).toBe(true);
  });

  it("sets up subscription on mount", () => {
    const Comp = defineComponent({
      setup() {
        useSuggestions();
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    // subscribe should be called (once for agents in plugin + once for suggestions)
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("reloadSuggestions calls core.reloadSuggestions", () => {
    let result: UseSuggestionsResult | undefined;

    const Comp = defineComponent({
      setup() {
        result = useSuggestions();
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    result!.reloadSuggestions();

    expect(mockReloadSuggestions).toHaveBeenCalled();
  });

  it("clearSuggestions calls core.clearSuggestions", () => {
    let result: UseSuggestionsResult | undefined;

    const Comp = defineComponent({
      setup() {
        result = useSuggestions();
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    result!.clearSuggestions();

    expect(mockClearSuggestions).toHaveBeenCalled();
  });

  it("accepts custom agentId option", () => {
    const Comp = defineComponent({
      setup() {
        useSuggestions({ agentId: "custom-agent" });
        return () => h("div");
      },
    });

    mount(Comp, {
      global: {
        plugins: [[CopilotKitPlugin, {}]],
      },
    });

    expect(mockGetSuggestions).toHaveBeenCalledWith("custom-agent");
  });
});
