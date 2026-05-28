export const TRIAL_ACCESS_STORAGE_KEY = "modelingbridge_trial_access_code";

function configuredTrialAccessCode(): string {
  return (import.meta.env.VITE_TRIAL_ACCESS_CODE ?? "").trim();
}

export function isTrialGateEnabled(): boolean {
  return configuredTrialAccessCode().length > 0;
}

export function isTrialAccessCodeValid(code: string): boolean {
  const configuredCode = configuredTrialAccessCode();
  if (!configuredCode) return true;
  return code.trim() === configuredCode;
}

export function getStoredTrialAccessCode(): string {
  return window.localStorage.getItem(TRIAL_ACCESS_STORAGE_KEY) ?? "";
}

export function storeTrialAccessCode(code: string): void {
  window.localStorage.setItem(TRIAL_ACCESS_STORAGE_KEY, code.trim());
}

export function clearStoredTrialAccessCode(): void {
  window.localStorage.removeItem(TRIAL_ACCESS_STORAGE_KEY);
}

export function withTrialAccessCode(url: string): string {
  if (!isTrialGateEnabled()) return url;
  const code = getStoredTrialAccessCode();
  if (!code) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}trial_code=${encodeURIComponent(code)}`;
}
