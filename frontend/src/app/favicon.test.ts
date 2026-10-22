// The site icon: index.html links three files that exist in public/, the SVG reuses the header mark,
// and the raster files have the declared sizes. Files are read from disk (Vitest stubs asset imports).
import { beforeAll, describe, expect, it } from "vitest";

type Fs = { readFileSync(path: string, encoding?: string): string | Uint8Array; existsSync(path: string): boolean };
let fs: Fs;
let html = "";
beforeAll(async () => {
  fs = (await import(/* @vite-ignore */ "node:fs" as string)) as Fs;
  html = fs.readFileSync("index.html", "utf8") as string;
});
const bytes = (path: string) => fs.readFileSync(path) as Uint8Array;
const u16 = (b: Uint8Array, at: number) => b[at] | (b[at + 1] << 8);
const u32be = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;

describe("favicon", () => {
  it("index.html links the ICO, SVG and Apple Touch Icon, and each file exists", () => {
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="32x32" />');
    expect(html).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
    for (const f of ["favicon.ico", "favicon.svg", "apple-touch-icon.png"]) expect(fs.existsSync(`public/${f}`), f).toBe(true);
  });

  it("the SVG draws the header's M mark (same path and dot) with no text", () => {
    const svg = fs.readFileSync("public/favicon.svg", "utf8") as string;
    const brand = fs.readFileSync("src/components/ui/Brand.tsx", "utf8") as string;
    const path = brand.match(/d="([^"]+)"/)![1];
    expect(svg).toContain(`d="${path}"`);
    expect(svg).toContain('<circle cx="18" cy="8" r="2"');
    expect(brand).toContain('<circle cx="18" cy="8" r="2"');
    expect(svg).toContain('viewBox="0 0 36 36"');
    expect(brand).toContain('viewBox="0 0 36 36"');
    expect(svg).not.toMatch(/<text/);
    // Brand colours already used by the home header (tokens.css: --hero-bg, --mint).
    expect(svg).toContain("#0B1D24");
    expect(svg).toContain("#91E4C8");
  });

  it("favicon.ico holds 16, 32 and 48 px PNG images", () => {
    const ico = bytes("public/favicon.ico");
    expect([u16(ico, 0), u16(ico, 2), u16(ico, 4)]).toEqual([0, 1, 3]);
    const sizes = [0, 1, 2].map((i) => ico[6 + 16 * i]);
    expect(sizes).toEqual([16, 32, 48]);
    for (let i = 0; i < 3; i++) {
      const offset = ico[6 + 16 * i + 12] | (ico[6 + 16 * i + 13] << 8) | (ico[6 + 16 * i + 14] << 16);
      expect([...ico.slice(offset + 1, offset + 4)].map((c) => String.fromCharCode(c)).join("")).toBe("PNG");
      expect(u32be(ico, offset + 16)).toBe(sizes[i]); // IHDR width
    }
  });

  it("apple-touch-icon.png is 180 × 180", () => {
    const png = bytes("public/apple-touch-icon.png");
    expect([u32be(png, 16), u32be(png, 20)]).toEqual([180, 180]);
  });
});
