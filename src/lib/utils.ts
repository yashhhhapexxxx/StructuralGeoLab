import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = (v: number, digits = 0) => v.toFixed(digits);
export const deg = (v: number, digits = 0) => `${v.toFixed(digits)}°`;
