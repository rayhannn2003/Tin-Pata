import type { VocabularyItem } from '@/types/ai';

export function VocabularyList({ items }: { items: VocabularyItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-tint">
        Vocabulary
      </h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={`${item.term}-${index}`}
            className="rounded-lg border border-border px-3 py-2"
          >
            <p className="text-sm font-semibold text-foreground">
              {item.term}
              {item.banglaMeaning ? (
                <span className="ml-2 font-normal text-tint">{item.banglaMeaning}</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-sm text-foreground">{item.simpleMeaning}</p>
            {item.contextualMeaning ? (
              <p className="mt-1 text-xs text-muted">Here: {item.contextualMeaning}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
