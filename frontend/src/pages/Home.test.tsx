// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { HomePage } from "./Home";
import { modelMethods } from "../data/modelingContent";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("connects learning and practice to existing pages without presenting AI as online", () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <HomePage />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "开始学习" })).toHaveAttribute(
    "href",
    "/learn",
  );
  expect(screen.getByRole("link", { name: "开启数模七关" })).toHaveAttribute(
    "href",
    "/quest",
  );
  expect(screen.getByText("AI 在线服务暂未开放")).toBeInTheDocument();
  const links = screen.getAllByRole("link");
  const modelLinks = links.filter((link) =>
    link.getAttribute("href")?.startsWith("/learn#model-"),
  );
  expect(modelLinks).toHaveLength(4);
  for (const link of modelLinks)
    expect(
      modelMethods.some(
        (m) => link.getAttribute("href") === `/learn#model-${m.slug}`,
      ),
    ).toBe(true);
  expect(links.some((link) => link.hasAttribute("download"))).toBe(false);
});
