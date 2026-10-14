// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkillsPage } from "./Skills";

function Where() {
  const { pathname, search } = useLocation();
  return <span data-testid="where">{pathname + search}</span>;
}
const renderAt = (path = "/library/skills") =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/library/skills" element={<SkillsPage />} />
        <Route path="/library/skills/:skillId" element={<SkillsPage />} />
      </Routes>
      <Where />
    </MemoryRouter>,
  );
const output = () => (screen.getByLabelText("生成的技能全文") as HTMLTextAreaElement).value;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AI 技能包页面", () => {
  it("默认零填写即可得到完整的国赛赛题分析技能，并说明网站不调用 AI", () => {
    renderAt();
    expect(screen.getByRole("heading", { level: 1, name: "AI 建模技能包" })).toBeInTheDocument();
    expect(screen.getByText(/模桥不调用任何 AI/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /赛题分析/, pressed: true })).toBeInTheDocument();
    expect(output()).toContain("# 数学建模技能｜赛题分析（国赛）");
    expect(output()).toContain("表 3 隐含条件");
    // 没有必填项；可选项默认收起
    expect(document.querySelectorAll("[required]")).toHaveLength(0);
    expect(screen.getByText(/更多选项/).closest("details")).not.toHaveAttribute("open");
  });

  it("切换赛事后，赛事规范随之改变，并记住选择", () => {
    renderAt();
    fireEvent.click(screen.getByRole("radio", { name: "美赛 MCM/ICM" }));
    expect(output()).toContain("（美赛）");
    expect(output()).toMatch(/25 页以内/);
    expect(screen.getByTestId("where")).toHaveTextContent("contest=mcm");
    cleanup();
    renderAt("/library/skills/data");
    expect(output()).toContain("数据诊断与处理（美赛）");
  });

  it("切换步骤会更新地址和标题；论文写作可以选写哪一部分", () => {
    renderAt("/library/skills/analysis?contest=cumcm");
    fireEvent.click(screen.getByRole("button", { name: /论文写作/ }));
    expect(screen.getByTestId("where")).toHaveTextContent("/library/skills/paper?contest=cumcm");
    expect(output()).toContain("制定全文提纲与篇幅预算");
    fireEvent.click(screen.getByRole("radio", { name: "摘要" }));
    expect(output()).toContain("撰写摘要");
    fireEvent.click(screen.getByRole("radio", { name: "指定章节" }));
    fireEvent.change(screen.getByLabelText(/章节名称/), { target: { value: "5.2 问题二" } });
    expect(output()).toContain("「5.2 问题二」");
  });

  it("接着上一步：粘贴的交接包进入技能文本", () => {
    renderAt("/library/skills/model");
    fireEvent.click(screen.getByRole("radio", { name: "接着上一步" }));
    fireEvent.change(screen.getByLabelText(/上一步的交接包/), { target: { value: "| 题号与总目标 | B 题：最小化成本 |" } });
    expect(output()).toContain("## 附：上一步交接包");
    expect(output()).toContain("B 题：最小化成本");
  });

  it("审阅模式与高级选项会改变输出；与本步无关的选项不出现", () => {
    renderAt("/library/skills/model?mode=review");
    expect(screen.getByRole("radio", { name: "审阅已有成果" })).toBeChecked();
    expect(output()).toContain("## 5. 审阅方法");
    fireEvent.click(screen.getByText(/更多选项/));
    fireEvent.change(screen.getByLabelText("选做的题目"), { target: { value: "C 题" } });
    fireEvent.change(screen.getByLabelText("代码语言"), { target: { value: "MATLAB" } });
    expect(output()).toContain("我们选做：C 题。");
    expect(output()).toContain("代码使用 MATLAB");
    expect(screen.getByText(/已设置 2 项/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/队伍情况/)).not.toBeInTheDocument();
  });

  it("选题评估只有从头开始", () => {
    renderAt("/library/skills/choose?mode=review");
    expect(screen.queryByRole("radio", { name: "审阅已有成果" })).not.toBeInTheDocument();
    expect(output()).toContain("本次模式：从头开始");
  });

  it("复制成功给出下一步提示；失败时选中全文并说明手动复制", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderAt();
    fireEvent.click(screen.getByRole("button", { name: "复制全文" }));
    await screen.findByText(/已复制。打开你常用的 AI/);
    expect(writeText).toHaveBeenCalledWith(output());
    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(screen.getByRole("button", { name: "复制全文" }));
    await screen.findByText(/浏览器不允许写入剪贴板/);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("生成的技能全文")));
  });

  it("可以下载本步和全流程 .md 文件", () => {
    const create = vi.fn(() => "blob:x");
    vi.stubGlobal("URL", { ...URL, createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderAt("/library/skills/validate?contest=apmcm");
    fireEvent.click(screen.getByRole("button", { name: "下载本步 .md" }));
    fireEvent.click(screen.getByRole("button", { name: "下载全流程技能包" }));
    expect(create).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledTimes(2);
  });

  it("未知技能显示提示", () => {
    renderAt("/library/skills/nope");
    expect(screen.getByRole("alert")).toHaveTextContent("没有找到这个技能");
  });
});
