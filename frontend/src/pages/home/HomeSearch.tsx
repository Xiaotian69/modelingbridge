import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { modelMethods } from "../../data/modelingContent";
import { COURSES } from "../../learning/courses";
import {
  lessonEntries,
  searchEntries,
  staticEntries,
  type SearchEntry,
} from "../../app/searchIndex";

const shortcuts = ["优化", "预测", "评价", "统计", "约束"];

/** The advanced door: type and go, without a separate search page. */
export function HomeSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [lessons, setLessons] = useState<SearchEntry[]>([]);
  const loading = useRef(false);
  const base = useMemo(staticEntries, []);
  const results = useMemo(
    () => searchEntries([...lessons, ...base], query),
    [lessons, base, query],
  );

  function loadLessons() {
    if (loading.current) return;
    loading.current = true;
    lessonEntries()
      .then(setLessons)
      .catch(() => {
        loading.current = false; // Lesson chunk failed to load; other results still work.
      });
  }
  useEffect(() => setActive(0), [query]);

  const show = open && query.trim().length > 0;
  function go(entry?: SearchEntry) {
    if (!entry) return;
    setOpen(false);
    navigate(entry.href);
  }

  return (
    <div className="home-search">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(results[active]);
        }}
      >
        <label className="search-field">
          <Icon name="search" size={18} />
          <span className="sr-only">搜索方法、题型或赛题</span>
          <input
            role="combobox"
            aria-expanded={show}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={show && results[active] ? `${listId}-${active}` : undefined}
            value={query}
            placeholder="搜索方法、题型或赛题，例如“优化”"
            onFocus={() => {
              setOpen(true);
              loadLessons();
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              loadLessons();
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
          />
        </label>
      </form>
      <div className="search-shortcuts" aria-label="常用查找">
        {shortcuts.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => {
              setQuery(word);
              setOpen(true);
              loadLessons();
            }}
          >
            {word}
          </button>
        ))}
      </div>
      <p className="door-note">已开放 {COURSES.length} 篇精讲 · {modelMethods.length} 种方法速查</p>
      {show && (
        <ul className="search-results" id={listId} role="listbox" aria-label="搜索结果">
          {results.length === 0 && (
            <li className="search-empty" role="option" aria-selected="false" aria-disabled="true">
              没有找到“{query}”。可以换个说法，或直接打开精讲目录。
            </li>
          )}
          {results.map((entry, i) => (
            <li
              key={entry.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "is-active" : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => go(entry)}
            >
              {(i === 0 || results[i - 1].group !== entry.group) && (
                <span className="search-group">{entry.group}</span>
              )}
              <span className="search-row">
                <span>
                  <b>{entry.title}</b>
                  <small>{entry.meta}</small>
                </span>
                <span className="badge">{entry.badge}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
