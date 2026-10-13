// @vitest-environment jsdom
// The AHP course reuses the whole practice loop: answer wrong → typed feedback without the
// answer → review the section in the AHP lesson → return bar → state restored.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { learning } from "../state/learning";
import { LEARNING_KEY } from "../state/learningStore";
import { RETURN_KEY } from "../state/returnTicket";

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
const LAZY = { timeout: 5000 };
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );

it("diagnoses a CR mistake, sends the learner to the AHP section and brings them back", async () => {
  renderAt("/practice/ahp/ahp-practice-2");
  expect(await screen.findByRole("heading", { name: "层次分析法（AHP）专项练习" }, LAZY)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("你的数值答案"), { target: { value: "0.07" } });
  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
  const feedback = screen.getByText(/错误类型：只算到 CI/).closest("[role=status]")!;
  expect(feedback).not.toHaveTextContent("0.078");

  fireEvent.click(screen.getAllByRole("button", { name: /一致性检验 · 第 5 节/ })[0]);
  expect(await screen.findByTestId("where")).toHaveTextContent("/learn/ahp#consistency");
  expect(JSON.parse(sessionStorage.getItem(RETURN_KEY)!).to).toEqual({ sectionId: "consistency", lessonId: "ahp" });
  const back = await screen.findByRole("link", { name: "← 回到 练习 2" }, LAZY);
  // The lab is on the page the learner was sent to.
  expect(screen.getByText("改变判断，看权重和一致性如何变化")).toBeInTheDocument();
  fireEvent.click(back);
  expect(await screen.findByLabelText("你的数值答案", {}, LAZY)).toHaveValue("0.07");
  expect(screen.getByText(/已尝试 1 次/, { selector: ".attempts" })).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem(LEARNING_KEY)!);
  expect(saved.exercises["ahp-practice-2"]).toMatchObject({ attempts: 1, lastStatus: "incorrect" });
});

it("does not show an AHP return ticket inside the linear programming lesson", async () => {
  sessionStorage.setItem(
    RETURN_KEY,
    JSON.stringify({
      from: { kind: "exercise", id: "ahp-practice-1", path: "/practice/ahp/ahp-practice-1", label: "练习 1" },
      to: { sectionId: "weights", lessonId: "ahp" },
      createdAt: "2026-10-13T00:00:00.000Z",
    }),
  );
  renderAt("/learn/linear-programming");
  await screen.findByRole("heading", { name: /有限资源/ }, LAZY);
  expect(screen.queryByRole("link", { name: /← 回到/ })).not.toBeInTheDocument();
});

it("lists both topics on the practice page and keeps linear programming unchanged", async () => {
  renderAt("/practice/linear-programming/practice-1");
  const nav = await screen.findByRole("navigation", { name: "选择专题" }, LAZY);
  expect(nav).toHaveTextContent("线性规划");
  expect(screen.getByRole("link", { name: "层次分析法（AHP）" })).toHaveAttribute("href", "/practice/ahp");
  expect(screen.getByRole("heading", { name: "线性规划专项练习" })).toBeInTheDocument();
});

it("remembers the AHP reading position separately from linear programming", () => {
  learning.setReading("derive");
  learning.setReading("consistency", "ahp");
  learning.setReading("not-a-section", "ahp");
  const { state } = learning.get();
  expect(state.reading.lp?.lastSectionId).toBe("derive");
  expect(state.reading.ahp?.lastSectionId).toBe("consistency");
  // Only linear programming is mirrored to the V1 key (rollback safety).
  expect(JSON.parse(localStorage.getItem("mb_learning_reading_v1")!)).toBe("derive");
  learning.resetForTests();
  expect(learning.get().state.reading.ahp?.lastSectionId).toBe("consistency");
});
