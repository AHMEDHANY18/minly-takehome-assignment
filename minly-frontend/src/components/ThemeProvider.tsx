// src/components/ThemeProvider.tsx
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
  } from "react";

  type Theme = "light" | "dark";

  type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
  };

  const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => {},
  });

  export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
      if (typeof window === "undefined") return "light";
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || "light";
    });

    useEffect(() => {
      const root = document.documentElement;

      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      localStorage.setItem("theme", theme);
    }, [theme]);

    function toggleTheme() {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }

    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  export function useTheme() {
    return useContext(ThemeContext);
  }
