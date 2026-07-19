import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A minimal hook harness so the SearchableModelPicker component function can
// be invoked directly (the repo has no DOM/preact render harness). State is
// stored per hook-call index and persists between simulated renders.
vi.mock("preact/hooks", () => {
  const harness = {
    slots: [],
    cursor: 0,
    effects: [],
  };
  harness.beginRender = () => {
    harness.cursor = 0;
    harness.effects = [];
  };
  harness.reset = () => {
    harness.slots = [];
    harness.cursor = 0;
    harness.effects = [];
  };
  const useState = (initialValue) => {
    const index = harness.cursor++;
    if (!(index in harness.slots)) {
      harness.slots[index] =
        typeof initialValue === "function" ? initialValue() : initialValue;
    }
    const setState = (next) => {
      harness.slots[index] =
        typeof next === "function" ? next(harness.slots[index]) : next;
    };
    return [harness.slots[index], setState];
  };
  const useRef = (initialValue = null) => {
    const index = harness.cursor++;
    if (!(index in harness.slots)) {
      harness.slots[index] = { current: initialValue };
    }
    return harness.slots[index];
  };
  const useMemo = (factory) => factory();
  const useEffect = (effect) => {
    harness.effects.push(effect);
  };
  return { useState, useRef, useMemo, useEffect, __harness: harness };
});

import { SearchableModelPicker } from "../../lib/public/js/components/models-tab/model-picker.js";
import * as preactHooks from "preact/hooks";

const harness = preactHooks.__harness;
// Hook call order in the component: useState(query)=0, useState(open)=1, useRef=2.
const kQuerySlot = 0;
const kOpenSlot = 1;
const kRootRefSlot = 2;

const renderPicker = (props = {}) => {
  harness.beginRender();
  return SearchableModelPicker(props);
};

const collectVnodes = (node, out = []) => {
  if (node == null || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const child of node) collectVnodes(child, out);
    return out;
  }
  out.push(node);
  if (node.props) collectVnodes(node.props.children, out);
  return out;
};

const findAllByType = (tree, type) =>
  collectVnodes(tree).filter((vnode) => vnode.type === type);

const collectText = (node, out = []) => {
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, out);
    return out;
  }
  if (node && typeof node === "object" && node.props) {
    collectText(node.props.children, out);
  }
  return out;
};

const treeText = (tree) => collectText(tree).join(" ");

const kOptions = [
  { key: "anthropic/claude-opus-4-6", label: "Opus 4.6" },
  { key: "anthropic/claude-sonnet-4-6", label: "Sonnet 4.6" },
  { key: "openai/gpt-5.5", label: "gpt-5.5" },
];
const kPopular = [{ key: "openai/gpt-5.5" }, { key: "missing/model" }];

describe("frontend/models-tab SearchableModelPicker", () => {
  beforeEach(() => {
    harness.reset();
  });

  afterEach(() => {
    delete global.document;
  });

  it("registers and cleans up the outside-pointer listener", () => {
    const listeners = {};
    global.document = {
      addEventListener: vi.fn((name, handler) => {
        listeners[name] = handler;
      }),
      removeEventListener: vi.fn(),
    };
    renderPicker({});
    expect(harness.effects).toHaveLength(1);
    const cleanup = harness.effects[0]();
    const handler = listeners.mousedown;
    expect(typeof handler).toBe("function");

    // rootRef.current is null -> pointer counts as outside -> closes.
    harness.slots[kOpenSlot] = true;
    handler({ target: {} });
    expect(harness.slots[kOpenSlot]).toBe(false);

    // Pointer inside the root keeps the dropdown open.
    harness.slots[kRootRefSlot].current = { contains: () => true };
    harness.slots[kOpenSlot] = true;
    handler({ target: {} });
    expect(harness.slots[kOpenSlot]).toBe(true);

    cleanup();
    expect(global.document.removeEventListener).toHaveBeenCalledWith(
      "mousedown",
      handler,
    );
  });

  it("opens on focus, tracks input, and ignores Enter with no options", () => {
    const tree = renderPicker({});
    const input = findAllByType(tree, "input")[0];
    expect(input).toBeTruthy();

    input.props.onFocus();
    expect(harness.slots[kOpenSlot]).toBe(true);

    input.props.onInput({ target: { value: "sonnet" } });
    expect(harness.slots[kQuerySlot]).toBe("sonnet");
    expect(harness.slots[kOpenSlot]).toBe(true);

    // No visible options: Enter is a no-op, other keys fall through.
    harness.slots[kQuerySlot] = "";
    input.props.onKeyDown({ key: "Enter" });
    input.props.onKeyDown({ key: "ArrowDown" });
    expect(harness.slots[kOpenSlot]).toBe(true);
  });

  it("groups open options with a popular section and selects on click", () => {
    const onSelect = vi.fn();
    harness.slots[kOpenSlot] = true;
    const tree = renderPicker({
      options: kOptions,
      popularModels: kPopular,
      onSelect,
    });

    const text = treeText(tree);
    expect(text).toContain("POPULAR");
    expect(text).toContain("ANTHROPIC");
    expect(text).toContain("OPENAI");

    const buttons = findAllByType(tree, "button");
    // 1 visible popular model (missing/model filtered out) + 3 options.
    expect(buttons).toHaveLength(4);

    const preventDefault = vi.fn();
    buttons[0].props.onMouseDown({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);

    buttons[0].props.onClick();
    expect(onSelect).toHaveBeenCalledWith("openai/gpt-5.5");
    expect(harness.slots[kQuerySlot]).toBe("");
    expect(harness.slots[kOpenSlot]).toBe(false);
  });

  it("selects the first visible option on Enter and closes on Escape", () => {
    const onSelect = vi.fn();
    harness.slots[kOpenSlot] = true;
    const tree = renderPicker({ options: kOptions, onSelect });
    const input = findAllByType(tree, "input")[0];

    const preventDefault = vi.fn();
    input.props.onKeyDown({ key: "Enter", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("anthropic/claude-opus-4-6");
    expect(harness.slots[kOpenSlot]).toBe(false);

    harness.slots[kOpenSlot] = true;
    input.props.onKeyDown({ key: "Escape" });
    expect(harness.slots[kOpenSlot]).toBe(false);
  });

  it("filters options by query and hides the popular section", () => {
    harness.slots[kQuerySlot] = "sonnet";
    harness.slots[kOpenSlot] = true;
    const tree = renderPicker({
      options: kOptions,
      popularModels: kPopular,
    });

    const text = treeText(tree);
    expect(text).not.toContain("POPULAR");
    expect(text).toContain("ANTHROPIC");

    const buttons = findAllByType(tree, "button");
    expect(buttons).toHaveLength(1);
    // Exercises the default onSelect noop.
    buttons[0].props.onClick();
    expect(harness.slots[kOpenSlot]).toBe(false);
  });

  it("explains when the only match is already configured", () => {
    harness.slots[kQuerySlot] = "gpt";
    harness.slots[kOpenSlot] = true;
    const tree = renderPicker({
      options: [kOptions[0], kOptions[1]],
      configuredOptions: [{ key: "openai/gpt-5.5", label: "gpt-5.5" }],
    });

    const text = treeText(tree);
    expect(text).toContain("Already added above:");
    expect(text).toContain("GPT-5.5");
    expect(findAllByType(tree, "button")).toHaveLength(0);
  });

  it("summarizes multiple already-configured matches", () => {
    harness.slots[kQuerySlot] = "gpt";
    harness.slots[kOpenSlot] = true;
    const tree = renderPicker({
      options: [],
      configuredOptions: [
        { key: "openai/gpt-5.5", label: "gpt-5.5" },
        { key: "openai/gpt-5.6-sol", label: "gpt-5.6-sol" },
      ],
    });

    expect(treeText(tree)).toContain(
      "2 matching models are already added above.",
    );
  });

  it("shows the empty state when nothing matches", () => {
    harness.slots[kQuerySlot] = "zzz-no-match";
    harness.slots[kOpenSlot] = true;
    const tree = renderPicker({
      options: kOptions,
      configuredOptions: [{ key: "openai/gpt-5.5", label: "gpt-5.5" }],
    });

    expect(treeText(tree)).toContain("No models match that search.");
  });

  it("stays closed and inert while disabled", () => {
    const onSelect = vi.fn();
    harness.slots[kOpenSlot] = true;
    const tree = renderPicker({
      options: kOptions,
      onSelect,
      disabled: true,
    });

    // Dropdown suppressed even though open state is true.
    expect(findAllByType(tree, "button")).toHaveLength(0);

    const input = findAllByType(tree, "input")[0];
    harness.slots[kOpenSlot] = false;
    input.props.onFocus();
    expect(harness.slots[kOpenSlot]).toBe(false);

    const preventDefault = vi.fn();
    input.props.onKeyDown({ key: "Enter", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
