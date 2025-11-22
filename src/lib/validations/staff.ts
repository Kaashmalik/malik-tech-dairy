// Staff Validation Schemas
import { z } from "zod";
import { idSchema } from "./common";
import { TenantRole } from "@/types/roles";

export const staffStatusSchema = z.enum(["active", "inactive"]);

export const createStaffSchema = z.object({
  userId: idSchema,
  role: z.nativeEnum(TenantRole),
  salary: z.coerce.number().min(0, "Salary must be positive").optional(),
  joinDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]).optional(),
  status: staffStatusSchema.default("active").optional(),
});

export const updateStaffSchema = createStaffSchema.partial().extend({
  userId: idSchema.optional(),
});

export const getStaffSchema = z.object({
  id: idSchema,
});

export const listStaffSchema = z.object({
  role: z.nativeEnum(TenantRole).optional(),
  status: staffStatusSchema.optional(),
});

