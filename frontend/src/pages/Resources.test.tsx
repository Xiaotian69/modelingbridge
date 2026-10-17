// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildResourceIndex } from "../content/resources";
import { ResourcesPage } from "./Resources";

vi.mock("../api/client", () => ({ listResources: vi.fn() }));

afterEach(cleanup);

const renderAt = (url = "/library") =>
  render(
    <MemoryRouter initialEntries={[url]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ResourcesPage />
    </MemoryRouter>,
  );

describe("资料索引 (Q6)", () => {
  it("lists only original material and official links, never downloads or server paths", async () => {
    const { listResources } = await import("../api/client");
    renderAt();
    const items = buildResourceIndex();
    expect(items.every((i) => i.licenseStatus === "original" || i.licenseStatus === "official-link")).toBe(true);
    expect(screen.getAllByRole("listitem")).toHaveLength(items.length);
    expect(screen.queryByText("下载")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[A-Z]:[\/]|数模网站开发|公众号/);
    expect(document.querySelectorAll("a[download], a[href*='/api/']")).toHaveLength(0);
    expect(listResources).not.toHaveBeenCalled();
    expect(screen.getByText(/授权核验前不提供下载/)).toBeInTheDocument();
  });

  it("filters by type and keyword, and every row shows its licence status", () => {
    renderAt("/library?kind=原创教学案例");
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(8);
    rows.forEach((row) => expect(within(row).getByText("原创")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("搜索标题、年份、方法…"), { target: { value: "Wordle" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    fireEvent.change(screen.getByPlaceholderText("搜索标题、年份、方法…"), { target: { value: "没有这种资料" } });
    expect(screen.getByText("没有找到匹配的资料。")).toBeInTheDocument();
  });

  it("links official pages in a new tab and keeps site links in-app", () => {
    renderAt("/library?kind=官方赛事与规则");
    const official = screen.getAllByRole("link", { name: /↗/ });
    expect(official.length).toBeGreaterThan(5);
    official.forEach((a) => {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a.getAttribute("href")).toMatch(/^https:\/\//);
    });
  });
});
