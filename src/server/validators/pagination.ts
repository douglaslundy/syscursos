import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  query: z.string().trim().max(120).optional().default(""),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function getPagination(searchParams?: Record<string, string | string[] | undefined>) {
  return paginationSchema.parse({
    page: first(searchParams?.page),
    pageSize: first(searchParams?.pageSize),
    query: first(searchParams?.query),
  });
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
