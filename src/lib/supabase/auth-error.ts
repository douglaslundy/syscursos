type SupabaseAuthErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
};

const unauthenticatedCodes = new Set([
  "bad_jwt",
  "refresh_token_already_used",
  "refresh_token_not_found",
  "session_not_found",
]);

export function isUnauthenticatedAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as SupabaseAuthErrorLike;
  const name = typeof candidate.name === "string" ? candidate.name.toLowerCase() : "";
  const code = typeof candidate.code === "string" ? candidate.code.toLowerCase() : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  if (name === "authsessionmissingerror" || unauthenticatedCodes.has(code)) {
    return true;
  }

  return (
    message.includes("auth session missing") ||
    message.includes("invalid jwt") ||
    message.includes("jwt expired") ||
    message.includes("refresh token not found") ||
    message.includes("refresh token already used")
  );
}
