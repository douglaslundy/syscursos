const messages: Record<string, string> = {
  saved: "Registro salvo com sucesso.",
  deleted: "Registro removido com sucesso.",
  renewed: "Matricula renovada com sucesso.",
  canceled: "Matricula cancelada com sucesso.",
  linked_existing: "Aluno ja possuia cadastro na plataforma e foi vinculado a sua lista.",
  invalid: "Algum campo obrigatorio esta ausente ou fora do formato esperado.",
  student_invalid_id: "Nao foi possivel identificar o aluno em edicao. Abra o cadastro pelo botao Editar e tente novamente.",
  student_invalid_name: "Informe o nome do aluno com pelo menos 2 caracteres e no maximo 160.",
  student_invalid_email: "Informe um e-mail valido para o aluno.",
  student_missing_password: "Informe uma senha inicial com pelo menos 8 caracteres para criar o aluno.",
  student_invalid_password: "A nova senha do aluno deve ter pelo menos 8 caracteres. Para manter a senha atual, deixe o campo em branco.",
  student_invalid_document: "O documento do aluno deve ter no maximo 32 caracteres.",
  student_invalid_phone: "O telefone do aluno deve ter no maximo 32 caracteres.",
  student_invalid_status: "Selecione um status valido para o aluno.",
  conflict: "Ja existe um registro com estes dados.",
  auth_error: "Nao foi possivel configurar o acesso do usuario. Verifique as variaveis do Supabase.",
  storage_error: "Nao foi possivel enviar a capa. Verifique o bucket/permissoes de storage no Supabase.",
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
  const isError = !["saved", "deleted", "renewed", "canceled", "linked_existing"].includes(status);

  return isError
    ? "mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
    : "mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-100";
}
