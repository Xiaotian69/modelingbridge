// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { publishedPrompts } from "../content/prompts";
import { PromptsPage } from "./Prompts";

const writeText = vi.fn();
Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  writeText.mockReset();
});

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/library/prompts" element={<PromptsPage />} />
        <Route path="/library/prompts/:promptId" element={<PromptsPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("提示词库", () => {
  it("lists every published template and filters by 用途", () => {
    renderAt("/library/prompts");
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(publishedPrompts.length);
    fireEvent.click(screen.getByRole("radio", { name: "代码调试" }));
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: "全部用途" }));
    fireEvent.change(screen.getByPlaceholderText("搜索提示词…"), { target: { value: "完全不存在的词" } });
    expect(screen.getByText("这个用途下还没有模板。")).toBeInTheDocument();
  });

  it("fills variables, copies the full prompt and says so (no placeholders left)", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts/pr.code.debug");
    expect(screen.getByRole("heading", { name: "代码报错排查" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "填入示例" }));
    expect(screen.getAllByText("示例，请替换").length).toBe(4);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("KeyError: '日期'"));
    expect(writeText.mock.calls[0][0]).not.toMatch(/\{[^}]+\}/);
    expect(screen.getByText("✓ 已复制完整提示词")).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem("mb.v2.promptVars.pr.code.debug") || "{}").values["编程语言"]).toContain("Python");
    expect(localStorage.length).toBe(0);
  });

  it("warns when placeholders are still empty", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts/pr.chart.plan");
    fireEvent.change(screen.getByLabelText(/我想表达的结论/), { target: { value: "调度后缺车率下降" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    expect(screen.getByText(/已复制。仍有 2 个占位符未填写：\{现有数据\}、\{图表计划\}/)).toBeInTheDocument();
  });

  it("falls back to a selected text box when the clipboard is refused", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    renderAt("/library/prompts/pr.ai.usage");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    expect(screen.getByText(/复制失败/)).toBeInTheDocument();
    const box = screen.getByLabelText("提示词全文，请手动复制") as HTMLTextAreaElement;
    await waitFor(() => expect(document.activeElement).toBe(box));
    expect(box.value).toContain("AI 使用记录");
  });

  it("quick-copies from the list with a placeholder warning", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制：赛题拆解 · 基础版" })));
    expect(screen.getByText(/已复制「赛题拆解 · 基础版」模板原文，其中有 3 个占位符未填写/)).toBeInTheDocument();
  });

  it("explains an unknown template id and only accepts a 七关 back link", () => {
    renderAt("/library/prompts/pr.nope.nope?back=https://evil.example");
    expect(screen.getByRole("alert")).toHaveTextContent("没有找到这条提示词");
    expect(screen.queryByText("← 回到七关实战")).not.toBeInTheDocument();
    cleanup();
    renderAt("/library/prompts/pr.breakdown.base?back=%2Fquest%3Fcase%3Dbike-demand-demo");
    expect(screen.getByRole("link", { name: "← 回到七关实战" })).toHaveAttribute("href", "/quest?case=bike-demand-demo");
  });
});
