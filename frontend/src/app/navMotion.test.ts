import { describe, expect, it } from "vitest";
import { isSamePage, navKind, routeDepth } from "./navMotion";

describe("routeDepth", () => {
  it.each([
    ["/", 0],
    ["/learn", 1],
    ["/library/calendar", 1],
    ["/records", 1],
    ["/learn/ahp", 2],
    ["/learn/team-roles", 2],
    ["/cases/bike-share", 2],
    ["/learn/linear-programming/lab", 3],
    ["/practice/ahp", 3],
    ["/practice/ahp/3", 3],
    ["/learn/", 1],
    ["/unknown", null],
    ["/challenge", null],
  ] as const)("%s → %s", (path, depth) => {
    expect(routeDepth(path)).toBe(depth);
  });
});

describe("isSamePage", () => {
  it("treats exercise and skill switches as the same page, other parameters as new pages", () => {
    expect(isSamePage("/practice/ahp/1", "/practice/ahp/2")).toBe(true);
    expect(isSamePage("/practice/ahp", "/practice/ahp/2")).toBe(true);
    expect(isSamePage("/library/skills", "/library/skills/x")).toBe(true);
    expect(isSamePage("/practice/ahp/1", "/practice/topsis/1")).toBe(false);
    expect(isSamePage("/cases/a", "/cases/b")).toBe(false);
  });
});

describe("navKind", () => {
  it.each([
    ["/", "/learn", "forward"],
    ["/learn", "/learn/ahp", "forward"],
    ["/learn/ahp", "/practice/ahp", "forward"],
    ["/learn/ahp", "/learn", "back"],
    ["/practice/ahp/3", "/learn/ahp", "back"],
    ["/learn", "/cases", "fade"],
    ["/library", "/library/calendar", "fade"],
    ["/cases/a", "/cases/b", "fade"],
    ["/practice/ahp/1", "/practice/ahp/2", "none"],
    ["/practice/ahp", "/practice/topsis", "fade"],
    ["/library/skills", "/library/skills/x", "none"],
    ["/", "/challenge", "none"],
    ["/challenge", "/", "none"],
    ["/learn", "/learn", "none"],
    ["/learn/", "/learn/ahp", "forward"],
    ["/unknown", "/learn", "fade"],
    ["/library", "/library/prompts/p1", "none"], // dynamic redirect: cannot be resolved ahead
  ] as const)("%s → %s is %s", (from, to, kind) => {
    expect(navKind(from, to)).toBe(kind);
  });
});
