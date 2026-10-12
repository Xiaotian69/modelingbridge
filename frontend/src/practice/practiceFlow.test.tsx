// @vitest-environment jsdom
// End-to-end learning loop: answer wrong → feedback without the answer → nudge →
// read the related section → return bar → back to the same question, state restored.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { learning } from "../state/learning";
import { RETURN_KEY } from "../state/returnTicket";
import { PREFS_KEY } from "../app/prefsStore";

function Where() {
  const l = useLocation();
  return <span data-testid="where">{l.pathname + l.hash}</span>;
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  learning.resetForTests();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
// Lazy routes (the lesson bundles KaTeX) can exceed the 1 s default under a parallel test run.
const LAZY = { timeout: 5000 };
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );

it("keeps the answer hidden, then restores draft, attempts and help level after reading the lesson", async () => {
  renderAt("/practice/linear-programming/practice-1");
  const input = await screen.findByLabelText("你的数值答案", {}, LAZY);
  fireEvent.change(input, { target: { value: "1600" } });
  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
  const feedback = screen.getByRole("status");
  expect(feedback).toHaveTextContent("错误类型：只算了一种产品");
  expect(feedback).not.toHaveTextContent("2600"); // first wrong: no reference answer
  expect(screen.queryByText(/卡住了/)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
  expect(screen.getByText(/卡住了/)).toBeInTheDocument(); // one-off nudge on the second miss
  fireEvent.click(screen.getByRole("button", { name: "打开帮助" }));
  const ladder = screen.getByRole("region", { name: "帮助" });
  expect(within(ladder).getByRole("tab", { name: /完整解析/ })).toHaveTextContent("推荐");
  expect(ladder).not.toHaveTextContent("2600"); // recommended, but not opened for the learner
  fireEvent.click(within(ladder).getByRole("tab", { name: /2 线索/ }));
  expect(ladder).toHaveTextContent("40 × 40 + 50 × 20");

  // Feedback re-enters on every submission (motion), so query the current one.
  fireEvent.click(within(screen.getByRole("status")).getByRole("button", { name: /目标函数与检验/ }));
  expect(await screen.findByRole("region", { name: "回到原题" }, LAZY)).toBeInTheDocument();
  expect(screen.getByTestId("where")).toHaveTextContent("/learn/linear-programming#derive");
  const ticket = JSON.parse(sessionStorage.getItem(RETURN_KEY)!);
  expect(ticket.from.path).toBe("/practice/linear-programming/practice-1");
  expect(ticket.from.restore).toMatchObject({ anchorId: "exercise-feedback" }); // land back on the feedback

  fireEvent.click(screen.getByRole("link", { name: "← 回到 练习 1" }));
  expect(await screen.findByLabelText("你的数值答案", {}, LAZY)).toHaveValue("1600");
  expect(screen.getByText(/已恢复你的作答 · 已尝试 2 次 · 上次结果：还不对 · 提示看到第 2 级/)).toBeInTheDocument();
  expect(sessionStorage.getItem(RETURN_KEY)).toBeNull();
  // The page looks as the learner left it: same (deterministic) feedback, still no answer.
  const statuses = screen.getAllByRole("status").map((s) => s.textContent ?? "");
  expect(statuses.some((t) => t.includes("错误类型：只算了一种产品"))).toBe(true);
  expect(statuses.join(" ")).not.toContain("2600");
});

it("survives a full reload: the draft comes back from local storage", async () => {
  renderAt("/practice/linear-programming/practice-3");
  fireEvent.change(await screen.findByLabelText("你的数值答案", {}, LAZY), { target: { value: "22" } });
  learning.flush();
  cleanup();
  learning.resetForTests(); // simulate a new page load
  renderAt("/practice/linear-programming/practice-3");
  expect(await screen.findByLabelText("你的数值答案", {}, LAZY)).toHaveValue("22");
});

it("respects the global 'no help suggestions' preference", async () => {
  localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: "light", splash: true, nudges: false }));
  renderAt("/practice/linear-programming/practice-2");
  fireEvent.change(await screen.findByLabelText("你的数值答案", {}, LAZY), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
  expect(screen.getByRole("status")).toHaveTextContent("无法确定具体原因");
  expect(screen.queryByText(/卡住了/)).not.toBeInTheDocument();
});

it("lets the learner dismiss the return bar without losing the draft", async () => {
  renderAt("/practice/linear-programming/self-1");
  fireEvent.click(await screen.findByRole("radio", { name: "x + 2y ≤ 100" }, LAZY));
  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
  fireEvent.click(within(screen.getByRole("status")).getByRole("button", { name: /约束建模/ }));
  fireEvent.click(await screen.findByRole("button", { name: /不再显示回程条/ }, LAZY));
  expect(screen.queryByRole("region", { name: "回到原题" })).not.toBeInTheDocument();
  expect(learning.get().state.exercises["self-1"].draft).toBe("b");
});
