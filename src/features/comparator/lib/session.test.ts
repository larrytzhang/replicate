import { describe, it, expect, beforeEach } from "vitest";
import { getShareUrl, parseUrlParams } from "./session";

function setSearch(search: string) {
  window.history.pushState({}, "", search);
}

describe("parseUrlParams", () => {
  beforeEach(() => {
    setSearch("/");
  });

  it("returns null when there is no modality param", () => {
    expect(parseUrlParams()).toBeNull();
  });

  it("returns null when modality is not recognized", () => {
    setSearch("?modality=audio");
    expect(parseUrlParams()).toBeNull();
  });

  it("parses modality=text", () => {
    setSearch("?modality=text");
    expect(parseUrlParams()?.modality).toBe("text");
  });

  it("parses modality=image", () => {
    setSearch("?modality=image");
    expect(parseUrlParams()?.modality).toBe("image");
  });

  it("parses a valid comma-separated model list", () => {
    setSearch("?modality=text&models=llama-3-8b,llama-3-70b");
    expect(parseUrlParams()?.selectedModelIds).toEqual([
      "llama-3-8b",
      "llama-3-70b",
    ]);
  });

  it("filters out unknown model IDs from a share link", () => {
    setSearch("?modality=text&models=llama-3-8b,fake-model");
    expect(parseUrlParams()?.selectedModelIds).toEqual(["llama-3-8b"]);
  });

  it("returns an empty model list when no models param is present", () => {
    setSearch("?modality=text");
    expect(parseUrlParams()?.selectedModelIds).toEqual([]);
  });

  it("decodes a plain prompt", () => {
    setSearch("?modality=text&prompt=hello%20world");
    expect(parseUrlParams()?.prompt).toBe("hello world");
  });

  it("decodes a base64 prompt when prompt_b64 is present", () => {
    const longPrompt = "a".repeat(200);
    const b64 = btoa(encodeURIComponent(longPrompt));
    setSearch(`?modality=text&prompt_b64=${b64}`);
    expect(parseUrlParams()?.prompt).toBe(longPrompt);
  });

  it("returns an empty prompt when prompt_b64 is malformed", () => {
    setSearch("?modality=text&prompt_b64=not-valid-base64!!!");
    expect(parseUrlParams()?.prompt).toBe("");
  });

  it("clamps preference values to the 0-100 range", () => {
    setSearch("?modality=text&q=500&c=-20&s=75");
    expect(parseUrlParams()?.preferences).toEqual({
      quality: 100,
      cost: 0,
      speed: 75,
    });
  });

  it("defaults preferences to 50 when missing", () => {
    setSearch("?modality=text");
    expect(parseUrlParams()?.preferences).toEqual({
      quality: 50,
      cost: 50,
      speed: 50,
    });
  });

  it("defaults a non-numeric preference back to 50", () => {
    setSearch("?modality=text&q=banana");
    expect(parseUrlParams()?.preferences.quality).toBe(50);
  });

  it("caps prompt length at 10,000 characters", () => {
    const huge = "x".repeat(15_000);
    setSearch(`?modality=text&prompt=${huge}`);
    expect(parseUrlParams()?.prompt.length).toBe(10_000);
  });
});

describe("getShareUrl", () => {
  beforeEach(() => {
    setSearch("/");
  });

  it("uses a plain prompt param for short prompts", () => {
    const url = getShareUrl({
      modality: "text",
      selectedModelIds: ["llama-3-8b"],
      prompt: "short prompt",
      preferences: { quality: 50, cost: 50, speed: 50 },
    });
    expect(url).toContain("prompt=short+prompt");
    expect(url).not.toContain("prompt_b64");
  });

  it("switches to base64 encoding for prompts longer than 100 chars", () => {
    const longPrompt = "z".repeat(200);
    const url = getShareUrl({
      modality: "text",
      selectedModelIds: ["llama-3-8b"],
      prompt: longPrompt,
      preferences: { quality: 50, cost: 50, speed: 50 },
    });
    expect(url).toContain("prompt_b64=");
    expect(url).not.toMatch(/[?&]prompt=/);
  });

  it("round-trips a short-prompt session through the URL", () => {
    const input = {
      modality: "text" as const,
      selectedModelIds: ["llama-3-8b", "llama-3-70b"],
      prompt: "test prompt",
      preferences: { quality: 70, cost: 20, speed: 10 },
    };
    const url = getShareUrl(input);
    setSearch(new URL(url).search);
    const parsed = parseUrlParams();
    expect(parsed?.modality).toBe(input.modality);
    expect(parsed?.selectedModelIds).toEqual(input.selectedModelIds);
    expect(parsed?.prompt).toBe(input.prompt);
    expect(parsed?.preferences).toEqual(input.preferences);
  });

  it("round-trips a long-prompt session through base64 encoding", () => {
    const longPrompt = "hello ".repeat(100);
    const input = {
      modality: "text" as const,
      selectedModelIds: ["llama-3-8b"],
      prompt: longPrompt,
      preferences: { quality: 50, cost: 50, speed: 50 },
    };
    const url = getShareUrl(input);
    setSearch(new URL(url).search);
    expect(parseUrlParams()?.prompt).toBe(longPrompt);
  });
});
