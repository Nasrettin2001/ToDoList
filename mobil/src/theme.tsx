import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { loadPref, savePref } from './storage';
import type { Priority } from './types';

const light = {
  bg: '#f6f7f9',
  surface: '#ffffff',
  surface2: '#eef0f4',
  border: '#e3e6eb',
  text: '#1d2330',
  muted: '#6b7383',
  accent: '#3b6cf6',
  accentSoft: '#e8eefe',
  danger: '#e5484d',
  success: '#30a46c',
  onAccent: '#ffffff',
  prio: ['#8b93a1', '#3b6cf6', '#f08c00', '#e5484d'],
};
const dark: typeof light = {
  bg: '#0f1115',
  surface: '#181b21',
  surface2: '#22262e',
  border: '#2b3039',
  text: '#e6e8ec',
  muted: '#9198a5',
  accent: '#6b93ff',
  accentSoft: '#1f2a47',
  danger: '#ff6b6f',
  success: '#3dd68c',
  onAccent: '#ffffff',
  prio: ['#8b93a1', '#6b93ff', '#ffa94d', '#ff6b6f'],
};
export type Colors = typeof light;

interface ThemeCtx {
  dark: boolean;
  c: Colors;
  toggle: () => void;
  prioColor: (p: Priority) => string;
}
const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPref] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    loadPref<'light' | 'dark'>('theme').then((p) => p && setPref(p));
  }, []);

  const isDark = (pref ?? system) === 'dark';
  const value = useMemo<ThemeCtx>(() => {
    const c = isDark ? dark : light;
    return {
      dark: isDark,
      c,
      toggle: () => {
        const next = isDark ? 'light' : 'dark';
        setPref(next);
        savePref('theme', next);
      },
      prioColor: (p) => c.prio[p],
    };
  }, [isDark]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('ThemeProvider eksik');
  return v;
}
