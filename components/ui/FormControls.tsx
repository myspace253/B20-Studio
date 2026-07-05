import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, className, ...props }, ref) => (
    <label className="flex items-start gap-3">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 rounded-sm border-line bg-surface text-base accent-base",
          className
        )}
        {...props}
      />
      <span>
        <span className="block text-sm text-white">{label}</span>
        {hint && <span className="block text-xs text-fog">{hint}</span>}
      </span>
    </label>
  )
);
Checkbox.displayName = "Checkbox";

interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <label className="block">
      <span className="text-sm font-medium text-white">{label}</span>
      <select
        ref={ref}
        className={cn(
          "mt-2 w-full rounded-sm border border-line bg-surface px-3.5 py-2.5 text-sm text-white",
          "focus:border-base focus:outline-none",
          error && "border-danger",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1.5 block text-xs text-danger">{error}</span>}
    </label>
  )
);
SelectField.displayName = "SelectField";
