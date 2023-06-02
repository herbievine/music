export function removeDuplicates<T extends any[]>(
  arr: T,
  keys: (keyof T[number])[]
): T {
  return arr.filter(
    (val, i, arr) =>
      i === arr.findIndex((t) => keys.every((key) => t[key] === val[key])) //t[key] === val[key])
  ) as T;
}
