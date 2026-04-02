import { z } from "zod";

export const ShoppingItemSchema = z.object({
  name: z.string(),
  qty: z.string(),
  unit_price: z.number(),
  total_price: z.number(),
  link: z.string().optional(),
});

export const MealSchema = z.object({
  day: z.string(),
  name: z.string().optional(),
  breakfast: z.string().optional(),
  breakfast_ingredients: z.array(z.string()).optional(),
  lunch: z.string().optional(),
  lunch_ingredients: z.array(z.string()).optional(),
  dinner: z.string().optional(),
  dinner_ingredients: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
});

export const ShoppingCategorySchema = z.object({
  category: z.string(),
  items: z.array(ShoppingItemSchema),
});

export const MealPlanSchema = z.object({
  summary: z.string(),
  estimated_total: z.number(),
  meals: z.array(MealSchema),
  shopping_list: z.array(ShoppingCategorySchema),
  research_audit: z.array(z.string()).default([]),
});

export const PlannerFormSchema = z.object({
  budget: z.number().min(10).max(10000),
  persons: z.number().min(1).max(20),
  mealType: z.enum(["dinner", "lunch-dinner", "all"]),
  period: z.enum(["1 week", "2 weeks", "3 weeks", "1 month"]),
  drive: z.enum(["leclerc", "carrefour", "intermarche", "auchan", "cora", "monoprix"]),
  zipCode: z.string().optional().refine(val => !val || val === "" || (val.length === 5 && /^\d+$/.test(val)), {
    message: "Doit être 5 chiffres",
  }),
  selectedStore: z.string().optional(),
  selectedStoreUrl: z.string().optional(),
  preferences: z.array(z.string()),
  exclusions: z.array(z.string()),
  cuisineStyle: z.string(),
});
