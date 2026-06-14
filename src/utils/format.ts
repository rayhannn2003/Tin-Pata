import type { GoalType } from '@/types';

export function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.pdf$/i, '').trim();
  return withoutExtension || fileName;
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return 'Unknown size';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'reading':
      return 'Reading';
    case 'paused':
      return 'Paused';
    case 'finished':
      return 'Finished';
    default:
      return status;
  }
}

export function formatPageProgress(currentPage: number, totalPages: number): string {
  if (totalPages > 0) {
    return `Page ${currentPage} / ${totalPages}`;
  }
  return `Page ${currentPage}`;
}

export function formatReadingProgressPercent(
  currentPage: number,
  totalPages: number,
): string | null {
  if (totalPages <= 0) {
    return null;
  }
  const percent = Math.round((currentPage / totalPages) * 100);
  return `${percent}% completed`;
}

export function formatImportDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLastReadDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Last read today';
  }
  if (diffDays === 1) {
    return 'Last read yesterday';
  }
  if (diffDays < 7) {
    return `Last read ${diffDays} days ago`;
  }
  return `Last read ${formatImportDate(isoDate)}`;
}

export function formatGoalTypeLabel(goalType: GoalType, count?: number): string {
  const plural = count === undefined || count !== 1;
  switch (goalType) {
    case 'pages':
      return plural ? 'pages' : 'page';
    case 'minutes':
      return plural ? 'minutes' : 'minute';
    case 'sessions':
      return plural ? 'sessions' : 'session';
    default:
      return goalType;
  }
}

export function formatGoalTitle(goalType: GoalType, targetValue: number): string {
  const unit = formatGoalTypeLabel(goalType, targetValue);
  return `${targetValue} ${unit}`;
}

export function formatGoalProgressLine(
  goalType: GoalType,
  current: number,
  target: number,
): string {
  const unit = formatGoalTypeLabel(goalType, target);
  return `${current} / ${target} ${unit}`;
}
