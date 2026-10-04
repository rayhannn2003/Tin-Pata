import type { Book } from '@/types/book';
import type {
  AllTimeStats,
  AnnotatedBookmark,
  AnnotatedNote,
  DailyGoalSummary,
  DayReadingSummary,
  GoalProgressSummary,
  GoalType,
  HabitCalendarDay,
  HabitDayStatus,
  ReadingInsights,
  StreakSummary,
  WeeklyStatsSummary,
} from '@/types/analytics';
import {
  DEFAULT_GOAL_TARGET,
  DEFAULT_GOAL_TYPE,
  formatGoalLabel,
} from '@/types/analytics';
import { createClient } from '@/lib/supabase/server';
import {
  dateKeyFromIso,
  formatDayLabel,
  getLastNDays,
  getTodayDateKey,
} from '@/utils/date';

interface SessionRow {
  id: string;
  book_id: string;
  pages_read: number;
  duration_seconds: number;
  created_at: string;
}

interface GoalRow {
  id: string;
  goal_type: string;
  target_value: number;
  is_active: boolean;
}

function parseGoalType(value: string | null | undefined): GoalType {
  if (value === 'minutes' || value === 'sessions' || value === 'pages') {
    return value;
  }
  return DEFAULT_GOAL_TYPE;
}

function currentValueForGoal(
  goalType: GoalType,
  day: { pagesRead: number; minutesRead: number; sessionsCount: number },
): number {
  switch (goalType) {
    case 'minutes':
      return day.minutesRead;
    case 'sessions':
      return day.sessionsCount;
    case 'pages':
    default:
      return day.pagesRead;
  }
}

function habitStatus(day: DayReadingSummary): HabitDayStatus {
  if (day.goalCompleted) return 'completed';
  if (day.hasReading) return 'partial';
  return 'empty';
}

async function requireAuthedClient() {
  const client = await createClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  return { client, userId: user.id };
}

function summarizeSessionsByDate(
  sessions: SessionRow[],
  dateKeys: string[],
  goal: DailyGoalSummary,
): DayReadingSummary[] {
  const byDay = new Map<string, { pages: number; seconds: number; count: number }>();
  for (const key of dateKeys) {
    byDay.set(key, { pages: 0, seconds: 0, count: 0 });
  }
  for (const session of sessions) {
    const key = dateKeyFromIso(session.created_at);
    if (!key || !byDay.has(key)) continue;
    const bucket = byDay.get(key)!;
    bucket.pages += Math.max(0, session.pages_read ?? 0);
    bucket.seconds += Math.max(0, session.duration_seconds ?? 0);
    bucket.count += 1;
  }

  return dateKeys.map((dateKey) => {
    const bucket = byDay.get(dateKey)!;
    const pagesRead = bucket.pages;
    const minutesRead = Math.round(bucket.seconds / 60);
    const sessionsCount = bucket.count;
    const current = currentValueForGoal(goal.goalType, {
      pagesRead,
      minutesRead,
      sessionsCount,
    });
    return {
      dateKey,
      label: formatDayLabel(dateKey),
      pagesRead,
      minutesRead,
      sessionsCount,
      hasReading: sessionsCount > 0,
      goalCompleted: current >= goal.targetValue,
    };
  });
}

function computeStreak(daily: DayReadingSummary[], todayKey: string): StreakSummary {
  const successMap = new Map(daily.map((d) => [d.dateKey, d.goalCompleted]));
  const todayCompleted = successMap.get(todayKey) ?? false;

  const keysDesc = [...daily.map((d) => d.dateKey)].reverse();
  let startIndex = 0;
  if (!todayCompleted && keysDesc[0] === todayKey) {
    startIndex = 1;
  }

  let currentStreak = 0;
  for (let i = startIndex; i < keysDesc.length; i += 1) {
    const key = keysDesc[i];
    if (key && successMap.get(key)) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let run = 0;
  for (const day of daily) {
    if (day.goalCompleted) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  return { currentStreak, longestStreak, todayCompleted };
}

export const AnalyticsService = {
  async getActiveGoal(): Promise<DailyGoalSummary> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return {
        id: null,
        goalType: DEFAULT_GOAL_TYPE,
        targetValue: DEFAULT_GOAL_TARGET,
        isActive: true,
      };
    }

    const { data } = await ctx.client
      .from('daily_goals')
      .select('id, goal_type, target_value, is_active')
      .eq('user_id', ctx.userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return {
        id: null,
        goalType: DEFAULT_GOAL_TYPE,
        targetValue: DEFAULT_GOAL_TARGET,
        isActive: true,
      };
    }

    const row = data as GoalRow;
    return {
      id: row.id,
      goalType: parseGoalType(row.goal_type),
      targetValue: Math.max(1, row.target_value ?? DEFAULT_GOAL_TARGET),
      isActive: Boolean(row.is_active),
    };
  },

  async saveActiveGoal(
    goalType: GoalType,
    targetValue: number,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!['pages', 'minutes', 'sessions'].includes(goalType)) {
      return { ok: false, error: 'Invalid goal type.' };
    }
    if (!Number.isFinite(targetValue) || !Number.isInteger(targetValue) || targetValue <= 0) {
      return { ok: false, error: 'Target must be a positive whole number.' };
    }

    const ctx = await requireAuthedClient();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }

    const now = new Date().toISOString();
    const deviceId = 'web';

    await ctx.client
      .from('daily_goals')
      .update({ is_active: false, updated_at: now })
      .eq('user_id', ctx.userId)
      .eq('is_active', true)
      .is('deleted_at', null);

    const { error } = await ctx.client.from('daily_goals').insert({
      id: crypto.randomUUID(),
      user_id: ctx.userId,
      device_id: deviceId,
      goal_type: goalType,
      target_value: targetValue,
      is_active: true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async listSessions(limit = 2000): Promise<SessionRow[]> {
    const ctx = await requireAuthedClient();
    if (!ctx) return [];

    const { data, error } = await ctx.client
      .from('reading_sessions')
      .select('id, book_id, pages_read, duration_seconds, created_at')
      .eq('user_id', ctx.userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as SessionRow[];
  },

  async getWeeklyStats(lookbackDays = 7): Promise<WeeklyStatsSummary> {
    const goal = await this.getActiveGoal();
    const dateKeys = getLastNDays(lookbackDays);
    const sessions = await this.listSessions();
    const dailyBreakdown = summarizeSessionsByDate(sessions, dateKeys, goal);

    const habitCalendar: HabitCalendarDay[] = dailyBreakdown.map((day) => ({
      dateKey: day.dateKey,
      label: day.label,
      status: habitStatus(day),
    }));

    const bestReadingDay =
      dailyBreakdown.reduce<DayReadingSummary | null>((best, day) => {
        if (!day.hasReading) return best;
        if (!best || day.pagesRead > best.pagesRead) return day;
        return best;
      }, null);

    return {
      totalPagesThisWeek: dailyBreakdown.reduce((sum, d) => sum + d.pagesRead, 0),
      totalMinutesThisWeek: dailyBreakdown.reduce((sum, d) => sum + d.minutesRead, 0),
      totalSessionsThisWeek: dailyBreakdown.reduce((sum, d) => sum + d.sessionsCount, 0),
      readingDaysThisWeek: dailyBreakdown.filter((d) => d.hasReading).length,
      completedGoalDaysThisWeek: dailyBreakdown.filter((d) => d.goalCompleted).length,
      bestReadingDay,
      dailyBreakdown,
      habitCalendar,
    };
  },

  async getStreak(lookbackDays = 365): Promise<StreakSummary> {
    const goal = await this.getActiveGoal();
    const dateKeys = getLastNDays(lookbackDays);
    const sessions = await this.listSessions();
    const daily = summarizeSessionsByDate(sessions, dateKeys, goal);
    return computeStreak(daily, getTodayDateKey());
  },

  async getGoalProgress(): Promise<GoalProgressSummary> {
    const goal = await this.getActiveGoal();
    const todayKey = getTodayDateKey();
    const sessions = await this.listSessions();
    const days = summarizeSessionsByDate(sessions, [todayKey], goal);
    const today = days[0] ?? {
      pagesRead: 0,
      minutesRead: 0,
      sessionsCount: 0,
    };
    const currentValue = currentValueForGoal(goal.goalType, today);
    const percentage = Math.min(
      100,
      Math.round((currentValue / Math.max(1, goal.targetValue)) * 100),
    );
    return {
      goalType: goal.goalType,
      targetValue: goal.targetValue,
      currentValue,
      percentage,
      isCompleted: currentValue >= goal.targetValue,
      remainingValue: Math.max(0, goal.targetValue - currentValue),
      label: formatGoalLabel(goal.goalType, goal.targetValue),
    };
  },

  async getAllTimeStats(): Promise<AllTimeStats> {
    const sessions = await this.listSessions();
    const todayKey = getTodayDateKey();
    let todayPages = 0;
    let todaySeconds = 0;
    let totalSeconds = 0;
    let totalPages = 0;

    for (const session of sessions) {
      const pages = Math.max(0, session.pages_read ?? 0);
      const seconds = Math.max(0, session.duration_seconds ?? 0);
      totalPages += pages;
      totalSeconds += seconds;
      if (dateKeyFromIso(session.created_at) === todayKey) {
        todayPages += pages;
        todaySeconds += seconds;
      }
    }

    return {
      totalSessions: sessions.length,
      totalMinutes: Math.round(totalSeconds / 60),
      totalPages,
      todayPages,
      todayMinutes: Math.round(todaySeconds / 60),
    };
  },

  async getInsights(books: Book[]): Promise<ReadingInsights> {
    const sessions = await this.listSessions();
    if (sessions.length === 0) {
      return {
        bestReadingDay: null,
        averagePagesPerSession: 0,
        averageMinutesPerSession: 0,
        longestSessionMinutes: 0,
        mostReadBookTitle: null,
      };
    }

    const byDay = new Map<string, number>();
    const byBook = new Map<string, number>();
    let totalPages = 0;
    let totalSeconds = 0;
    let longestSeconds = 0;

    for (const session of sessions) {
      const pages = Math.max(0, session.pages_read ?? 0);
      const seconds = Math.max(0, session.duration_seconds ?? 0);
      totalPages += pages;
      totalSeconds += seconds;
      longestSeconds = Math.max(longestSeconds, seconds);
      const key = dateKeyFromIso(session.created_at);
      if (key) byDay.set(key, (byDay.get(key) ?? 0) + pages);
      byBook.set(session.book_id, (byBook.get(session.book_id) ?? 0) + pages);
    }

    let bestReadingDay: ReadingInsights['bestReadingDay'] = null;
    for (const [dateKey, pagesRead] of byDay) {
      if (!bestReadingDay || pagesRead > bestReadingDay.pagesRead) {
        bestReadingDay = { dateKey, pagesRead };
      }
    }

    let mostReadBookId: string | null = null;
    let mostPages = 0;
    for (const [bookId, pages] of byBook) {
      if (pages > mostPages) {
        mostPages = pages;
        mostReadBookId = bookId;
      }
    }

    const titleMap = new Map(books.map((b) => [b.id, b.title]));
    return {
      bestReadingDay,
      averagePagesPerSession: Math.round((totalPages / sessions.length) * 10) / 10,
      averageMinutesPerSession: Math.round(totalSeconds / 60 / sessions.length),
      longestSessionMinutes: Math.round(longestSeconds / 60),
      mostReadBookTitle: mostReadBookId ? (titleMap.get(mostReadBookId) ?? null) : null,
    };
  },

  async listRecentNotes(limit = 5): Promise<AnnotatedNote[]> {
    const ctx = await requireAuthedClient();
    if (!ctx) return [];

    const { data, error } = await ctx.client
      .from('notes')
      .select('id, book_id, page_number, note_text, updated_at')
      .eq('user_id', ctx.userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error || !data?.length) return [];

    const bookIds = [...new Set(data.map((n) => n.book_id))];
    const { data: books } = await ctx.client
      .from('books')
      .select('id, title')
      .eq('user_id', ctx.userId)
      .in('id', bookIds);

    const titles = new Map((books ?? []).map((b) => [b.id, b.title as string]));
    return data.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      bookTitle: titles.get(row.book_id) ?? 'Unknown book',
      pageNumber: row.page_number,
      noteText: row.note_text,
      updatedAt: row.updated_at,
    }));
  },

  async listRecentBookmarks(limit = 5): Promise<AnnotatedBookmark[]> {
    const ctx = await requireAuthedClient();
    if (!ctx) return [];

    const { data, error } = await ctx.client
      .from('bookmarks')
      .select('id, book_id, page_number, title, created_at')
      .eq('user_id', ctx.userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data?.length) return [];

    const bookIds = [...new Set(data.map((b) => b.book_id))];
    const { data: books } = await ctx.client
      .from('books')
      .select('id, title')
      .eq('user_id', ctx.userId)
      .in('id', bookIds);

    const titles = new Map((books ?? []).map((b) => [b.id, b.title as string]));
    return data.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      bookTitle: titles.get(row.book_id) ?? 'Unknown book',
      pageNumber: row.page_number,
      title: row.title,
      createdAt: row.created_at,
    }));
  },
};
