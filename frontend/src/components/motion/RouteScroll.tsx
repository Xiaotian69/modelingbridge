import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** Wait for lazy content before resolving hashes or restoring history position. */
export function RouteScroll() {
  const location = useLocation();
  const navigation = useNavigationType();
  const positions = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);
  useLayoutEffect(() => {
    let done = false;
    let frame = 0;
    const restore = () => {
      if (
        done ||
        document.querySelector('.page-loading, [data-route-pending="true"]')
      )
        return;
      const saved =
        navigation === "POP" ? positions.current.get(location.key) : undefined;
      let target: HTMLElement | null = null;
      try {
        target = location.hash
          ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
          : null;
      } catch {
        /* Malformed URL hash: use page top. */
      }
      const top =
        saved ??
        (target ? target.getBoundingClientRect().top + window.scrollY - 90 : 0);
      window.scrollTo({ top, behavior: "instant" });
      done = true;
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    });
    observer.observe(document.getElementById("main-content") || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-route-pending"],
    });
    frame = requestAnimationFrame(restore);
    const record = () => {
      if (done) positions.current.set(location.key, window.scrollY);
    };
    window.addEventListener("scroll", record, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", record);
    };
  }, [location.key, location.hash, navigation]);
  return null;
}
