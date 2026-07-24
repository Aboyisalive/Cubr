import { clsx, type ClassValue } from "clsx";

/** Tiny className joiner used across components. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
