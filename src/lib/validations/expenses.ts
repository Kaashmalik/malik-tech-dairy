// Expense Validation Schemas
import { z } from "zod";
import { idSchema } from "./common";

export const expenseCategorySchema = z.enum([
  "feed",
  "medicine",
  "labor",
  "equipment",
  "utilities",
  "other",
]);

export const createExpenseSchema = z.object({
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]),
  category: expenseCategorySchema,
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0").max(10000000, "Amount exceeds maximum"),
  currency: z.enum(["PKR"]).default("PKR").optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const getExpenseSchema = z.object({
  id: idSchema,
});

export const listExpensesSchema = z.object({
  category: expenseCategorySchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});

