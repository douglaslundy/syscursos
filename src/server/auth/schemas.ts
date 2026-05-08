import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome valido.").max(160),
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  document: z.string().trim().max(32).optional().transform((value) => (value ? value : null)),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
