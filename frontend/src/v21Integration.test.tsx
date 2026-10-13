// @vitest-environment jsdom
// V2.1 release candidate: the AHP course, the LP lab and the 15-template
// prompt library come from three branches; check they still meet in one tree.
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";
import { lessonEntries, searchEntries, staticEntries } from "./app/searchIndex";
import { publishedPrompts } from "./content/prompts";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe("V2.1 modules in one tree", () => {
  it("indexes every published template once next to the AHP and LP entries", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    const promptIds = entries.filter((e) => e.group === "提示词").map((e) => e.href);
    expect(promptIds).toHaveLength(15);
    expect(new Set(promptIds).size).toBe(15);
    publishedPrompts.forEach((p) => expect(promptIds).toContain(`/library/prompts/${p.id}`));
    expect(entries.some((e) => e.href.startsWith("/learn/ahp"))).toBe(true);
    expect(entries.some((e) => e.href === "/learn/linear-programming/lab")).toBe(true);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the lab and the new templates findable side by side", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    expect(searchEntries(entries, "灵敏度", 10).some((h) => h.href === "/learn/linear-programming/lab")).toBe(true);
    expect(searchEntries(entries, "敏感性", 10).some((h) => h.href === "/library/prompts/pr.validation.sensitivity")).toBe(true);
    expect(searchEntries(entries, "AI 使用规则", 10).some((h) => h.href === "/library/prompts/pr.ai.rules")).toBe(true);
  });

  it.each([
    ["/library/prompts/pr.ai.rules", "国赛与美赛 AI 使用规则核对"],
    ["/library/prompts/pr.paper.selfcheck", null],
  ])("deep-links %s inside 资料中心", async (path, title) => {
    renderAt(path);
    if (title) expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "提示词库", current: "page" })).toHaveAttribute("href", "/library/prompts");
  });

  it("still opens the AHP course and the LP lab by URL", async () => {
    renderAt("/learn/linear-programming/lab");
    expect(await screen.findByRole("heading", { level: 1, name: /实验室/ })).toBeInTheDocument();
    cleanup();
    renderAt("/learn/ahp");
    expect(await screen.findByRole("heading", { level: 1, name: /三份实习/ })).toBeInTheDocument();
  });
});
