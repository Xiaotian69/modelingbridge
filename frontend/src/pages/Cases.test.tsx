// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CasesPage } from "./Cases";

vi.mock("../api/client", () => ({
  listCases: vi.fn(() => Promise.resolve([])),
}));

describe("CasesPage", () => {
  it("renders recent contest training scripts without backend case data", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <CasesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "近三年真题拆解" })).toBeInTheDocument();
    expect(screen.getByText("2023C Predicting Wordle Results")).toBeInTheDocument();
    expect(screen.getByText("2024C Momentum in Tennis")).toBeInTheDocument();
    expect(screen.getAllByText("建模线").length).toBeGreaterThan(0);
    expect(screen.getAllByText("编程线").length).toBeGreaterThan(0);
    expect(screen.getAllByText("论文线").length).toBeGreaterThan(0);
  });

  it("offers clickable practice links for classic drills", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <CasesPage />
      </MemoryRouter>,
    );

    const links = screen.getAllByRole("link", { name: "应急物资调度路径优化 查看完整拆解" });
    expect(links[0]).toHaveAttribute("href", "/cases/optimization-dispatch-demo");
  });
});
