"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("dsa-lab-theme", nextTheme);
  }

  return (
    <button
      aria-label="切换深色或浅色模式"
      className="icon-button"
      onClick={toggleTheme}
      type="button"
    >
      <Sun aria-hidden="true" className="theme-icon theme-icon-sun" size={18} />
      <Moon aria-hidden="true" className="theme-icon theme-icon-moon" size={18} />
    </button>
  );
}
