import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return theme === "dark" || (!theme && prefersDark);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newDark = !isDark;
    console.log("Setting theme to:", newDark ? "dark" : "light");
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2.5 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-400 transition-all duration-300 shadow-lg shadow-indigo-500/5"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-500 rotate-0" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-500" />
      )}
    </motion.button>
  );
}
