// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PreferencesPanel } from "./PreferencesPanel";
import { PrefsProvider } from "./PrefsContext";
import { PREFS_KEY, readPrefs } from "./prefsStore";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

it("turns the splash off and switches theme, persisting both locally", () => {
  render(
    <PrefsProvider>
      <PreferencesPanel />
    </PrefsProvider>,
  );
  const splash = screen.getByRole("switch", { name: /开屏动画/ });
  expect(splash).toBeChecked();
  fireEvent.click(splash);
  expect(splash).not.toBeChecked();
  expect(readPrefs().splash).toBe(false);

  fireEvent.click(screen.getByRole("radio", { name: "深色" }));
  expect(readPrefs().theme).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(JSON.parse(localStorage.getItem(PREFS_KEY)!)).toEqual({ theme: "dark", splash: false });
});

it("warns when the browser refuses to store preferences", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
  render(
    <PrefsProvider>
      <PreferencesPanel />
    </PrefsProvider>,
  );
  fireEvent.click(screen.getByRole("radio", { name: "浅色" }));
  expect(screen.getByRole("alert")).toHaveTextContent("不允许本地保存");
  vi.restoreAllMocks();
});
