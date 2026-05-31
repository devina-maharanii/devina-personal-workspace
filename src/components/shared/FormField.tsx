"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface FieldError {
  type?: string;
  message?: string;
   
  ref?: unknown;
}
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Base Props ────────────────────────────────────────────────────────────────

interface BaseFieldProps {
  /** Unique field id — must match the RHF `register` name */
  id: string;
  label: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  /** Extra class names applied to the outer wrapper */
  className?: string;
}

// ─── Input ─────────────────────────────────────────────────────────────────────

interface FormInputProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "required"> {}

/**
 * Reusable react-hook-form compatible text input with label and error display.
 *
 * @example
 * ```tsx
 * <FormInput
 *   id="name"
 *   label="Full Name"
 *   required
 *   error={errors.name}
 *   {...register("name")}
 * />
 * ```
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ id, label, error, hint, required, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5", className)}>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-zinc-300"
        >
          {label}
          {required && (
            <span className="ml-1 text-rose-400" aria-hidden>*</span>
          )}
        </label>

        <input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          className={cn(
            "w-full rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all",
            error
              ? "border-rose-500/60 focus:ring-rose-500/30 focus:border-rose-500/50"
              : "border-zinc-800 hover:border-zinc-700",
          )}
          {...props}
        />

        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-rose-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error.message}
          </p>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface FormTextareaProps
  extends BaseFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "required"> {}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ id, label, error, hint, required, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5", className)}>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
          {required && <span className="ml-1 text-rose-400" aria-hidden>*</span>}
        </label>

        <textarea
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "w-full rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all",
            error
              ? "border-rose-500/60 focus:ring-rose-500/30"
              : "border-zinc-800 hover:border-zinc-700",
          )}
          {...props}
        />

        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-zinc-500">{hint}</p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error.message}
          </p>
        )}
      </div>
    );
  },
);
FormTextarea.displayName = "FormTextarea";

// ─── Select ───────────────────────────────────────────────────────────────────

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends BaseFieldProps {
  options: FormSelectOption[];
  placeholder?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  value?: string;
  disabled?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ id, label, error, hint, required, options, placeholder, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5", className)}>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
          {label}
          {required && <span className="ml-1 text-rose-400" aria-hidden>*</span>}
        </label>

        <select
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none",
            error ? "border-rose-500/60" : "border-zinc-800 hover:border-zinc-700",
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-zinc-500">{hint}</p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error.message}
          </p>
        )}
      </div>
    );
  },
);
FormSelect.displayName = "FormSelect";

// ─── Field Error ──────────────────────────────────────────────────────────────

/** Standalone error display for custom form controls. */
export function FieldErrorMessage({ error }: { error?: FieldError }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-rose-400 mt-1.5">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {error.message}
    </p>
  );
}
