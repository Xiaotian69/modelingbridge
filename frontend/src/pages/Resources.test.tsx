// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeTrialAccessCode } from "../trial/access";
import { ResourcesPage } from "./Resources";

vi.mock("../api/client", () => ({
  listResources: vi.fn(() =>
    Promise.resolve({
      summary: {
        total: 0,
        groups: [
          {
            key: "mcm_full_archive",
            title: "历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等",
            kind: "综合资料",
            exists: true,
            path: "E:\\数模网站开发\\历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等",
          },
        ],
      },
      items: [
        {
          id: "demo",
          name: "2524070.pdf",
          title: "2524070",
          kind: "综合资料",
          group: "历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等",
          year: "2025",
          extension: ".pdf",
          size: 1024,
          relative_path: "2025美赛O奖特等奖论文集/2524070.pdf",
          download_url: "/api/resources/demo/download",
        },
      ],
    }),
  ),
}));

afterEach(() => {
  cleanup();
});

describe("ResourcesPage", () => {
  it("offers a filter and folder status for comprehensive MCM archive packs", async () => {
    vi.stubEnv("VITE_TRIAL_ACCESS_CODE", "bridge-demo");
    storeTrialAccessCode("bridge-demo");

    render(<ResourcesPage />);

    expect(screen.getByRole("button", { name: "综合资料" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "下载" })).toHaveAttribute(
      "href",
      "/api/resources/demo/download?trial_code=bridge-demo",
    );
  });
});
