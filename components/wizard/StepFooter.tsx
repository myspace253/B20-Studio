import { cn } from "@/lib/cn";

interface StepFooterProps {
  onBack?: () => void;
  continueLabel?: string;
  className?: string;
}

export function StepFooter({
  onBack,
  continueLabel = "Continue",
  className,
}: StepFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-line pt-6",
        className
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-fog hover:text-white"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="submit"
        className="rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim"
      >
        {continueLabel}
      </button>
    </div>
  );
}
