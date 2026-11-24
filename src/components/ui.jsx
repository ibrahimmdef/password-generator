// Small building blocks. With Tailwind, a style that repeats becomes a
// React component instead of a CSS class: <Button variant="primary">.

const BUTTON = {
  base: "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-medium disabled:opacity-45",
  variant: {
    default: "border-line bg-window hover:enabled:bg-hover",
    primary: "border-primary bg-primary text-on-primary hover:enabled:opacity-90",
    danger: "border-line bg-window text-danger hover:enabled:bg-hover",
  },
  size: {
    md: "h-8 px-3",
    lg: "h-9 px-4 text-md",
  },
};

export function Button({ variant = "default", size = "md", className = "", ...props }) {
  return <button className={`${BUTTON.base} ${BUTTON.variant[variant]} ${BUTTON.size[size]} ${className}`} {...props} />;
}

export const iconButtonClass =
  "inline-grid size-8 place-items-center rounded-md text-ink-2 hover:bg-hover hover:text-ink aria-pressed:text-ink disabled:opacity-45 disabled:hover:bg-transparent";

export function IconButton({ className = "", ...props }) {
  return <button type="button" className={`${iconButtonClass} ${className}`} {...props} />;
}

export const inputClass =
  "h-8 w-full rounded-md border border-line bg-window px-2.5 focus-visible:border-transparent focus-visible:outline-offset-0 aria-invalid:border-danger";

export function Input({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

/** A label above a control. */
export function Field({ label, className = "", children }) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <span className="font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

export function Hint({ error = false, className = "", ...props }) {
  return <p className={`text-sm ${error ? "text-danger" : "text-ink-2"} ${className}`} {...props} />;
}

// Shared layout pieces for the three columns
export const pane = "flex min-h-0 flex-col";
export const paneBar = "flex h-14 flex-none items-center gap-2 px-3";
export const paneScroll = "min-h-0 flex-1 overflow-y-auto";

/** Grouped box of label/value rows, like macOS Settings. */
export function Group({ children }) {
  return <div className="rounded-lg bg-surface">{children}</div>;
}

export function GroupRow({ label, children, actions }) {
  return (
    <div className="grid min-h-12 grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-3 border-line py-1.5 pr-2 pl-4 [&+&]:border-t">
      <span className="text-ink-2">{label}</span>
      <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
      <div className="flex gap-0.5">{actions}</div>
    </div>
  );
}

export function Muted({ children }) {
  return <span className="text-ink-3">{children}</span>;
}

export function EmptyState({ title, children, actions }) {
  return (
    <div className="grid h-full place-content-center justify-items-center gap-2.5 p-6 text-center text-ink-2">
      {title && <strong className="text-lg text-ink">{title}</strong>}
      {children}
      {actions && <div className="mt-1 flex gap-2">{actions}</div>}
    </div>
  );
}
