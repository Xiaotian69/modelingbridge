// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredTrialAccessCode,
  getStoredTrialAccessCode,
  isTrialAccessCodeValid,
  isTrialGateEnabled,
  storeTrialAccessCode,
  withTrialAccessCode,
} from "./access";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe("trial access helpers", () => {
  it("stays disabled when no trial access code is configured", () => {
    vi.stubEnv("VITE_TRIAL_ACCESS_CODE", "");

    expect(isTrialGateEnabled()).toBe(false);
    expect(isTrialAccessCodeValid("anything")).toBe(true);
    expect(withTrialAccessCode("/api/resources/file/download")).toBe("/api/resources/file/download");
  });

  it("stores and validates the configured trial access code", () => {
    vi.stubEnv("VITE_TRIAL_ACCESS_CODE", "bridge-demo");

    expect(isTrialGateEnabled()).toBe(true);
    expect(isTrialAccessCodeValid("wrong")).toBe(false);
    expect(isTrialAccessCodeValid(" bridge-demo ")).toBe(true);

    storeTrialAccessCode("bridge-demo");
    expect(getStoredTrialAccessCode()).toBe("bridge-demo");

    clearStoredTrialAccessCode();
    expect(getStoredTrialAccessCode()).toBe("");
  });

  it("adds the stored trial code to download URLs", () => {
    vi.stubEnv("VITE_TRIAL_ACCESS_CODE", "bridge-demo");
    storeTrialAccessCode("bridge-demo");

    expect(withTrialAccessCode("/api/resources/file/download")).toBe(
      "/api/resources/file/download?trial_code=bridge-demo",
    );
    expect(withTrialAccessCode("/api/resources/file/download?x=1")).toBe(
      "/api/resources/file/download?x=1&trial_code=bridge-demo",
    );
  });
});
