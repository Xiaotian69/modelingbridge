// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LearnPage } from "./Learn";

describe("LearnPage", () => {
  it("renders recent MCM training cases before the method library", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <LearnPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "近三年优先训练" })).toBeInTheDocument();
    expect(screen.getByText("2023C Predicting Wordle Results")).toBeInTheDocument();
    expect(screen.getByText("2024C Momentum in Tennis")).toBeInTheDocument();
    expect(screen.getByText("2025C Models for Olympic Medal Tables")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "模型方法库" })).toBeInTheDocument();
  });

  it("offers clickable practice links for classic problem cards", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <LearnPage />
      </MemoryRouter>,
    );

    const links = screen.getAllByRole("link", { name: "交巡警服务平台设置与调度（简化版） 查看完整拆解" });
    expect(links[0]).toHaveAttribute("href", "/cases/traffic-police-platform-demo");
  });
});
