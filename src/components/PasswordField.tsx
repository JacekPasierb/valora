"use client";

import {useState} from "react";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
};

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  required = true,
  minLength,
  className = "mb-6",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 pr-20 text-ink outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 right-1.5 my-auto h-8 rounded-lg px-2.5 text-xs font-semibold text-accent transition hover:bg-accent-soft"
          aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
          aria-pressed={visible}
        >
          {visible ? "Ukryj" : "Pokaż"}
        </button>
      </div>
    </label>
  );
}
