/**
 * 挑战自己的本机存储（独立命名空间 mb.challenge.v1），不读写课程进度和七关草稿。
 * 微信内置浏览器可能清理本地数据，所以这里只是“刷新不丢”，任何读写失败都静默忽略。
 */
import { CHALLENGE_STORAGE_KEY, type ResultId } from "./config";
import { computeResult, type Answers } from "./scoring";

export type Step = "intro" | 1 | 2 | 3 | 4 | 5 | "result";

export type ChallengeState = {
  v: 1;
  step: Step;
  answers: Partial<Answers>;
  result?: ResultId;
};

export const freshState = (): ChallengeState => ({ v: 1, step: "intro", answers: {} });

const STEPS: Step[] = ["intro", 1, 2, 3, 4, 5, "result"];

export function loadState(): ChallengeState {
  try {
    const raw = localStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (!raw) return freshState();
    const data = JSON.parse(raw) as ChallengeState;
    if (data?.v !== 1 || !STEPS.includes(data.step) || typeof data.answers !== "object" || !data.answers)
      return freshState();
    if (data.step === "result") {
      if (!data.result) return freshState();
      computeResult(data.answers as Answers); // 答案不完整或被改坏：抛错 → 重新开始
    }
    return data;
  } catch {
    return freshState();
  }
}

export function saveState(state: ChallengeState) {
  try {
    localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 隐私模式或存储已满：不影响答题 */
  }
}
