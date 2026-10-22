// @vitest-environment jsdom
// The TOPSIS course is wired into everything the other courses use: catalogue, method index,
// search, home “继续学习”, records, the practice loop with its return bar, and the AHP lesson.
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "../App";
import { lessonEntries, searchEntries, staticEntries } from "../app/searchIndex";
import { courseOfQuestion, localQuestionId } from "../learning/courses";
import { findQuestion, metaForQuestion } from "../learning/courseBanks";
import { learning } from "../state/learning";
import { LEARNING_KEY } from "../state/learningStore";
import { RETURN_KEY } from "../state/returnTicket";
import { HomePage } from "./Home";
import { LearnPage } from "./Learn";
import { practiceLabel } from "./Practice";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  learning.resetForTests();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const LAZY = { timeout: 5000 };
const router = { v7_relativeSplatPath: true, v7_startTransition: true };
const inRouter = (ui: JSX.Element) => render(<MemoryRouter future={router}>{ui}</MemoryRouter>);
function Where() {
  const l = useLocation();
  return <span data-testid="where">{l.pathname + l.hash}</span>;
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={router}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );

describe("TOPSIS is findable", () => {
  it("is offered in 精讲目录 with its practice, and the method index points to it", () => {
    inRouter(<LearnPage />);
    expect(screen.getByRole("link", { name: "开始 TOPSIS 精讲" })).toHaveAttribute("href", "/learn/topsis");
    expect(screen.getByRole("link", { name: "TOPSIS 专项练习" })).toHaveAttribute("href", "/practice/topsis");
    expect(screen.getByRole("link", { name: "12 道 TOPSIS 练习 →" })).toHaveAttribute("href", "/practice/topsis");
    expect(screen.getByRole("link", { name: /熵权法 \/ TOPSIS.*精讲已开放/ })).toHaveAttribute("href", "/learn/topsis");
  });

  it("finds lesson sections, the lab, practice and the method in local search", async () => {
    const entries = [...(await lessonEntries()), ...staticEntries()];
    expect(searchEntries(entries, "贴近度", 10).some((h) => h.href === "/learn/topsis#closeness")).toBe(true);
    expect(searchEntries(entries, "熵权", 10).some((h) => h.href === "/learn/topsis#entropy")).toBe(true);
    expect(searchEntries(entries, "熵权", 10).some((h) => h.href === "/practice/topsis")).toBe(true);
    expect(searchEntries(entries, "逆序", 10).some((h) => h.id === "lab:topsis")).toBe(true);
    expect(searchEntries(entries, "TOPSIS", 10).some((h) => h.id === "method:entropy-topsis" && h.href === "/learn/topsis")).toBe(true);
    // Every TOPSIS entry has a unique id.
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("continues the TOPSIS lesson from the home page when it was read last", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T08:00:00Z"));
    learning.setReading("weights", "ahp");
    vi.setSystemTime(new Date("2026-10-15T09:00:00Z"));
    learning.setReading("ideal", "topsis");
    vi.useRealTimers();
    inRouter(<HomePage />);
    const strip = screen.getByRole("heading", { name: "继续学习" }).closest("section")!;
    expect(within(strip).getByText(/TOPSIS 综合评价 · 第 5 节 · 最好与最差：正、负理想解/)).toBeInTheDocument();
    expect(within(strip).getByRole("link", { name: "继续阅读" })).toHaveAttribute("href", "/learn/topsis#ideal");
  });
});

describe("question ids route to the right course", () => {
  it("prefix lookup, labels and metadata", () => {
    expect(courseOfQuestion("topsis-practice-3").id).toBe("topsis");
    expect(courseOfQuestion("ahp-practice-3").id).toBe("ahp");
    expect(courseOfQuestion("practice-3").id).toBe("lp");
    expect(localQuestionId("topsis-self-2")).toBe("self-2");
    expect(practiceLabel("topsis-self-2")).toBe("自测 2");
    expect(practiceLabel("topsis-practice-9")).toBe("练习 9");
    expect(findQuestion("topsis-practice-3")?.model).toBe("topsis");
    expect(findQuestion("practice-3")?.model).toBe("linear-programming");
    expect(findQuestion("topsis-nope")).toBeNull();
    expect(metaForQuestion("topsis-practice-3").sectionId).toBe("closeness");
  });
});

describe("practice loop", () => {
  it("diagnoses a closeness mistake, sends the learner to the TOPSIS section and brings them back", async () => {
    renderAt("/practice/topsis/topsis-practice-3");
    expect(await screen.findByRole("heading", { name: "TOPSIS 综合评价专项练习" }, LAZY)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("你的数值答案"), { target: { value: "0.6" } });
    fireEvent.click(screen.getByRole("button", { name: "提交答案" }));
    const feedback = screen.getByText(/错误类型：分子用了 D⁺/).closest("[role=status]")!;
    expect(feedback).not.toHaveTextContent("0.400");

    fireEvent.click(screen.getAllByRole("button", { name: /贴近度 · 第 6 节/ })[0]);
    expect(await screen.findByTestId("where")).toHaveTextContent("/learn/topsis#closeness");
    expect(JSON.parse(sessionStorage.getItem(RETURN_KEY)!).to).toEqual({ sectionId: "closeness", lessonId: "topsis" });
    const back = await screen.findByRole("link", { name: "← 回到 练习 3" }, LAZY);
    // The lab is in the section the learner was sent to.
    expect(screen.getByText("换权重、改方向、加房源，看排名怎样变化")).toBeInTheDocument();
    fireEvent.click(back);
    expect(await screen.findByLabelText("你的数值答案", {}, LAZY)).toHaveValue("0.6");
    const saved = JSON.parse(localStorage.getItem(LEARNING_KEY)!);
    expect(saved.exercises["topsis-practice-3"]).toMatchObject({ attempts: 1, lastStatus: "incorrect" });
    // The V1 rollback mirror only carries linear programming.
    expect(Object.keys(JSON.parse(localStorage.getItem("mb_learning_practice_v1") || "{}"))).not.toContain("topsis-practice-3");
  });

  it("lists all three topics on the practice page", async () => {
    renderAt("/practice/topsis");
    const nav = await screen.findByRole("navigation", { name: "选择专题" }, LAZY);
    expect(within(nav).getByRole("link", { name: "TOPSIS 综合评价" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "层次分析法（AHP）" })).toHaveAttribute("href", "/practice/ahp");
    expect(await screen.findByTestId("where")).toHaveTextContent("/practice/topsis/topsis-self-1");
  });

  it("keeps the TOPSIS reading position separately and only mirrors linear programming", () => {
    learning.setReading("derive");
    learning.setReading("entropy", "topsis");
    learning.setReading("not-a-section", "topsis");
    const { state } = learning.get();
    expect(state.reading.lp?.lastSectionId).toBe("derive");
    expect(state.reading.topsis?.lastSectionId).toBe("entropy");
    expect(JSON.parse(localStorage.getItem("mb_learning_reading_v1")!)).toBe("derive");
    learning.resetForTests();
    expect(learning.get().state.reading.topsis?.lastSectionId).toBe("entropy");
  });
});

describe("lessons and records", () => {
  it("renders the TOPSIS lesson with its plane, lab and the bridge back to AHP", async () => {
    renderAt("/learn/topsis");
    expect(await screen.findByRole("heading", { level: 1, name: /五套房子/ }, LAZY)).toBeInTheDocument();
    expect(screen.getByText("理想房、最差房与五套真实的房子")).toBeInTheDocument();
    expect(screen.getByText("换权重、改方向、加房源，看排名怎样变化")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "专项练习（12 题）" })).toHaveAttribute("href", "/practice/topsis");
    const bridge = screen.getByRole("complementary", { name: /回顾 · 层次分析法/ });
    expect(within(bridge).getByRole("link")).toHaveAttribute("href", "/learn/ahp#weights");
    expect(screen.getAllByRole("region", { name: /检查点/ })).toHaveLength(6);
  });

  it("the AHP lesson now leads on to TOPSIS", async () => {
    renderAt("/learn/ahp");
    await screen.findByRole("heading", { level: 1, name: /三份实习/ }, LAZY);
    const bridge = screen.getByRole("complementary", { name: /下一门精讲 · TOPSIS/ });
    expect(within(bridge).getByRole("link")).toHaveAttribute("href", "/learn/topsis");
    expect(screen.getByText(/下一门：TOPSIS 综合评价/)).toBeInTheDocument();
  });

  it("shows a TOPSIS card on the records page", async () => {
    learning.setReading("weights", "topsis");
    learning.recordCheckpoint("topsis-think-1", true);
    renderAt("/records");
    const title = await screen.findByText("TOPSIS 综合评价精讲", {}, LAZY);
    const card = title.closest(".records-card")!;
    expect(card).toHaveTextContent("读过 1/11 节");
    expect(card).toHaveTextContent("章内检查点尝试过 1/6");
  });
});
