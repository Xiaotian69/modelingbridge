// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { WorkbenchPage } from "./Workbench";

vi.mock("../api/client", () => ({
  analyzeProblem: vi.fn(),
  getPromptVersion: vi.fn(() => Promise.resolve({ workbench_prompt: "test", updated: "2026-05-25" })),
  listLlmProviders: vi.fn(() => Promise.resolve([])),
}));

describe("WorkbenchPage", () => {
  it("prefills problem and attachment from search params", () => {
    render(
      <MemoryRouter
        initialEntries={[
          `/workbench?problem_text=${encodeURIComponent("城市交通服务平台训练题")}&attachment_note=${encodeURIComponent("来自闯关训练副本")}`,
        ]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <WorkbenchPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("题目全文")).toHaveValue("城市交通服务平台训练题");
    expect(screen.getByLabelText("附件说明")).toHaveValue("来自闯关训练副本");
  });
});
