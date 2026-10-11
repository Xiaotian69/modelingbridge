// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import { Layout } from "./Layout";
afterEach(cleanup);
it("closes the mobile menu on Escape and after navigation", () => {
  render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  const toggle = screen.getByRole("button", { name: "打开导航菜单" });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(toggle);
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "移动导航" })).getByText(
      "知识库",
    ),
  );
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});
