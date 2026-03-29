import { z } from "zod";

export const ShoppingItemSchema = z.object({
  name: z.string(),
  qty: z.string(),
  unit_price: z.number(),
  total_price: z.number(),
});

export const MealSchema = z.object({
  day: z.string(),
  name: z.string(),
  tags: z.array(z.string()).default([]),
});

export const MealPlanSchema = z.object({
  summary: z.string(),
  estimated_total: z.number(),
  meals: z.array(MealSchema),
  shopping_list: z.record(z.string(), z.array(ShoppingItemSchema)),
});

export const PlannerFormSchema = z.object({
  budget: z.number().min(10).max(10000),
  persons: z.number().min(1).max(20),
  mealType: z.enum(["dinner", "lunch-dinner", "all"]),
  period: z.enum(["1 week", "2 weeks", "1 month"]),
  drive: z.enum(["leclerc", "carrefour", "intermarche", "auchan", "cora", "monoprix"]),
  preferences: z.array(z.string()),
  exclusions: z.array(z.string()),
  cuisineStyle: z.string(),
});
