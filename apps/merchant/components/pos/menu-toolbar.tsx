"use client";

import { Search } from "lucide-react";

export function MenuToolbar({
  query,
  onQueryChange,
  resultCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  resultCount: number;
}) {
  return (
    <div className="pos-menu-toolbar">
      <div className="pos-menu-toolbar__search">
        <Search size={18} aria-hidden className="pos-menu-toolbar__search-icon" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search menu items…"
          aria-label="Search menu items"
        />
      </div>
      <div className="pos-menu-toolbar__filters" role="tablist" aria-label="Menu filters">
        <span className="pos-menu-filter is-active" role="tab" aria-selected>
          All items
        </span>
        <span className="pos-menu-filter__count">{resultCount} items</span>
      </div>
    </div>
  );
}
