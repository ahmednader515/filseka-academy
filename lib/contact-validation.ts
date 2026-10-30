import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30).refine((value) => !value || /^[+\d\s().-]{7,30}$/.test(value)),
  interest: z.string().trim().min(1).max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(200).optional(),
});
