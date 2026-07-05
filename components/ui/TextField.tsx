import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

function FieldWrapper({
  label,
  hint,
  error,
  optional,
  children,
}: FieldWrapperProps & { children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        {optional && <span className="text-xs text-fog">Optional</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-fog">{hint}</span>
      ) : null}
    </label>
  );
}

type TextFieldProps = FieldWrapperProps &
  InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, optional, className, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} error={error} optional={optional}>
      <input
        ref={ref}
        className={cn(
          "mt-2 w-full rounded-sm border border-line bg-surface px-3.5 py-2.5 text-sm text-white placeholder:text-fog",
          "focus:border-base focus:outline-none",
          error && "border-danger",
          className
        )}
        {...props}
      />
    </FieldWrapper>
  )
);
TextField.displayName = "TextField";

type TextAreaFieldProps = FieldWrapperProps &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(({ label, hint, error, optional, className, ...props }, ref) => (
  <FieldWrapper label={label} hint={hint} error={error} optional={optional}>
    <textarea
      ref={ref}
      className={cn(
        "mt-2 w-full resize-none rounded-sm border border-line bg-surface px-3.5 py-2.5 text-sm text-white placeholder:text-fog",
        "focus:border-base focus:outline-none",
        error && "border-danger",
        className
      )}
      {...props}
    />
  </FieldWrapper>
));
TextAreaField.displayName = "TextAreaField";
