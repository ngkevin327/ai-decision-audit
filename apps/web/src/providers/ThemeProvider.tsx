import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentPreset = 'blue' | 'indigo' | 'teal';

const THEME_KEY = 'audit-trail-theme';
const ACCENT_KEY = 'audit-trail-accent';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  accent: AccentPreset;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentPreset) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode, accent: AccentPreset) {
  const root = document.documentElement;
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  root.classList.toggle('dark', resolved === 'dark');
  root.setAttribute('data-accent', accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return stored ?? 'system';
  });
  const [accent, setAccentState] = useState<AccentPreset>(() => {
    const stored = localStorage.getItem(ACCENT_KEY) as AccentPreset | null;
    return stored ?? 'blue';
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    mode === 'system' ? getSystemTheme() : mode,
  );

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(THEME_KEY, next);
  }, []);

  const setAccent = useCallback((next: AccentPreset) => {
    setAccentState(next);
    localStorage.setItem(ACCENT_KEY, next);
  }, []);

  useEffect(() => {
    applyTheme(mode, accent);
    const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;
    setResolved(resolvedTheme);

    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyTheme('system', accent);
      setResolved(getSystemTheme());
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode, accent]);

  const value = useMemo(
    () => ({ mode, resolved, accent, setMode, setAccent }),
    [mode, resolved, accent, setMode, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
