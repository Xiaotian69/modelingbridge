import { describe, expect, it } from "vitest";
import { sections } from "./content";
import { LP_CHECKPOINT_IDS, LP_SECTION_IDS } from "./sectionIds";

describe("lesson ID lists kept outside content.ts", () => {
  it("section IDs match the lesson", () => {
    expect(LP_SECTION_IDS).toEqual(sections.map((s) => s.id));
  });
  it("checkpoint IDs match the question blocks in the lesson", () => {
    const blocks = sections.flatMap((s) => s.blocks).filter((b) => b.type === "question") as { id: string }[];
    expect(LP_CHECKPOINT_IDS).toEqual(blocks.map((b) => b.id));
  });
});
