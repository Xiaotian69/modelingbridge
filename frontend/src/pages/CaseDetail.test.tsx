// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaseDetailPage } from "./CaseDetail";

vi.mock("../api/client", () => ({
  getCase: vi.fn(() => Promise.reject(new Error("backend unavailable"))),
}));

afterEach(() => {
  cleanup();
});

describe("CaseDetailPage", () => {
  it("falls back to local teaching case data when the backend is unavailable", async () => {
    render(
      <MemoryRouter
        initialEntries={["/cases/traffic-police-platform-demo"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Routes>
          <Route path="/cases/:slug" element={<CaseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "城市交巡警服务平台设置与调度（教学演示案例）" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("案例不存在或加载失败。")).not.toBeInTheDocument();
  });

  it("shows the adapted problem statement before analysis sections", async () => {
    render(
      <MemoryRouter
        initialEntries={["/cases/traffic-police-platform-demo"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <Routes>
          <Route path="/cases/:slug" element={<CaseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const problemHeading = await screen.findByRole("heading", { name: "改编题目" });
    const backgroundHeading = screen.getByRole("heading", { name: "案例背景" });

    expect(screen.getByText(/请你以数学建模团队的身份/)).toBeInTheDocument();
    expect(problemHeading.compareDocumentPosition(backgroundHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
