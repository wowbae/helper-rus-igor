import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function getClientTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light'); // Всегда 'light' на SSR
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setTheme(getClientTheme()); // После монтирования — читаем актуальную тему
        setIsClient(true); // Отметка, что клиент загружен
    }, []);

    useEffect(() => {
        if (isClient) {
            // Не трогаем DOM и localStorage пока не загрузим клиент!
            applyTheme(theme);
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
    }, [theme, isClient]);

    function applyTheme(theme: Theme) {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            return;
        }
        root.classList.remove('dark');
    }

    function toggleTheme() {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }

    function setLightTheme() {
        setTheme('light');
    }

    function setDarkTheme() {
        setTheme('dark');
    }

    return {
        theme,
        toggleTheme,
        setLightTheme,
        setDarkTheme,
        isDarkTheme: theme === 'dark',
    };
}
