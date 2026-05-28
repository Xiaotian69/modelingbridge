// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Layout } from "./Layout";

describe("Layout", () => {
  it("keeps learning and contest planning in the main navigation", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "学习" })).toHaveAttribute("href", "/learn");
    expect(screen.getByRole("link", { name: "日历" })).toHaveAttribute("href", "/calendar");
    expect(screen.getByRole("link", { name: "案例" })).toHaveAttribute("href", "/cases");
  });
});
