// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Checkpoint } from "./Checkpoint";
import { publishedQuestions } from "./questions";
import { PRACTICE_KEY } from "./storage";
import { learning } from "../state/learning";

const q = (id: string) => publishedQuestions.find((x) => x.id === id)!;
beforeEach(() => {
  localStorage.clear();
  learning.resetForTests();
});
afterEach(cleanup);

it("checks instantly, explains a known mistake, and offers hint and solution on request", () => {
  render(<Checkpoint question={q("self-1")} />);
  expect(screen.getByText(/不计成绩/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "2x + y = 100" }));
  fireEvent.click(screen.getByRole("button", { name: "核对" }));
  const feedback = screen.getByRole("status");
  expect(feedback).toHaveTextContent("把上限写成了必须用完");
  expect(feedback).not.toHaveTextContent("2x + y ≤ 100");
  fireEvent.click(within(feedback).getByRole("button", { name: /给我一点提示/ }));
  expect(feedback).toHaveTextContent("把“每平方米工时 × 平方米数”相加");
  fireEvent.click(within(feedback).getByRole("button", { name: "直接看解析" }));
  expect(feedback).toHaveTextContent("解析：2x + y ≤ 100");
});

it("clears stale feedback when the answer changes and records only that it was tried", () => {
  render(<Checkpoint question={q("think-1")} />);
  fireEvent.click(screen.getByRole("radio", { name: /是，单位利润最高/ }));
  fireEvent.click(screen.getByRole("button", { name: "核对" }));
  expect(screen.getByRole("status")).toHaveTextContent("只比较了单位利润");
  fireEvent.click(screen.getByRole("radio", { name: /不一定/ }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "核对" }));
  expect(screen.getByRole("status")).toHaveTextContent("✓ 对了");
  // Checkpoints are not scores: kept apart from practice records (Q8).
  expect(learning.get().state.checkpoints["think-1"]).toMatchObject({ tried: true, lastResult: "correct" });
  expect(learning.get().state.exercises["think-1"]).toBeUndefined();
  expect(localStorage.getItem(PRACTICE_KEY)).toBeNull();
});

it("asks for an answer before checking", () => {
  render(<Checkpoint question={q("practice-1")} />);
  fireEvent.click(screen.getByRole("button", { name: "核对" }));
  expect(screen.getByRole("status")).toHaveTextContent("请先选择一个答案");
  expect(learning.get().state.checkpoints["practice-1"]).toBeUndefined();
});
