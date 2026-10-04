'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { GoalType } from '@/types/analytics';
import { formatGoalLabel } from '@/types/analytics';

interface GoalSettingsCardProps {
  initialGoalType: GoalType;
  initialTarget: number;
  onSave: (
    goalType: GoalType,
    targetValue: number,
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function GoalSettingsCard({
  initialGoalType,
  initialTarget,
  onSave,
}: GoalSettingsCardProps) {
  const [goalType, setGoalType] = useState<GoalType>(initialGoalType);
  const [target, setTarget] = useState(String(initialTarget));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-sync the form when the saved goal changes, adjusting state during render
  // rather than in an effect (which would cost an extra render pass).
  const [syncedFrom, setSyncedFrom] = useState({
    goalType: initialGoalType,
    target: initialTarget,
  });
  if (syncedFrom.goalType !== initialGoalType || syncedFrom.target !== initialTarget) {
    setSyncedFrom({ goalType: initialGoalType, target: initialTarget });
    setGoalType(initialGoalType);
    setTarget(String(initialTarget));
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const parsed = Number(target.trim());
    startTransition(async () => {
      const result = await onSave(goalType, parsed);
      if (!result.ok) {
        setError(result.error ?? 'Could not save goal.');
        return;
      }
      setMessage(`Saved: ${formatGoalLabel(goalType, parsed)}`);
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <p className="text-xs text-muted">
        Current: {formatGoalLabel(initialGoalType, initialTarget)}
      </p>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Goal type</p>
        <div className="flex flex-wrap gap-2">
          {(['pages', 'minutes', 'sessions'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={goalType === value}
              onClick={() => setGoalType(value)}
              className={`rounded-md px-3 py-2 text-sm capitalize ${
                goalType === value
                  ? 'bg-tint text-white'
                  : 'border border-border hover:bg-tint-muted'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <Input
        label="Daily target"
        type="number"
        min={1}
        step={1}
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />
      {message ? <p className="text-sm text-tint">{message}</p> : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save daily goal'}
      </Button>
    </form>
  );
}
