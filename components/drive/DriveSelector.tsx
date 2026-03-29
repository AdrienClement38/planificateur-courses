"use client";

import { DRIVE_LIST } from "@/lib/drives";
import type { DriveKey } from "@/types";
import { cn } from "@/lib/utils";

interface DriveSelectorProps {
  value: DriveKey;
  onChange: (key: DriveKey) => void;
}

export function DriveSelector({ value, onChange }: DriveSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {DRIVE_LIST.map((drive) => {
        const isSelected = value === drive.key;
        return (
          <button
            key={drive.key}
            type="button"
            onClick={() => onChange(drive.key)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-150",
              "hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            )}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: drive.color }}
            />
            <span className="text-xs font-semibold">{drive.label}</span>
          </button>
        );
      })}
    </div>
  );
}
