"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  tokenomicsSchema,
  type TokenomicsFormValues,
} from "@/lib/schemas/tokenomics";
import { TextField } from "@/components/ui/TextField";
import { StepFooter } from "@/components/wizard/StepFooter";
import { cn } from "@/lib/cn";

interface StepTokenomicsProps {
  defaultValues?: Partial<TokenomicsFormValues>;
  onNext: (values: TokenomicsFormValues) => void;
  onBack: () => void;
}

const ALLOCATION_FIELDS: {
  key: keyof TokenomicsFormValues;
  label: string;
  color: string;
}[] = [
  { key: "treasury", label: "Treasury", color: "#0052FF" },
  { key: "team", label: "Team", color: "#5B8DEF" },
  { key: "community", label: "Community", color: "#C4F135" },
  { key: "liquidity", label: "Liquidity", color: "#8B93A7" },
  { key: "airdrop", label: "Airdrop", color: "#FF5D5D" },
  { key: "reserve", label: "Reserve", color: "#5B6274" },
];

const DEFAULTS: TokenomicsFormValues = {
  treasury: 20,
  team: 10,
  community: 50,
  liquidity: 20,
  airdrop: 0,
  reserve: 0,
};

export function StepTokenomics({
  defaultValues,
  onNext,
  onBack,
}: StepTokenomicsProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TokenomicsFormValues>({
    resolver: zodResolver(tokenomicsSchema),
    defaultValues: { ...DEFAULTS, ...defaultValues },
  });

  const values = watch();
  const total = ALLOCATION_FIELDS.reduce(
    (sum, f) => sum + (Number(values[f.key]) || 0),
    0
  );

  const chartData = ALLOCATION_FIELDS.map((f) => ({
    name: f.label,
    value: Number(values[f.key]) || 0,
    color: f.color,
  })).filter((d) => d.value > 0);

  return (
    <form onSubmit={handleSubmit(onNext)} className="max-w-3xl space-y-8">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-5">
          {ALLOCATION_FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              type="number"
              min={0}
              max={100}
              error={undefined}
              {...register(f.key)}
            />
          ))}
        </div>

        <div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="#0A0E14" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#181D28",
                      border: "1px solid #232936",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-fog">
                Enter allocations to preview the split
              </div>
            )}
          </div>
          <p
            className={cn(
              "mt-2 text-center font-mono text-sm",
              Math.abs(total - 100) < 0.01 ? "text-signal" : "text-danger"
            )}
          >
            {total.toFixed(0)}% allocated
          </p>
          {errors.treasury?.message && (
            <p className="mt-1 text-center text-xs text-danger">
              {errors.treasury.message}
            </p>
          )}
        </div>
      </div>

      <StepFooter onBack={onBack} continueLabel="Continue to review" />
    </form>
  );
}
