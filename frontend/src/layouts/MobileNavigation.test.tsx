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
it("lists all six destinations and closes on Escape and after navigation", () => {
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
  const menu = screen.getByRole("navigation", { name: "移动导航" });
  for (const label of ["首页", "精讲", "刷题", "实战", "资料", "学习记录"])
    expect(within(menu).getByRole("link", { name: label })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveFocus();
  fireEvent.click(toggle);
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "移动导航" })).getByRole("link", { name: "精讲" }),
  );
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("navigation", { name: "移动导航" })).not.toBeInTheDocument();
});
