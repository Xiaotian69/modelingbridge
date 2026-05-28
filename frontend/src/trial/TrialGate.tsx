import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  getStoredTrialAccessCode,
  isTrialAccessCodeValid,
  isTrialGateEnabled,
  storeTrialAccessCode,
} from "./access";

export function TrialGate({ children }: { children: ReactNode }) {
  const enabled = isTrialGateEnabled();
  const initialAllowed = useMemo(() => !enabled || isTrialAccessCodeValid(getStoredTrialAccessCode()), [enabled]);
  const [allowed, setAllowed] = useState(initialAllowed);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (!enabled || allowed) return <>{children}</>;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isTrialAccessCodeValid(code)) {
      storeTrialAccessCode(code);
      setAllowed(true);
      return;
    }
    setError("访问码不正确，请检查后再试。");
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">ModelingBridge Trial</p>
          <h1 className="mt-4 text-3xl font-semibold">模桥小范围试用</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            这是给朋友体验的临时版本。请输入访问码后进入，资源下载也会使用这个访问码做轻量保护。
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-semibold text-slate-200">
              访问码
              <input
                className="mt-2 w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-slate-950 outline-none focus:border-emerald-300"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                autoComplete="off"
              />
            </label>
            {error && <p className="text-sm text-rose-200">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100"
            >
              进入试用
            </button>
          </form>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            提醒：这是低成本试运行保护，不适合作为长期生产级权限系统。
          </p>
        </section>
      </main>
    </div>
  );
}
