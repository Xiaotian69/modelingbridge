// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCase } from "../api/client";
import { questStages } from "../quest/stages";
import { loadQuestDraft } from "../quest/storage";
import { readPromptVars } from "./library/PromptDetail";
import { QuestPage } from "./Quest";

vi.mock("../api/client", () => ({ getCase: vi.fn() }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

const renderQuest = (url = "/quest") =>
  render(
    <MemoryRouter initialEntries={[url]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <QuestPage />
    </MemoryRouter>,
  );
const stageButton = (name: RegExp) =>
  within(screen.getByRole("navigation", { name: "七关进度" })).getByRole("button", { name });
const answerBox = () => screen.getByRole("textbox");

describe("七关实战 batch 3", () => {
  it("lets a later stage be previewed and drafted, but completion stays in order (Q4)", () => {
    renderQuest();
    fireEvent.click(stageButton(/数据侦查/));
    expect(screen.getByRole("heading", { name: "数据侦查" })).toBeInTheDocument();
    expect(screen.getByText(/预览模式/)).toHaveTextContent("需先完成第 1 关「读题破冰」");
    fireEvent.change(answerBox(), { target: { value: "必须字段：日期、区域、订单数；缺失天气时用邻近站点数据替代并人工核验。" } });
    within(screen.getByRole("group", { name: "通关条件（自检）" }))
      .getAllByRole("checkbox")
      .forEach((box) => fireEvent.click(box));
    expect(screen.getByRole("button", { name: /确认完成/ })).toBeDisabled();
    expect(screen.getByText("确认完成需要先完成第 1 关。")).toBeInTheDocument();
    const draft = loadQuestDraft("default");
    expect(draft?.states.find((s) => s.stageId === "data")?.answer).toContain("必须字段");
  });

  it("walks one stage end to end: answer, self-check, confirm, move on", () => {
    renderQuest();
    const confirm = () => screen.getByRole("button", { name: /确认完成/ });
    expect(confirm()).toBeDisabled();
    fireEvent.change(answerBox(), { target: { value: "目标是预测各区域需求并在车辆总数约束下调度；约束有总车数和运营成本；还需确认时间粒度。" } });
    expect(confirm()).toBeDisabled();
    expect(screen.getByText(/勾选全部通关条件/)).toBeInTheDocument();
    within(screen.getByRole("group", { name: "通关条件（自检）" }))
      .getAllByRole("checkbox")
      .forEach((box) => fireEvent.click(box));
    fireEvent.click(confirm());
    expect(screen.getByRole("heading", { name: questStages[1].title })).toBeInTheDocument();
    expect(screen.getByText("1/7 关已通关")).toBeInTheDocument();
    expect(stageButton(/读题破冰/)).toHaveTextContent("已通关");
    fireEvent.click(screen.getByRole("button", { name: "保存实战报告" }));
    expect(screen.getByText("已保存到本机学习记录。")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("mb_records") || "[]")[0].title).toContain("七关实战报告");
  });

  it("falls back to the bundled teaching case when there is no case API (static hosting)", async () => {
    vi.mocked(getCase).mockRejectedValue(new Error("offline"));
    renderQuest("/quest?case=wine-evaluation-demo");
    expect(await screen.findByRole("heading", { name: /葡萄酒综合评价/ })).toBeInTheDocument();
    expect(screen.queryByText(/没有找到这道训练题/)).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "换一道训练题" })).toHaveValue("wine-evaluation-demo");
  });

  it("shows an honest notice for an unknown case and keeps the default problem", async () => {
    vi.mocked(getCase).mockRejectedValue(new Error("404"));
    renderQuest("/quest?case=does-not-exist");
    expect(await screen.findByText(/没有找到这道训练题/)).toBeInTheDocument();
  });

  it("offers related prompts that open the library and pre-fill only the public problem text", () => {
    renderQuest();
    const link = screen.getByRole("link", { name: "赛题拆解 · 基础版" });
    expect(link).toHaveAttribute("href", "/library/prompts/pr.breakdown.base?back=%2Fquest");
    fireEvent.change(answerBox(), { target: { value: "这是我自己的作答，不应该被带进提示词。" } });
    fireEvent.click(link);
    const vars = readPromptVars("pr.breakdown.base");
    expect(vars.values["题目内容"]).toContain("共享单车");
    expect(Object.values(vars.values).join("")).not.toContain("我自己的作答");
    expect(vars.prefilled).toEqual(["题目内容"]);
  });

  it("asks before resetting and keeps everything when cancelled", async () => {
    renderQuest();
    fireEvent.change(answerBox(), { target: { value: "一段需要保留的草稿内容，长度足够二十个字。" } });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "重置本题进度" }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(answerBox()).toHaveValue("一段需要保留的草稿内容，长度足够二十个字。");
    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "重置本题进度" }));
    await waitFor(() => expect(answerBox()).toHaveValue(""));
  });
});
