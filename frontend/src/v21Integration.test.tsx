// @vitest-environment jsdom
// V2.1 release candidate: the AHP course, the LP lab and the 15-template
// prompt library come from three branches; check they still meet in one tree.
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";
import { lessonEntries, searchEntries, staticEntries } from "./app/searchIndex";
import { skills } from "./content/skills";

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
  it("indexes every AI skill once next to the AHP and LP entries", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    const skillHrefs = entries.filter((e) => e.group === "AI 技能").map((e) => e.href);
    expect(skillHrefs).toHaveLength(skills.length);
    skills.forEach((s) => expect(skillHrefs).toContain(`/library/skills/${s.id}`));
    expect(entries.some((e) => e.href.startsWith("/learn/ahp"))).toBe(true);
    expect(entries.some((e) => e.href === "/learn/linear-programming/lab")).toBe(true);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the lab and the skills findable side by side", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    expect(searchEntries(entries, "灵敏度", 10).some((h) => h.href === "/learn/linear-programming/lab")).toBe(true);
    expect(searchEntries(entries, "提示词", 10).some((h) => h.href.startsWith("/library/skills/"))).toBe(true);
    expect(searchEntries(entries, "论文", 10).some((h) => h.href === "/library/skills/paper")).toBe(true);
  });

  it.each([
    ["/library/prompts/pr.ai.rules", /论文写作/],
    ["/library/prompts/pr.paper.selfcheck", /论文写作/],
    ["/library/skills/validate", /结果分析与检验/],
  ])("deep-links %s inside 资料中心", async (path, title) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "AI 技能包", current: "page" })).toHaveAttribute("href", "/library/skills");
  });

  it("still opens the AHP course and the LP lab by URL", async () => {
    renderAt("/learn/linear-programming/lab");
    expect(await screen.findByRole("heading", { level: 1, name: /实验室/ })).toBeInTheDocument();
    cleanup();
    renderAt("/learn/ahp");
    expect(await screen.findByRole("heading", { level: 1, name: /三份实习/ })).toBeInTheDocument();
  });
});
