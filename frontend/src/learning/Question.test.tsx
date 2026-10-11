// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Question } from "./Question";
import { publishedQuestions } from "./questions";
import { readHistory } from "./storage";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it("shows hints, saves attempts, and clears stale feedback on answer change", () => {
  render(
    <Question
      question={publishedQuestions.find((q) => q.id === "practice-1")!}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "提示 0/2" }));
  expect(screen.getByText(/分别计算两种产品/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("你的数值答案"), {
    target: { value: "2000" },
  });
  fireEvent.click(screen.getByText("提交答案"));
  expect(readHistory()["practice-1"].correct).toBe(false);
  fireEvent.change(screen.getByLabelText("你的数值答案"), {
    target: { value: "2600" },
  });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("提交答案"));
  expect(readHistory()["practice-1"]).toMatchObject({
    correct: true,
    attempts: 2,
  });
});
