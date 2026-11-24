import { useEffect, useRef, useState } from "react";
import { generatePassword, MAX_LENGTH, MIN_LENGTH } from "../lib/password";
import { Icon } from "./Icon";
import { StrengthMeter } from "./StrengthMeter";
import { Button, Hint, IconButton } from "./ui";

const DEFAULTS = { length: 20, upper: true, lower: true, digit: true, symbol: true, excludeAmbiguous: false };

const CHECKS = [
  ["upper", "Uppercase"],
  ["lower", "Lowercase"],
  ["digit", "Numbers"],
  ["symbol", "Symbols"],
  ["excludeAmbiguous", "Avoid look-alikes"],
];

/** Popover under the password field. Calls onUse(password) or onClose(). */
export function PasswordGenerator({ onUse, onClose }) {
  const [options, setOptions] = useState(DEFAULTS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULTS));
  const ref = useRef(null);

  // Every change to the options makes a new password right away
  function update(patch) {
    const next = { ...options, ...patch };
    setOptions(next);
    setPassword(generatePassword(next));
  }

  // Close when clicking anywhere outside the popover
  useEffect(() => {
    function onPointerDown(e) {
      if (!ref.current?.contains(e.target)) onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Password generator"
      className="absolute top-[calc(100%+6px)] right-0 z-10 grid w-80 gap-3 rounded-[10px] border border-line bg-window p-3.5 shadow-[0_10px_30px_rgb(0_0_0/0.16)]"
    >
      <div className="flex items-center gap-1.5 rounded-md bg-surface py-2 pr-1.5 pl-2.5">
        <span className="flex-1 font-mono text-md [overflow-wrap:anywhere]">{password ?? "—"}</span>
        <IconButton onClick={() => setPassword(generatePassword(options))} aria-label="Make another password" title="Regenerate">
          <Icon name="refresh" />
        </IconButton>
      </div>

      {password ? <StrengthMeter password={password} /> : <Hint error>Turn on at least one kind of character.</Hint>}

      <label className="flex items-center gap-2.5">
        <span className="w-14 text-ink-2">Length</span>
        <input
          type="range"
          className="flex-1 accent-ink"
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={options.length}
          onChange={(e) => update({ length: Number(e.target.value) })}
        />
        <output className="w-6 text-right font-semibold tabular-nums">{options.length}</output>
      </label>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {CHECKS.map(([key, label]) => (
          <label key={key} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="accent-ink"
              checked={options[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>

      <Button type="button" variant="primary" disabled={!password} onClick={() => onUse(password)}>
        Use Password
      </Button>
    </div>
  );
}
