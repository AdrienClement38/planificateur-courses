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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 lg:grid-cols-5">
      {DRIVE_LIST.map((drive) => {
        const isSelected = value === drive.key;
        return (
          <button
            key={drive.key}
            type="button"
            onClick={() => onChange(drive.key)}
            className={cn(
              "group relative flex flex-col items-center gap-4 rounded-xl border-2 p-5 transition-all duration-300",
              "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(212,255,63,0.1)]"
                : "border-white/5 bg-white/[0.02]"
            )}
          >
            {/* Flat Circle */}
            <div className="relative">
              <div
                className="h-8 w-8 rounded-full border-2 border-white/10 shadow-sm"
                style={{ backgroundColor: drive.color }}
              />
              {/* Glow when selected */}
              {isSelected && (
                <div 
                  className="absolute inset-0 rounded-full animate-pulse blur-[12px] opacity-50" 
                  style={{ backgroundColor: drive.color }}
                />
              )}
            </div>

            <div className="flex flex-col items-center text-center">
              <span className={cn(
                "text-sm font-bold tracking-tight transition-colors",
                isSelected ? "text-white" : "text-muted-foreground group-hover:text-white"
              )}>
                {drive.label}
              </span>
              <span className="mt-1 text-[10px] whitespace-nowrap opacity-40">
                {drive.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
