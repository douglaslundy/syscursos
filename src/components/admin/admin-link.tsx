import type { ComponentProps } from "react";
import NextLink from "next/link";

type AdminLinkProps = ComponentProps<typeof NextLink>;

export function AdminLink({ prefetch = false, ...props }: AdminLinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
