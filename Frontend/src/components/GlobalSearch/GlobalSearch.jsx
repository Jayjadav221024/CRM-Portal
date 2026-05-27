import { useState, useRef, useEffect, memo, useCallback } from "react";
import { useLeadSearch } from "../../hooks/useLeads";
import { useDebounce } from "../../hooks/useDebounce";

import StatusBadge from "../StatusBadge/StatusBadge";

import styles from "./GlobalSearch.module.css";

const GlobalSearch = memo(() => {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce input
  const debouncedQuery = useDebounce(input, 300);

  // API CALL
  const { data, isFetching } = useLeadSearch(debouncedQuery);

  // SAFE RESULTS
  const results = Array.isArray(data)
    ? data
    : data?.data || [];

  // Open dropdown
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, []);

  // Input change
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  // Clear search
  const handleClear = useCallback(() => {
    setInput("");
    setIsOpen(false);

    inputRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.wrapper}
      ref={containerRef}
    >
      <div className={styles.inputWrapper}>
        {/* SEARCH ICON */}
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx={11} cy={11} r={8} />
          <path d="m21 21-4.35-4.35" />
        </svg>

        {/* INPUT */}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Search leads... (Ctrl+K)"
          value={input}
          onChange={handleInputChange}
          onFocus={() =>
            debouncedQuery.length >= 2 &&
            setIsOpen(true)
          }
          autoComplete="off"
          spellCheck={false}
        />

        {/* LOADER */}
        {isFetching && (
          <span className={styles.spinner} />
        )}

        {/* CLEAR BUTTON */}
        {input && !isFetching && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
          >
            ×
          </button>
        )}

        {/* KEYBOARD SHORTCUT */}
        <kbd className={styles.kbd}>
          Ctrl+K
        </kbd>
      </div>

      {/* DROPDOWN */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* EMPTY */}
          {!isFetching &&
            results.length === 0 && (
              <div className={styles.empty}>
                No results found
              </div>
            )}

          {/* RESULTS */}
          {Array.isArray(results) &&
            results.map((lead) => (
              <div
                key={lead._id}
                className={styles.result}
              >
                <div className={styles.resultMain}>
                  <span className={styles.resultName}>
                    {highlightMatch(
                      lead.name,
                      debouncedQuery
                    )}
                  </span>

                  <StatusBadge
                    status={lead.status}
                  />
                </div>

                <div className={styles.resultSub}>
                  <span>
                    {highlightMatch(
                      lead.email,
                      debouncedQuery
                    )}
                  </span>

                  <span className={styles.dot}>
                    ·
                  </span>

                  <span>
                    {highlightMatch(
                      lead.company,
                      debouncedQuery
                    )}
                  </span>

                  <span className={styles.dot}>
                    ·
                  </span>

                  <span className={styles.owner}>
                    {lead.owner}
                  </span>
                </div>
              </div>
            ))}

          {/* FOOTER */}
          {results.length > 0 && (
            <div className={styles.footer}>
              {results.length} result
              {results.length !== 1
                ? "s"
                : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Highlight matching text
function highlightMatch(text, query) {
  if (!query || !text) return text;

  const escaped = query.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `(${escaped})`,
    "gi"
  );

  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        style={{
          background:
            "rgba(59,130,246,0.2)",
          color: "#2563eb",
          borderRadius: "2px",
          padding: "0 2px",
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

GlobalSearch.displayName = "GlobalSearch";

export default GlobalSearch;