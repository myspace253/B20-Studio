import { z } from "zod";

export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or fewer"),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(11, "Symbol must be 11 characters or fewer")
    .regex(/^[A-Z0-9]+$/, "Use uppercase letters and numbers only"),
  description: z
    .string()
    .max(280, "Description must be 280 characters or fewer")
    .optional()
    .or(z.literal("")),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  twitter: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  telegram: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  discord: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Upload an image first").optional().or(z.literal("")),
});

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;
