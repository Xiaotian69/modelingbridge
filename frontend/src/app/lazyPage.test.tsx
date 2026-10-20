// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { Suspense, useEffect } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPreloadable, lazyPage } from "./lazyPage";

afterEach(cleanup);

const Hello = ({ name = "page" }: { name?: string }) => <p>hello {name}</p>;
const factoryFor = () => vi.fn(() => Promise.resolve({ default: Hello }));

describe("lazyPage", () => {
  it("suspends before preload", async () => {
    const Page = lazyPage(factoryFor());
    render(
      <Suspense fallback={<p>loading</p>}>
        <Page />
      </Suspense>,
    );
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("hello page")).toBeInTheDocument();
  });

  it("renders synchronously after preload resolves", async () => {
    const Page = lazyPage(factoryFor());
    await Page.preload();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    const Fallback = () => {
      seen.push("loading");
      return <p>loading</p>;
    };
    flushSync(() =>
      root.render(
        <Suspense fallback={<Fallback />}>
          <Page />
        </Suspense>,
      ),
    );
    expect(host.textContent).toBe("hello page");
    expect(seen).toEqual([]);
    act(() => root.unmount());
    host.remove();
  });

  it("calls the factory once across preload and render", async () => {
    const factory = factoryFor();
    const Page = lazyPage(factory);
    await Page.preload();
    await Page.preload();
    render(
      <Suspense fallback={null}>
        <Page />
      </Suspense>,
    );
    expect(screen.getByText("hello page")).toBeInTheDocument();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("a failed preload rejects and a later preload retries", async () => {
    const factory = vi
      .fn<() => Promise<{ default: typeof Hello }>>()
      .mockRejectedValueOnce(new Error("chunk gone"))
      .mockResolvedValueOnce({ default: Hello });
    const Page = lazyPage(factory);
    await expect(Page.preload()).rejects.toThrow("chunk gone");
    await expect(Page.preload()).resolves.toBeUndefined();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("keeps a page mounted through Lazy when it re-renders after loading", async () => {
    let mounts = 0;
    const Counted = ({ name }: { name: string }) => {
      useEffect(() => {
        mounts += 1;
      }, []);
      return <p>counted {name}</p>;
    };
    const Page = lazyPage(() => Promise.resolve({ default: Counted }));
    const { rerender } = render(
      <Suspense fallback={null}>
        <Page name="a" />
      </Suspense>,
    );
    expect(await screen.findByText("counted a")).toBeInTheDocument();
    rerender(
      <Suspense fallback={null}>
        <Page name="b" />
      </Suspense>,
    );
    expect(screen.getByText("counted b")).toBeInTheDocument();
    expect(mounts).toBe(1);
  });

  it("passes props through", async () => {
    const Page = lazyPage(factoryFor());
    await Page.preload();
    render(<Page name="ahp" />);
    expect(screen.getByText("hello ahp")).toBeInTheDocument();
  });

  it("is recognisable as preloadable", () => {
    expect(isPreloadable(lazyPage(factoryFor()))).toBe(true);
    expect(isPreloadable(Hello)).toBe(false);
    expect(isPreloadable("div")).toBe(false);
  });
});
