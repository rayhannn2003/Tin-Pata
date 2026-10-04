'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { useTheme } from '@/components/providers/ThemeProvider';
import { GoalSettingsCard } from '@/components/settings/GoalSettingsCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveDailyGoalAction } from '@/app/(dashboard)/dashboard/settings/actions';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService } from '@/services/ProfileService';
import { UserSettingsService } from '@/services/UserSettingsService';
import type { GoalType } from '@/types/analytics';
import type {
  DictionaryMode,
  DictionaryPreferences,
} from '@/types/dictionary';
import { DEFAULT_DICTIONARY_PREFERENCES } from '@/types/dictionary';
import type { Profile } from '@/types/profile';
import { DEFAULT_READER_PREFERENCES, type ReaderPreferences } from '@/types/reader';
import { ROUTES } from '@/utils/constants';

interface SettingsClientProps {
  initialGoalType?: GoalType;
  initialGoalTarget?: number;
}

export function SettingsClient({
  initialGoalType = 'pages',
  initialGoalTarget = 5,
}: SettingsClientProps) {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [readerPrefs, setReaderPrefs] = useState<ReaderPreferences>(DEFAULT_READER_PREFERENCES);
  const [dictionaryPrefs, setDictionaryPrefs] = useState<DictionaryPreferences>(
    DEFAULT_DICTIONARY_PREFERENCES,
  );
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ProfileService.getCurrent().then((row) => {
      if (cancelled || !row) return;
      setProfile(row);
      setDisplayName(row.displayName ?? '');
    });
    void UserSettingsService.loadReaderPreferences().then((prefs) => {
      if (!cancelled) setReaderPrefs(prefs);
    });
    void UserSettingsService.loadDictionaryPreferences().then((prefs) => {
      if (!cancelled) setDictionaryPrefs(prefs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    startTransition(async () => {
      const result = await ProfileService.updateDisplayName(displayName);
      if (!result.ok) {
        setProfileError(result.error ?? 'Could not save profile.');
        return;
      }
      setProfileMessage('Display name saved.');
      setProfile((prev) =>
        prev
          ? { ...prev, displayName: displayName.trim() || null, updatedAt: new Date().toISOString() }
          : prev,
      );
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace(ROUTES.signIn);
    } finally {
      setSigningOut(false);
    }
  }

  function updateReaderPref<K extends keyof ReaderPreferences>(key: K, value: ReaderPreferences[K]) {
    setReaderPrefs((prev) => {
      const next = { ...prev, [key]: value };
      void UserSettingsService.saveReaderPreferences({ [key]: value });
      return next;
    });
  }

  function updateDictionaryPref<K extends keyof DictionaryPreferences>(
    key: K,
    value: DictionaryPreferences[K],
  ) {
    setDictionaryPrefs((prev) => {
      const next = { ...prev, [key]: value };
      void UserSettingsService.saveDictionaryPreferences({ [key]: value });
      return next;
    });
  }

  const email = profile?.email ?? user?.email ?? '—';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DashboardHeader
        title="Settings"
        description="Manage your account, appearance, and web reading preferences."
      />

      <SectionCard title="Account" description="Signed-in identity for Tin Pata web and cloud sync.">
        <form className="space-y-4" onSubmit={saveProfile}>
          <div>
            <p className="text-xs font-medium text-muted">Email</p>
            <p className="mt-1 text-sm text-foreground">{authLoading ? 'Loading…' : email}</p>
          </div>
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you’d like to be addressed"
            maxLength={80}
          />
          {profileMessage ? <p className="text-sm text-tint">{profileMessage}</p> : null}
          {profileError ? (
            <p className="text-sm text-red-600" role="alert">
              {profileError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save profile'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Daily reading goal"
        description="Same goal used for streaks on web and mobile when synced."
      >
        <GoalSettingsCard
          initialGoalType={initialGoalType}
          initialTarget={initialGoalTarget}
          onSave={saveDailyGoalAction}
        />
      </SectionCard>

      <SectionCard title="Appearance" description="Theme follows across web and synced preference.">
        <fieldset>
          <legend className="sr-only">Theme</legend>
          <div className="flex flex-wrap gap-2">
            {(['light', 'dark', 'system'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
                className={`rounded-md px-3 py-2 text-sm capitalize ${
                  theme === value
                    ? 'bg-tint text-white'
                    : 'border border-border bg-background text-foreground hover:bg-tint-muted'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-3 text-xs text-muted">
          Synced to your cloud settings as theme preference (shared with mobile when enabled).
        </p>
      </SectionCard>

      <SectionCard
        title="Web reader"
        description="Defaults for the PDF reader. Changes apply the next time you open a book."
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Default zoom</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'fit-width' as const, label: 'Fit width' },
                  { value: 'fit-page' as const, label: 'Fit page' },
                  { value: 'custom' as const, label: 'Custom' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={readerPrefs.zoomMode === option.value}
                  onClick={() => updateReaderPref('zoomMode', option.value)}
                  className={`rounded-md px-3 py-2 text-sm ${
                    readerPrefs.zoomMode === option.value
                      ? 'bg-tint text-white'
                      : 'border border-border hover:bg-tint-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {readerPrefs.zoomMode === 'custom' ? (
            <label className="block text-sm">
              <span className="text-xs font-medium text-muted">Zoom scale</span>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={readerPrefs.zoomScale}
                onChange={(e) => updateReaderPref('zoomScale', Number(e.target.value))}
                className="mt-2 w-full accent-[var(--tint)]"
              />
              <span className="mt-1 block text-xs text-muted">
                {Math.round(readerPrefs.zoomScale * 100)}%
              </span>
            </label>
          ) : null}

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Show bookmarks sidebar</span>
            <input
              type="checkbox"
              checked={readerPrefs.leftSidebarOpen}
              onChange={(e) => updateReaderPref('leftSidebarOpen', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Show notes sidebar</span>
            <input
              type="checkbox"
              checked={readerPrefs.rightSidebarOpen}
              onChange={(e) => updateReaderPref('rightSidebarOpen', e.target.checked)}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Dictionary"
        description="Language and reader lookup behavior. Applies the next time you open the reader."
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Dictionary language</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'en-bn' as DictionaryMode, label: 'EN → Bangla' },
                  { value: 'en' as DictionaryMode, label: 'English only' },
                  { value: 'bn-en' as DictionaryMode, label: 'Bangla → EN' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={dictionaryPrefs.mode === option.value}
                  onClick={() => updateDictionaryPref('mode', option.value)}
                  className={`rounded-md px-3 py-2 text-sm ${
                    dictionaryPrefs.mode === option.value
                      ? 'bg-tint text-white'
                      : 'border border-border hover:bg-tint-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              EN → Bangla uses an offline word bank on the server (plus English definitions when
              available). Lookups are rate-limited and cached.
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Open dictionary on double-click</span>
            <input
              type="checkbox"
              checked={dictionaryPrefs.openOnDoubleClick}
              onChange={(e) => updateDictionaryPref('openOnDoubleClick', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Highlight word on the page</span>
            <input
              type="checkbox"
              checked={dictionaryPrefs.highlightOnPage}
              onChange={(e) => updateDictionaryPref('highlightOnPage', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Save recent lookups on this device</span>
            <input
              type="checkbox"
              checked={dictionaryPrefs.saveRecent}
              onChange={(e) => updateDictionaryPref('saveRecent', e.target.checked)}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Language & notifications" description="Synced from the mobile app.">
        <p className="text-sm text-muted">
          App language and reading reminders are managed in the Tin Pata Android app. Theme and
          daily goals above sync through the same cloud settings.
        </p>
      </SectionCard>

      <SectionCard title="Cloud PDFs" description="How web and mobile share book files.">
        <p className="text-sm text-muted">
          Metadata syncs automatically. PDF bytes only appear on web after you tap{' '}
          <strong className="font-medium text-foreground">Back up to cloud</strong> on mobile, or
          upload a PDF from the web library. Web streams the file with a signed URL — it does not
          need a separate download step.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => router.push(ROUTES.library)}
        >
          Go to library
        </Button>
      </SectionCard>

      <SectionCard title="Library upload" description="Web PDF import limits.">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-background/80 px-3 py-2.5">
            <dt className="text-xs text-muted">Max file size</dt>
            <dd className="mt-0.5 font-medium text-foreground">20 MB</dd>
          </div>
          <div className="rounded-lg bg-background/80 px-3 py-2.5">
            <dt className="text-xs text-muted">Storage</dt>
            <dd className="mt-0.5 font-medium text-foreground">Private cloud (user-pdfs)</dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => router.push(ROUTES.library)}
        >
          Go to library
        </Button>
      </SectionCard>

      <SectionCard title="About">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">App</dt>
            <dd className="font-medium text-foreground">Tin Pata Web</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Version</dt>
            <dd className="font-medium text-foreground">0.1.0 · v2.1E</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Privacy</dt>
            <dd className="text-right text-foreground">Your books stay in your private cloud.</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
