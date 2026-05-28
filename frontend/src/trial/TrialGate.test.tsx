// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrialGate } from "./TrialGate";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe("TrialGate", () => {
  it("renders children directly when the trial gate is disabled", () => {
    vi.stubEnv("VITE_TRIAL_ACCESS_CODE", "");

    render(
      <TrialGate>
        <div>试用内容</div>
      </TrialGate>,
    );

    expect(screen.getByText("试用内容")).toBeInTheDocument();
  });

  it("requires the configured trial access code before rendering the app", async () => {
    vi.stubEnv("VITE_TRIAL_ACCESS_CODE", "bridge-demo");
    render(
      <TrialGate>
        <div>试用内容</div>
      </TrialGate>,
    );

    expect(screen.queryByText("试用内容")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("访问码"), { target: { value: "bridge-demo" } });
    fireEvent.click(screen.getByRole("button", { name: "进入试用" }));

    expect(screen.getByText("试用内容")).toBeInTheDocument();
  });
});
