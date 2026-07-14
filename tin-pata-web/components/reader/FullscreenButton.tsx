'use client';

interface FullscreenButtonProps {
  active: boolean;
  onToggle: () => void;
}

export function FullscreenButton({ active, onToggle }: FullscreenButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? 'Exit fullscreen' : 'Enter fullscreen'}
      title={active ? 'Exit fullscreen (Esc)' : 'Fullscreen (F)'}
      onClick={onToggle}
      className="inline-flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium text-foreground hover:bg-tint-muted"
    >
      {active ? 'Exit' : 'Full'}
    </button>
  );
}
