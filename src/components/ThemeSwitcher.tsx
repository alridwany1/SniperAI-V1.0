import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

type ThemeOption = 'light' | 'dark' | 'system';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeOption>(() => {
    return (localStorage.getItem('theme') || 'system') as ThemeOption;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      // Trigger a temporary class to enable smooth transition of all page elements
      document.documentElement.classList.add('theme-transitioning');
      
      let resolvedTheme: 'light' | 'dark';
      if (theme === 'system') {
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolvedTheme = theme;
      }
      
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }

      // Save theme preference to localStorage
      localStorage.setItem('theme', theme);

      // Remove the transitioning class after transition finishes
      const timer = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);

      return () => clearTimeout(timer);
    };

    const cleanup = applyTheme();

    if (theme === 'system') {
      const listener = () => {
        applyTheme();
      };
      mediaQuery.addEventListener('change', listener);
      return () => {
        if (cleanup) cleanup();
        mediaQuery.removeEventListener('change', listener);
      };
    }

    return cleanup;
  }, [theme]);

  const isArabic = typeof window !== 'undefined' && localStorage.getItem('language') === 'ar';

  const options: { value: ThemeOption; label: string; labelAr: string; icon: React.ComponentType<any> }[] = [
    { value: 'light', label: 'Light', labelAr: 'الوضع الفاتح', icon: Sun },
    { value: 'dark', label: 'Dark', labelAr: 'الوضع الداكن', icon: Moon },
    { value: 'system', label: 'System', labelAr: 'وضع النظام', icon: Monitor },
  ];

  return (
    <div className="flex p-1 bg-slate-900/60 dark:bg-slate-950/40 rounded-xl border border-slate-800 dark:border-slate-900/60 items-center select-none shrink-0">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`relative p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors focus:outline-none flex items-center justify-center ${
              isActive 
                ? 'text-white' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={isArabic ? opt.labelAr : `${opt.label} Mode`}
            aria-label={isArabic ? opt.labelAr : `${opt.label} Mode`}
          >
            {/* Sliding Background Pill */}
            {isActive && (
              <motion.div
                layoutId="activeThemePill"
                className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 border border-indigo-500/20 rounded-lg"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            
            <Icon className={`w-3.5 h-3.5 relative z-10 ${
              isActive 
                ? opt.value === 'light' 
                  ? 'text-amber-400' 
                  : opt.value === 'dark' 
                    ? 'text-indigo-400' 
                    : 'text-teal-400'
                : ''
            }`} />
          </button>
        );
      })}
    </div>
  );
}
