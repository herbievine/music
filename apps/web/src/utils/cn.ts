import clsx from "clsx";
import { type ClassNameValue, twMerge } from "tailwind-merge";

export default function cn(...args: ClassNameValue[]) {
  return clsx(twMerge(...args));
}
