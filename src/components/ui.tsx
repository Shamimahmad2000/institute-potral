import React from 'react';
import { AlertCircle, CheckCircle2, Globe, Inbox, Moon, Sun } from 'lucide-react';
import { Language, useI18n } from '../lib/i18n';

export const SkeletonRows: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="w-full space-y-2.5 py-2" aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="grid gap-4 items-center px-4 py-3 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/40 animate-pulse"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((__, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 rounded bg-slate-200 dark:bg-slate-800 ${
                cIdx === 0 ? 'w-3/4' : cIdx === cols - 1 ? 'w-1/2 justify-self-end' : 'w-2/3'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors whitespace-nowrap"
          style={{ backgroundColor: 'var(--brand-primary, #1d4ed8)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const ErrorBanner: React.FC<{ message: string | null; onDismiss?: () => void }> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 p-4 rounded-lg border border-red-300 dark:border-red-900/70 bg-red-50/90 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-sm"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-red-800 dark:text-red-300">
            Database / System Response
          </p>
          <p className="text-sm break-words">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-red-700 dark:text-red-300 hover:underline shrink-0"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export const SuccessBanner: React.FC<{ message: string | null; onDismiss?: () => void }> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;
  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 p-4 rounded-lg border border-emerald-300 dark:border-emerald-900/70 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-sm"
    >
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-sm break-words">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export const LanguageThemeControls: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { lang, setLang, theme, toggleTheme } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center">
        <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 pointer-events-none absolute start-2.5" />
        <select
          aria-label="Select Language"
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          className={`ps-7 pe-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            compact ? 'text-xs' : ''
          }`}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="ur">اردو (Urdu RTL)</option>
        </select>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );
};
