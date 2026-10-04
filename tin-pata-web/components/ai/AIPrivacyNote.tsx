/** Standing reminder of what leaves the browser. Shown wherever AI output is. */
export function AIPrivacyNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      Only the selected text is sent for explanation.
    </p>
  );
}
