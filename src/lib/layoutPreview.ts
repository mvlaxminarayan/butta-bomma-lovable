import { useEffect, useState } from "react";

// Temporary preview-only layout switcher for comparing header/homepage options.
export type HeaderLayout = "current" | "centered" | "twoTier";
export type HomeLayout = "current" | "story" | "categories";
export interface LayoutChoice { header: HeaderLayout; home: HomeLayout }

const KEY = "layout-preview";
const EVT = "layout-preview-change";
const DEFAULT: LayoutChoice = { header: "current", home: "current" };

export const isPreviewHost = () => {
  const h = window.location.hostname;
  return h === "localhost" || h.includes("lovableproject") || h.includes("id-preview");
};

const read = (): LayoutChoice => {
  if (!isPreviewHost()) return DEFAULT;
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULT; }
};

export const setLayoutChoice = (c: Partial<LayoutChoice>) => {
  localStorage.setItem(KEY, JSON.stringify({ ...read(), ...c }));
  window.dispatchEvent(new Event(EVT));
};

export const useLayoutChoice = () => {
  const [choice, setChoice] = useState<LayoutChoice>(read);
  useEffect(() => {
    const f = () => setChoice(read());
    window.addEventListener(EVT, f);
    return () => window.removeEventListener(EVT, f);
  }, []);
  return choice;
};
