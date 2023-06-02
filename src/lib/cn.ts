import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { ClassNameValue } from "tailwind-merge/dist/lib/tw-join";

export default function cn(...args: ClassNameValue[]) {
  return clsx(twMerge(...args));
}
