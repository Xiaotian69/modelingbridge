// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import { PracticePage } from "./Practice";
import { PRACTICE_KEY, readHistory, save } from "../learning/storage";
import { learning } from "../state/learning";

beforeEach(() => {
  localStorage.clear();
  learning.resetForTests();
});
afterEach(cleanup);

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/practice/linear-programming" element={<PracticePage />} />
        <Route path="/practice/linear-programming/:exerciseId" element={<PracticePage />} />
      </Routes>
    </MemoryRouter>,
  );

it("retries previous mistakes from V1 records and updates the count after a corrected attempt", () => {
  // A V1 learner with one wrong answer: the record is migrated, not lost.
  save(PRACTICE_KEY, { "practice-1": { correct: false, attempts: 1, updated: "2026-10-01T00:00:00.000Z" } });
  renderAt("/practice/linear-programming");
  expect(screen.getByText("1 题待重练", { selector: ".practice-summary span" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /错题/ }));
  const nav = screen.getByRole("complementary", { name: "题目导航" });
  fireEvent.click(within(nav).getByRole("link", { name: /练习 1/ }));
  expect(screen.getByRole("status")).toHaveTextContent("已恢复你的作答 · 已尝试 1 次 · 上次结果：还不对（旧版记录）");
  fireEvent.change(screen.getByLabelText("你的数值答案"), { target: { value: "2600" } });
  fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
  expect(screen.getByText("✓ 回答正确")).toBeInTheDocument();
  expect(screen.getByText("0 题待重练", { selector: ".practice-summary span" })).toBeInTheDocument();
  // Dual write keeps the V1 key current for a safe rollback.
  expect(readHistory()["practice-1"]).toMatchObject({ correct: true, attempts: 2 });
});

it("lands on the first question not yet answered correctly and keeps the same six IDs", () => {
  renderAt("/practice/linear-programming");
  const nav = screen.getByRole("complementary", { name: "题目导航" });
  expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(
    expect.arrayContaining(
      ["self-1", "self-2", "self-3", "practice-1", "practice-2", "practice-3"].map(
        (id) => `/practice/linear-programming/${id}`,
      ),
    ),
  );
  expect(within(nav).getByRole("link", { name: /自测 1/ })).toHaveAttribute("aria-current", "page");
});

it("filters by difficulty and handles unknown question IDs", () => {
  renderAt("/practice/linear-programming/practice-3");
  fireEvent.change(screen.getByRole("combobox", { name: "难度" }), { target: { value: "挑战" } });
  const nav = screen.getByRole("complementary", { name: "题目导航" });
  expect(within(nav).getAllByRole("listitem")).toHaveLength(1);
  cleanup();
  renderAt("/practice/linear-programming/practice-99");
  expect(screen.getByRole("alert")).toHaveTextContent("没有找到这道题");
});
