"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, BookOpen, User, X } from "lucide-react";
import {
  searchEvents,
  type SearchResult,
} from "@/app/(dashboard)/dashboard/actions";

interface Props {
  onSelect: (result: SearchResult) => void;
}

export function CalendarSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await searchEvents(query);
      setResults(data);
      setLoading(false);
    }, 250);
    return () => {
      clearTimeout(handle);
      setLoading(false);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(r: SearchResult) {
    onSelect(r);
    setOpen(false);
    setQuery("");
    setResults([]);
    inputRef.current?.blur();
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="내담자, 센터, 강의 제목, 메모로 검색"
          className="w-full h-10 pl-9 pr-9 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-border/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted/60 text-muted-foreground"
            aria-label="지우기"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl bg-white shadow-lg ring-1 ring-foreground/10 max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">검색 중...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">결과 없음</div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/10 last:border-0"
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      (r.kind === "lecture" ? r.color : "#6ECFBD") + "20",
                    color: r.kind === "lecture" ? r.color : "#6ECFBD",
                  }}
                >
                  {r.kind === "lecture" ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {r.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.subtitle}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-foreground tabular-nums">
                    {format(new Date(r.date), "M월 d일 (E)", { locale: ko })}
                  </p>
                  {r.start_time && (
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {r.start_time.slice(0, 5)}
                    </p>
                  )}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
