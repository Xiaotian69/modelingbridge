// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import fixture from "./graph-verified.json";
import { PLACES } from "./data";
import { GraphFigure } from "./GraphFigure";
import { GraphLab } from "./GraphLab";

afterEach(cleanup);

const next = () => fireEvent.click(screen.getByRole("button", { name: "下一步" }));
const message = () => screen.getByText(/^(开始|第 \d+)/, { selector: ".lab-result p" }).textContent!;
const row = (place: string) => within(screen.getByRole("table")).getByRole("row", { name: new RegExp(`^${place}`) });
const name = (v: number) => PLACES[v].name;

describe("最短路实验", () => {
  it("steps through Dijkstra exactly as networkx settles the vertices", () => {
    render(<GraphLab mode="path" />);
    expect(message()).toContain("宿舍区的距离为 0");
    fixture.campus.order.forEach((v, k) => {
      next();
      expect(message()).toContain(`第 ${k + 1} 步：确定${name(v)}（${fixture.campus.dist[v]} 米）`);
      expect(row(name(v))).toHaveTextContent("已确定");
    });
    expect(message()).toContain("宿舍区到招新广场最短 1080 米：宿舍区 → 食堂 → 图书馆 → 教学楼 → 招新广场");
    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
  });

  it("shows relaxations: 教学楼 790 → 750 when 图书馆 is settled", () => {
    render(<GraphLab mode="path" />);
    for (let k = 0; k < 2; k++) next();
    expect(row("教学楼")).toHaveTextContent("暂定790食堂");
    for (let k = 0; k < 2; k++) next();
    expect(message()).toContain("确定图书馆（550 米）。更新：教学楼 790 → 750，招新广场 ∞ → 1110");
    expect(row("教学楼")).toHaveTextContent("暂定750图书馆");
    fireEvent.click(screen.getByRole("button", { name: "上一步" }));
    expect(row("教学楼")).toHaveTextContent("暂定790食堂");
  });

  it("re-routes under construction and for another start", () => {
    render(<GraphLab mode="path" />);
    fireEvent.click(screen.getByRole("checkbox", { name: /施工/ }));
    fireEvent.click(screen.getByRole("button", { name: "直接看结果" }));
    expect(message()).toContain(`最短 ${fixture.construction.dist[6]} 米：宿舍区 → 食堂 → 图书馆 → 招新广场`);
    expect(message()).toContain("施工前是 1080 米");
    fireEvent.click(screen.getByRole("checkbox", { name: /施工/ }));
    fireEvent.change(screen.getByRole("combobox", { name: "起点" }), { target: { value: "1" } });
    fireEvent.change(screen.getByRole("combobox", { name: "终点" }), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "直接看结果" }));
    expect(message()).toContain(`东门到图书馆最短 ${fixture.allPairs[1][3]} 米`);
  });
});

describe("最小生成树实验", () => {
  it("accepts and skips edges like Kruskal and ends at the networkx total", () => {
    render(<GraphLab mode="tree" />);
    for (let k = 0; k < 6; k++) next();
    expect(message()).toContain("教学楼—体育馆（400 米）：两端已经连通，选它会形成环，跳过");
    next();
    expect(message()).toContain(`最小生成树总长 ${fixture.campus.kruskal!.total} 米`);
    expect(screen.getByText(/7 \/ 7 步/)).toBeInTheDocument();
  });

  it("switches between the two problems", () => {
    render(<GraphLab mode="tree" />);
    fireEvent.click(screen.getByRole("button", { name: "最短路" }));
    expect(screen.getByRole("heading", { name: "一步一步运行 Dijkstra 算法" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});

describe("static maps", () => {
  it("describe the map and the tree in text", () => {
    const { container, unmount } = render(<GraphFigure highlight="none" />);
    expect(container.querySelector("desc")!.textContent).toContain("宿舍区—食堂 300 米");
    expect(container.querySelectorAll(".campus-edge")).toHaveLength(12);
    unmount();
    const t = render(<GraphFigure highlight="tree" />);
    expect(t.container.querySelectorAll(".campus-edge.is-tree")).toHaveLength(6);
    expect(t.container.querySelector("desc")!.textContent).toContain("总长 1810 米");
  });
});
