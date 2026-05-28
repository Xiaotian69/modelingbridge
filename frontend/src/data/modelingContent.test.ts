import { describe, expect, it } from "vitest";
import { getRecentTrainingCase, recentTrainingCases, resourcePacks } from "./modelingContent";

describe("recentTrainingCases", () => {
  it("prioritizes the first three recent MCM learning cases", () => {
    expect(recentTrainingCases.slice(0, 3).map((item) => item.slug)).toEqual([
      "mcm-2023c-wordle",
      "mcm-2024c-tennis-momentum",
      "mcm-2025c-olympic-medals",
    ]);
  });

  it("keeps every recent case tied to modeling, coding, and paper practice", () => {
    for (const item of recentTrainingCases) {
      expect(item.modelingLine.length).toBeGreaterThanOrEqual(2);
      expect(item.codingLine.length).toBeGreaterThanOrEqual(2);
      expect(item.paperLine.length).toBeGreaterThanOrEqual(2);
      expect(item.paperRoutes.length).toBeGreaterThanOrEqual(1);
      expect(item.methodSlugs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("finds a recent case by slug", () => {
    expect(getRecentTrainingCase("mcm-2024c-tennis-momentum")?.title).toContain("Momentum");
    expect(getRecentTrainingCase("missing-case")).toBeNull();
  });
});

describe("resourcePacks", () => {
  it("includes the newly downloaded MCM archive as a first-class source pack", () => {
    const archive = resourcePacks.find((pack) => pack.title.includes("赛题、翻译、优秀论文"));

    expect(archive?.localPath).toBe("E:/数模网站开发/历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等");
    expect(archive?.summary).toContain("419 个文件");
    expect(archive?.files).toContain("2025");
  });
});
