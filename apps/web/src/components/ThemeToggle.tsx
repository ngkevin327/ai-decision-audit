import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useState } from 'react';
import type { AccentPreset, ThemeMode } from '../providers/ThemeProvider';
import { useTheme } from '../providers/ThemeProvider';
import { cn } from '../lib/utils';

const modes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

const accents: { id: AccentPreset; label: string; swatch: string }[] = [
  { id: 'blue', label: 'Blue', swatch: 'hsl(221 83% 53%)' },
  { id: 'indigo', label: 'Indigo', swatch: 'hsl(262 83% 58%)' },
  { id: 'teal', label: 'Teal', swatch: 'hsl(173 80% 40%)' },
];

export function ThemeToggle() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Appearance settings"
      >
        {mode === 'dark' ? (
          <Moon className="h-4 w-4" aria-hidden />
        ) : mode === 'light' ? (
          <Sun className="h-4 w-4" aria-hidden />
        ) : (
          <Monitor className="h-4 w-4" aria-hidden />
        )}
        <span className="hidden sm:inline">Appearance</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close appearance menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-card-hover"
            role="menu"
          >
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-1">
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={mode === item.id}
                  onClick={() => {
                    setMode(item.id);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition',
                    mode === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-4 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Palette className="h-3 w-3" aria-hidden />
              Accent
            </p>
            <div className="space-y-1">
              {accents.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={accent === item.id}
                  onClick={() => setAccent(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition',
                    accent === item.id
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: item.swatch }}
                    aria-hidden
                  />
                  {item.label}
                  {accent === item.id && (
                    <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
