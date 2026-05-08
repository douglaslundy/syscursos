const messages: Record<string, string> = {
  saved: "Registro salvo com sucesso.",
  deleted: "Registro removido com sucesso.",
  renewed: "Matricula renovada com sucesso.",
  canceled: "Matricula cancelada com sucesso.",
  linked_existing: "Aluno ja possuia cadastro na plataforma e foi vinculado a sua lista.",
  invalid: "Revise os dados informados e tente novamente.",
  conflict: "Ja existe um registro com estes dados.",
  auth_error: "Nao foi possivel configurar o acesso do usuario. Verifique as variaveis do Supabase.",
  error: "Nao foi possivel concluir a operacao. Tente novamente.",
};

type FeedbackProps = {
  status?: string;
};

export function Feedback({ status }: FeedbackProps) {
  if (!status || !messages[status]) {
    return null;
  }

  return (
    <div className={feedbackClassName(status)}>
      {messages[status]}
    </div>
  );
}

function feedbackClassName(status: string) {
  const isError = ["invalid", "conflict", "auth_error", "error"].includes(status);

  return isError
    ? "mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
    : "mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-100";
}
