import { z } from "zod";

export const CATEGORIES = [
  "dietary",
  "beverage",
  "room",
  "family",
  "wellness",
  "interests",
  "milestones",
  "sensitivities",
  "service",
] as const;

export const ROLES = [
  "front_desk",
  "concierge",
  "restaurant",
  "spa",
  "housekeeping",
] as const;

export const extractSchema = z.object({
  categories: z.array(z.enum(CATEGORIES)).min(1),
  facts: z.array(z.object({ type: z.string(), value: z.string() })).min(1),
  applicableRoles: z.array(z.enum(ROLES)).min(1),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(5),
});

export type Extracted = z.infer<typeof extractSchema>;
