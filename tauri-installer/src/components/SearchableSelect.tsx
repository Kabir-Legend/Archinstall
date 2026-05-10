import { useState, useMemo } from "react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  loading = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <div>
      <div className="search-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>

      {loading ? (
        <div className="loading-row">
          <div className="spinner" />
          Loading...
        </div>
      ) : (
        <div className="option-list">
          {filtered.length === 0 ? (
            <div className="option-item text-muted">No results found</div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt}
                className={`option-item ${value === opt ? "selected" : ""}`}
                onClick={() => onChange(opt)}
              >
                {opt || placeholder}
                <span className="check-mark">✓</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
