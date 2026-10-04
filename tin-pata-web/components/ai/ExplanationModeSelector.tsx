'use client';

import type { ExplanationMode } from '@/types/ai';
import { EXPLANATION_MODE_OPTIONS } from '@/types/ai';

interface ExplanationModeSelectorProps {
  mode: ExplanationMode;
  disabled?: boolean;
  onChange: (mode: ExplanationMode) => void;
}

export function ExplanationModeSelector({
  mode,
  disabled = false,
  onChange,
}: ExplanationModeSelectorProps) {
  return (
    <div role="group" aria-label="Explanation mode" className="flex flex-wrap gap-1.5">
      {EXPLANATION_MODE_OPTIONS.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            title={option.hint}
            aria-pressed={active}
            disabled={disabled && !active}
            onClick={() => {
              if (active) return;
              onChange(option.value);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? 'bg-tint text-white'
                : 'border border-border text-foreground hover:bg-tint-muted'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
