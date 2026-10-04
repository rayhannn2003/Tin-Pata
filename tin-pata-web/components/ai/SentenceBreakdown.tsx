import type { SentenceExplanation } from '@/types/ai';

export function SentenceBreakdown({ items }: { items: SentenceExplanation[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tint">
        Sentence by sentence
      </h3>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="border-l-2 border-border pl-3">
            <p className="text-sm italic text-muted">“{item.original}”</p>
            <p className="mt-1 text-sm text-foreground">{item.simpleExplanation}</p>
            {item.banglaExplanation ? (
              <p className="mt-1 text-sm text-foreground">{item.banglaExplanation}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
