import type { Book } from '@/types/book';
import { formatFileSize, progressPercent } from '@/types/book';
import { formatDate } from '@/utils/date';

interface BookMetadataCardProps {
  book: Book;
}

export function BookMetadataCard({ book }: BookMetadataCardProps) {
  const items = [
    { label: 'Import date', value: formatDate(book.createdAt) || '—' },
    { label: 'Updated', value: formatDate(book.updatedAt) || '—' },
    { label: 'File size', value: formatFileSize(book.pdfFileSize) },
    { label: 'Total pages', value: book.totalPages > 0 ? String(book.totalPages) : '—' },
    {
      label: 'Reading percentage',
      value: `${progressPercent(book.currentPage, book.totalPages)}%`,
    },
    { label: 'Filename', value: book.pdfFileName ?? '—' },
    {
      label: 'Cloud PDF',
      value: book.pdfCloudAvailable ? 'Available' : 'Not on cloud yet',
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Metadata</h2>
      <dl className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
            <dt className="text-muted">{item.label}</dt>
            <dd className="max-w-[60%] truncate text-right font-medium text-foreground" title={item.value}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
        Sync status & collections — future extension points.
      </p>
    </section>
  );
}
