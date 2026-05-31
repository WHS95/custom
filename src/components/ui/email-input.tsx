"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface EmailInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

const EMAIL_DOMAINS = [
  { domain: "gmail.com", triggers: ["g", "gm", "gma", "gmai"] },
  { domain: "naver.com", triggers: ["n", "na", "nav", "nave"] },
  { domain: "kakao.com", triggers: ["k", "ka", "kak", "kaka"] },
  { domain: "daum.net", triggers: ["d", "da", "dau"] },
  { domain: "hanmail.net", triggers: ["h", "ha", "han", "hanm"] },
  { domain: "nate.com", triggers: ["nat", "nate"] },
  { domain: "outlook.com", triggers: ["o", "ou", "out"] },
  { domain: "icloud.com", triggers: ["i", "ic", "icl"] },
];

function getSuggestions(email: string) {
  const atIndex = email.indexOf("@");

  if (atIndex <= 0) {
    return [];
  }

  const query = email.slice(atIndex + 1).trim().toLowerCase();
  const scored = EMAIL_DOMAINS.map((item) => {
    if (!query) {
      return { ...item, score: 100 };
    }

    if (item.domain === query) {
      return { ...item, score: 0 };
    }

    if (item.domain.startsWith(query)) {
      return { ...item, score: 3 };
    }

    if (item.triggers.some((trigger) => trigger.startsWith(query))) {
      return { ...item, score: 2 };
    }

    if (item.domain.includes(query)) {
      return { ...item, score: 1 };
    }

    return { ...item, score: -1 };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored;
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ value, onChange, className, onFocus, onBlur, onKeyDown, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);

    const suggestions = useMemo(() => getSuggestions(value), [value]);
    const showSuggestions = isFocused && suggestions.length > 0;
    const atIndex = value.indexOf("@");
    const beforeAt = atIndex > 0 ? value.slice(0, atIndex + 1) : "";

    const selectSuggestion = useCallback(
      (domain: string) => {
        if (atIndex <= 0) return;
        onChange(`${value.slice(0, atIndex + 1)}${domain}`);
        setSelectedIndex(-1);
      },
      [atIndex, onChange, value],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setSelectedIndex(-1);
      },
      [onChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(e);
        if (!showSuggestions) return;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
            break;
          case "Enter":
          case "Tab":
            if (selectedIndex >= 0) {
              e.preventDefault();
              selectSuggestion(suggestions[selectedIndex].domain);
            }
            break;
          case "Escape":
            setIsFocused(false);
            break;
          default:
            break;
        }
      },
      [onKeyDown, selectedIndex, selectSuggestion, showSuggestions, suggestions],
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsFocused(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={ref}
          type="email"
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            onBlur?.(e);
          }}
          onKeyDown={handleKeyDown}
          className={cn(className)}
          autoComplete="email"
          {...props}
        />

        {showSuggestions ? (
          <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-none border border-hairline bg-canvas animate-[fadeIn_0.12s_ease-out]">
            <div className="py-1">
              {suggestions.map((item, index) => (
                <button
                  key={item.domain}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(item.domain)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
                    "hover:bg-soft-cloud",
                    index === selectedIndex && "bg-soft-cloud",
                  )}
                >
                  <span className="truncate text-mute">{beforeAt}</span>
                  <span className="truncate font-medium text-ink">{item.domain}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

EmailInput.displayName = "EmailInput";
