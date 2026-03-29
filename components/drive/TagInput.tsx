"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTagInput } from "@/hooks/useTagInput";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  variant?: "default" | "destructive";
}

export function TagInput({
  value,
  onChange,
  placeholder = "Ajouter… (Entrée)",
  variant = "default",
}: TagInputProps) {
  const { tags, inputValue, setInputValue, removeTag, handleKeyDown } =
    useTagInput(value);

  // Keep parent in sync
  const handleRemove = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    removeTag(tag);
    onChange(next);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const prev = [...tags];
    handleKeyDown(e);
    // Defer to read updated state
    setTimeout(() => {
      if (tags.length !== prev.length) onChange([...tags]);
    }, 0);
  };

  const handleChange = (v: string) => {
    setInputValue(v);
    if (v.endsWith(",")) {
      const trimmed = v.replace(/,$/, "").trim();
      if (trimmed && !tags.includes(trimmed)) {
        const next = [...tags, trimmed];
        onChange(next);
        setInputValue("");
      }
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-[42px] flex-wrap gap-1.5 rounded-md border bg-background px-3 py-2",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
            variant === "destructive"
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/15 text-primary"
          )}
        >
          {tag}
          <button
            type="button"
            onClick={() => handleRemove(tag)}
            className="ml-0.5 rounded-full hover:opacity-70"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
}
