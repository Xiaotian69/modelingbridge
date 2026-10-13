// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findPrompt, publishedPrompts } from "../content/prompts";
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
  it("fills examples only into empty fields and flags copied examples", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts/pr.code.debug");
    fireEvent.change(screen.getByLabelText(/代码片段/), { target: { value: "my_actual_code()" } });
    fireEvent.click(screen.getByRole("button", { name: "填入示例" }));
    expect(screen.getByLabelText(/代码片段/)).toHaveValue("my_actual_code()");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    expect(screen.getByRole("status", { name: "复制反馈" })).toHaveTextContent(/示例/);
  });

  it("copies the same full text as the preview including limits, without optional placeholders", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts/pr.code.debug");
    fireEvent.change(screen.getByLabelText(/编程语言/), { target: { value: "MATLAB R2024b" } });
    fireEvent.change(screen.getByLabelText(/代码片段/), { target: { value: "x = {1, 2};" } });
    fireEvent.change(screen.getByLabelText(/完整报错信息/), { target: { value: "索引超界" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    const output = writeText.mock.calls[0][0];
    expect(output).toContain(findPrompt("pr.code.debug")!.limits);
    expect(output).toContain("当届官方规则");
    expect(output).toContain("未提供");
    expect(output).not.toContain("{我已尝试}");
    expect(output).toContain("x = {1, 2};");
    expect(document.querySelector(".prompt-preview pre")?.textContent).toBe(output);
    expect(screen.getByText("✓ 已复制完整提示词")).toBeInTheDocument();
  });

  it("renders safely with malformed cached fields", () => {
    sessionStorage.setItem("mb.v2.promptVars.pr.code.debug", JSON.stringify({ values: { 编程语言: 7 }, examples: {}, prefilled: false }));
    renderAt("/library/prompts/pr.code.debug");
    expect(screen.getByLabelText(/编程语言/)).toHaveValue("");
  });

  it("combines contest and scene filters and retains the quest return when clearing", () => {
    renderAt("/library/prompts?back=%2Fquest%3Fcase%3Dbike-demand-demo");
    fireEvent.change(screen.getByRole("combobox", { name: "比赛类型" }), { target: { value: "CUMCM" } });
    fireEvent.click(screen.getByRole("radio", { name: "代码调试" }));
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /代码报错排查.*演示模板/ })).toHaveAttribute("href", expect.stringContaining("contest=CUMCM"));
    fireEvent.change(screen.getByPlaceholderText("搜索提示词…"), { target: { value: "完全不存在的词" } });
    fireEvent.click(screen.getByRole("button", { name: "查看全部" }));
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(15);
    expect(screen.getByRole("link", { name: "← 回到七关实战" })).toHaveAttribute("href", "/quest?case=bike-demand-demo");
  });

  it("offers only general templates for the general filter, and recovers invalid URL filters", () => {
    renderAt("/library/prompts?contest=general");
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(publishedPrompts.filter(p => p.contests.includes("general")).length);
    cleanup();
    renderAt("/library/prompts?contest=invalid&task=invalid");
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(15);
    expect(screen.getByRole("combobox", { name: "比赛类型" })).toHaveValue("");
  });

  it("clears a copy result as soon as the generated text changes", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts/pr.chart.plan");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    fireEvent.change(screen.getByLabelText(/我想表达的结论/), { target: { value: "新结论" } });
    expect(screen.getByRole("status", { name: "复制反馈" })).toBeEmptyDOMElement();
  });

  it("does not report an old asynchronous copy as the current edited text", async () => {
    let finish!: () => void;
    writeText.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    renderAt("/library/prompts/pr.code.debug");
    fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" }));
    expect(screen.getByRole("button", { name: "正在复制…" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/代码片段/), { target: { value: "edited_after_copy()" } });
    await act(async () => finish());
    expect(screen.getByRole("status", { name: "复制反馈" })).toBeEmptyDOMElement();
  });

  it("keeps separately saved values and resets copy feedback when switching templates", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts/pr.code.debug");
    fireEvent.change(screen.getByLabelText(/代码片段/), { target: { value: "my_saved_code()" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    fireEvent.click(screen.getByRole("link", { name: /图表方案评审.*演示模板/ }));
    expect(screen.getByRole("status", { name: "复制反馈" })).toBeEmptyDOMElement();
    expect(screen.getByLabelText(/我想表达的结论/)).toHaveValue("");
    fireEvent.click(screen.getByRole("link", { name: /代码报错排查.*演示模板/ }));
    expect(screen.getByLabelText(/代码片段/)).toHaveValue("my_saved_code()");
  });

  it("copies limitations from the list as well as from the detail", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制：赛题拆解 · 基础版" })));
    expect(writeText.mock.calls[0][0]).toContain(findPrompt("pr.breakdown.base")!.limits);
    expect(writeText.mock.calls[0][0]).toContain("{比赛名称}");
  });
  it("lists every published template and filters by 用途", () => {
    renderAt("/library/prompts");
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(publishedPrompts.length);
    expect(screen.getAllByText("待复核")).toHaveLength(publishedPrompts.length);
    expect(screen.queryByText("已审核")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "代码调试" }));
    expect(screen.getAllByRole("link", { name: /演示模板/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: "全部用途" }));
    fireEvent.change(screen.getByPlaceholderText("搜索提示词…"), { target: { value: "完全不存在的词" } });
    expect(screen.getByText("没有匹配当前用途、比赛和关键词的模板。")).toBeInTheDocument();
  });

  it("fills variables, copies the full prompt and says so (no placeholders left)", async () => {
    writeText.mockResolvedValue(undefined);
    renderAt("/library/prompts/pr.code.debug");
    expect(screen.getByRole("heading", { name: "代码报错排查" })).toBeInTheDocument();
    expect(screen.getByText("作者已自查，尚未经负责人审核")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "填入示例" }));
    expect(screen.getAllByText("示例，请替换").length).toBe(4);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "复制完整提示词" })));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("KeyError: '日期'"));
    expect(writeText.mock.calls[0][0]).not.toMatch(/\{[^}]+\}/);
    expect(screen.getByRole("status", { name: "复制反馈" })).toHaveTextContent("仍有 4 项使用示例");
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
