/** Tiny handshake between the inline splash and the React app. */
export const APP_READY_EVENT = "mb:app-ready";
export const SPLASH_DONE_EVENT = "mb:splash-done";

declare global {
  interface Window {
    __mbAppReady?: boolean;
  }
}

/** The app calls this after its first commit so the splash may leave. */
export function signalAppReady(win: Window = window) {
  win.__mbAppReady = true;
  win.dispatchEvent(new Event(APP_READY_EVENT));
}
