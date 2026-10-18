// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { CHALLENGE_STORAGE_KEY } from "../challenge/config";
import { LEARNING_KEY } from "../state/learningStore";
import { ROLES_STORAGE_KEY, TASKS } from "./content";

beforeAll(async () => {
  await import("./RolesPage");
});
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderAt = (path = "/learn/team-roles") =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
    </MemoryRouter>,
  );
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const saved = () => JSON.parse(localStorage.getItem(ROLES_STORAGE_KEY)!);

async function openIntro() {
  expect(await screen.findByRole("heading", { level: 1, name: "找到你的建模起点" }, { timeout: 3000 })).toBeInTheDocument();
}

function answerExperience() {
  for (const name of ["exp-model", "exp-code", "exp-write"]) {
    const group = document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
    fireEvent.click(name === "exp-code" ? group[0] : group[1]); // 编程：没接触过；其余：学过一点
  }
  click("下一步");
}

/** 按任务顺序作答：correct 里的分工答对，skip 里的跳过，其余选第一个错误项。 */
function answerTasks(correct: string[], skip: string[] = []) {
  for (const t of TASKS) {
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(t.prompt);
    if (skip.includes(t.role)) {
      click("暂时判断不了");
      expect(document.querySelector(".roles-feedback")).toHaveTextContent("不算答错");
    } else {
      const ids = correct.includes(t.role) ? t.answer : [t.options.find((o) => !t.answer.includes(o.id))!.id];
      for (const id of ids) fireEvent.click(screen.getByLabelText(new RegExp(escape(t.options.find((o) => o.id === id)!.label))));
      click("确认答案");
      expect(document.querySelector(".roles-feedback")).toHaveTextContent(correct.includes(t.role) ? "答对了" : "和参考答案不同");
    }
    click("下一步");
  }
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("/learn/team-roles", () => {
  it("warns when progress cannot be saved while still allowing exploration", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
    renderAt();
    await openIntro();
    click("开始探索");
    expect(screen.getByRole("status")).toHaveTextContent("无法保存进度");
    expect(screen.queryByText("进度已自动保存在本机，可以随时离开。")).not.toBeInTheDocument();
    answerExperience();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("哪些事你愿意多花时间");
  });

  it("walks through all 12 steps and explains the evidence behind each suggestion", async () => {
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({ v: 1, step: "result", result: "data", answers: {} }));
    localStorage.setItem(LEARNING_KEY, JSON.stringify({ marker: "keep" }));
    const challengeBefore = localStorage.getItem(CHALLENGE_STORAGE_KEY);
    const learningBefore = localStorage.getItem(LEARNING_KEY);

    renderAt();
    await openIntro();
    expect(screen.getByText(/和 3 分钟招新小游戏有什么不同/)).toBeInTheDocument();
    click("开始探索");

    expect(screen.getByText(/第 1 \/ 12 步/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "三项都选一个后继续" })).toBeDisabled();
    answerExperience();

    // 兴趣：最多 3 项，第 4 项不可选
    for (const label of ["把一个模糊的问题拆成几个能算的小问题", "把团队的思路写成别人一读就懂的文字", "设计一张图，让读者一眼看出结论"])
      fireEvent.click(screen.getByLabelText(label));
    expect(screen.getByLabelText("想清楚哪些因素可以忽略、为什么可以忽略")).toBeDisabled();
    click("下一步：开始小任务");

    answerTasks(["model", "write"], ["code"]);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("哪类你最想再多做几道");
    fireEvent.click(screen.getByLabelText(/^建模类/));
    click("看本次结果");

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("可以先尝试：建模手、论文手");
    const model = screen.getByRole("region", { name: "建模手" });
    expect(within(model).getByText("可以先从这里开始")).toBeInTheDocument();
    expect(within(model).getByText(/3 题中答对 3、答错 0、跳过 0/)).toBeInTheDocument();
    expect(within(model).getByText("做完任务后，选了想再多做这类任务")).toBeInTheDocument();
    const code = screen.getByRole("region", { name: "编程手" });
    expect(within(code).getByText("本次证据不足")).toBeInTheDocument();
    expect(within(code).getByText(/跳过 3/)).toBeInTheDocument();
    expect(within(code).getByText(/还没接触过很正常/)).toBeInTheDocument();
    expect(within(code).getByText(/本次没有观察到/)).toBeInTheDocument();
    expect(within(code).getByRole("link", { name: /线性规划交互实验室/ })).toHaveAttribute("href", "/learn/linear-programming/lab");
    expect(screen.getByRole("link", { name: "七关实战：校园共享单车案例" })).toHaveAttribute("href", "/quest?case=bike-demand-demo");
    expect(screen.getByText(/不是能力鉴定，也不是人格结论/)).toBeInTheDocument();
    // 只给计数，不给百分比或分数
    expect(document.querySelector(".roles-result")!.textContent).not.toMatch(/%|百分|分数/);

    expect(saved().step).toBe("result");
    expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).toBe(challengeBefore);
    expect(localStorage.getItem(LEARNING_KEY)).toBe(learningBefore);
  });

  it("saves after every step, offers to resume, and can start over", async () => {
    renderAt();
    await openIntro();
    click("开始探索");
    answerExperience();
    click("下一步：开始小任务");
    const first = TASKS[0];
    fireEvent.click(screen.getByLabelText(first.options.find((o) => o.id === first.answer[0])!.label));
    click("确认答案");
    expect(saved()).toMatchObject({ step: 2, answers: { tasks: { [first.id]: { choice: first.answer } } } });

    // 离开再回来：先问继续还是重新开始
    cleanup();
    renderAt();
    await openIntro();
    expect(screen.getByText("上次做到第 3 / 12 步。")).toBeInTheDocument();
    click("继续上次");
    // 已确认的题保持锁定并显示讲解
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(first.prompt);
    expect(document.querySelector(".roles-feedback")).toHaveTextContent("答对了");
    expect(screen.queryByRole("button", { name: "确认答案" })).not.toBeInTheDocument();
    // 上一步可以回去改自评
    click("上一步");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("哪些事你愿意多花时间");

    click("重新开始");
    expect(localStorage.getItem(ROLES_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("button", { name: "开始探索" })).toBeInTheDocument();
  });

  it("shows a finished result directly on return, and restarting clears only its own record", async () => {
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify({ v: 1, step: "intro", answers: {} }));
    localStorage.setItem(
      ROLES_STORAGE_KEY,
      JSON.stringify({ v: 1, step: "result", answers: { experience: {}, interests: [], tasks: {}, preference: ["unsure"] } }),
    );
    renderAt();
    expect(await screen.findByRole("heading", { level: 1, name: "本次没有哪个方向特别突出" }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "第零课：认识数学建模" })).toHaveAttribute("href", "/learn/introduction");
    click("重新开始（清除本次记录）");
    expect(localStorage.getItem(ROLES_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByRole("button", { name: "开始探索" })).toBeInTheDocument();
  });

  it("ignores broken saved data and uses native, keyboard-operable controls", async () => {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify({ v: 9, step: 99 }));
    renderAt();
    await openIntro();
    expect(screen.queryByText(/上次做到/)).not.toBeInTheDocument();
    click("开始探索");
    expect(screen.getAllByRole("radio")).toHaveLength(12);
    answerExperience();
    click("下一步：开始小任务");
    // 多选题只能选到参考答案的个数；跳过按钮始终可用
    const multiIndex = TASKS.findIndex((t) => t.kind === "multi");
    for (let i = 0; i < multiIndex; i++) {
      click("暂时判断不了");
      click("下一步");
    }
    const multi = TASKS[multiIndex];
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(multi.options.length);
    fireEvent.click(boxes[2]);
    fireEvent.click(boxes[3]);
    expect(boxes[0]).toBeDisabled();
    expect(screen.getByRole("button", { name: "确认答案" })).toBeEnabled();
    click("确认答案");
    expect(document.querySelector(".roles-feedback")).toHaveTextContent("和参考答案不同");
    expect(screen.getAllByText(/参考答案：/)).toHaveLength(multi.answer.length);
  });

  it("does not replace or redirect the recruitment challenge", async () => {
    renderAt("/challenge?src=poster");
    expect(await screen.findByRole("button", { name: "开始挑战" }, { timeout: 3000 })).toBeInTheDocument();
    expect(localStorage.getItem(ROLES_STORAGE_KEY)).toBeNull();
  });
});
