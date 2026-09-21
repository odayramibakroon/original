import { z } from "zod";

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "currentRequired"),
  newPassword: z.string().min(8, "passwordShort").max(128, "passwordLong"),
  confirmPassword: z.string().min(1, "confirmRequired"),
}).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch" })
  .refine((value) => value.newPassword !== value.currentPassword, { path: ["newPassword"], message: "passwordSame" });
export type PasswordInput = z.infer<typeof passwordSchema>;
