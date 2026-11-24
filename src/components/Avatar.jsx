// A neutral tile with the login's first letter, so rows are easy to scan.
export function Avatar({ title, large = false }) {
  const letter = title.trim().charAt(0).toUpperCase() || "?";
  const size = large ? "size-[52px] rounded-xl text-3xl" : "size-8 rounded-lg text-md";
  return (
    <span
      className={`grid flex-none place-items-center border border-line bg-surface font-semibold text-ink-2 ${size}`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
