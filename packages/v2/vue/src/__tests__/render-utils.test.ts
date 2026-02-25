import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import { normalizeVueRenderer } from "../lib/render-utils";
import { defineToolCallRenderer } from "../types/define-tool-call-renderer";
import { z } from "zod";
import type { VueToolCallRendererRenderProps } from "../types";

describe("normalizeVueRenderer", () => {
  it("returns render function as-is when given a plain function", () => {
    const renderFn = (props: VueToolCallRendererRenderProps<unknown>) =>
      h("div", String(props.name));
    const result = normalizeVueRenderer(renderFn);

    // Should be the same function reference, not wrapped
    expect(result).toBe(renderFn);
  });

  it("wraps a Vue component object in h()", () => {
    const MyComponent = defineComponent({
      props: ["name", "args", "status", "result"],
      setup() {
        return () => h("span", "component");
      },
    });

    const result = normalizeVueRenderer(MyComponent);

    // Should return a wrapper function, not the component itself
    expect(result).not.toBe(MyComponent);
    expect(typeof result).toBe("function");
  });

  it("wraps an SFC-like function with __vccOpts", () => {
    // Simulate a compiled SFC component (function with __vccOpts marker)
    const sfcComponent = Object.assign(
      () => h("div", "sfc"),
      { __vccOpts: { setup: () => () => h("div") } },
    );

    const result = normalizeVueRenderer(sfcComponent as any);

    // Should be wrapped (not returned as-is) since it's detected as a component
    expect(result).not.toBe(sfcComponent);
    expect(typeof result).toBe("function");
  });

  it("wraps a function component with setup property", () => {
    // Simulate a component with a setup property
    const component = Object.assign(
      () => h("div"),
      { setup: () => () => h("div") },
    );

    const result = normalizeVueRenderer(component as any);

    expect(result).not.toBe(component);
    expect(typeof result).toBe("function");
  });

  it("treats a plain zero-parameter function as a render function", () => {
    // A plain arrow function with no parameters — NOT a component
    const plainFn = () => h("div", "plain");

    const result = normalizeVueRenderer(plainFn as any);

    // Should be returned as-is since it has no Vue component markers
    expect(result).toBe(plainFn);
  });

  it("wraps a plain object component", () => {
    // Options API component as a plain object
    const objectComponent = {
      render() {
        return h("div", "options");
      },
    };

    const result = normalizeVueRenderer(objectComponent as any);

    // typeof objectComponent === "object", so it should be wrapped
    expect(result).not.toBe(objectComponent);
    expect(typeof result).toBe("function");
  });
});

describe("defineToolCallRenderer", () => {
  it("creates wildcard renderer with z.any() when args omitted", () => {
    const renderer = defineToolCallRenderer({
      name: "*",
      render: () => h("div"),
    });

    expect(renderer.name).toBe("*");
    expect(renderer.args).toBeDefined();
    // z.any() accepts anything
    expect(renderer.args.parse("hello")).toBe("hello");
    expect(renderer.args.parse(42)).toBe(42);
  });

  it("creates wildcard renderer with provided args schema", () => {
    const schema = z.object({ query: z.string() });
    const renderer = defineToolCallRenderer({
      name: "*",
      args: schema,
      render: () => h("div"),
    } as any);

    expect(renderer.name).toBe("*");
    expect(renderer.args).toBe(schema);
  });

  it("creates named renderer with provided args schema", () => {
    const schema = z.object({ query: z.string() });
    const renderer = defineToolCallRenderer({
      name: "search",
      args: schema,
      render: () => h("div"),
    });

    expect(renderer.name).toBe("search");
    expect(renderer.args).toBe(schema);
  });

  it("throws when named renderer omits args", () => {
    expect(() =>
      defineToolCallRenderer({
        name: "search",
        render: () => h("div"),
      } as any),
    ).toThrow(
      'defineToolCallRenderer: "args" schema is required for named renderer "search"',
    );
  });

  it("passes agentId through when provided", () => {
    const renderer = defineToolCallRenderer({
      name: "*",
      render: () => h("div"),
      agentId: "agent-1",
    });

    expect(renderer.agentId).toBe("agent-1");
  });

  it("omits agentId when not provided", () => {
    const renderer = defineToolCallRenderer({
      name: "*",
      render: () => h("div"),
    });

    expect(renderer).not.toHaveProperty("agentId");
  });
});
