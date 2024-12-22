import cn from "../../utils/cn";

type Props = React.ComponentProps<"button">;

export function Button({ className, children, ...props }: Props) {
  return (
    <button
      className={cn("w-full px-4 py-3 bg-zinc-800 rounded-xl", className)}
      {...props}
    >
      {children}
    </button>
  );
}
