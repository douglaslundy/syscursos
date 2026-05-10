const messages: Record<string, string> = {
  saved: "Registro salvo com sucesso.",
  deleted: "Registro removido com sucesso.",
  renewed: "Matricula renovada com sucesso.",
  canceled: "Matricula cancelada com sucesso.",
  linked_existing: "Aluno ja possuia cadastro na plataforma e foi vinculado a sua lista.",
  invalid: "Algum campo obrigatorio esta ausente ou fora do formato esperado.",
  student_invalid_id: "Nao foi possivel identificar o aluno em edicao. Abra o cadastro pelo botao Editar e tente novamente.",
  student_invalid_user_id: "O identificador do usuario do aluno esta ausente ou invalido. Abra o cadastro pelo botao Editar e tente novamente.",
  student_invalid_profile_id: "O identificador do perfil do aluno esta ausente ou invalido. Abra o cadastro pelo botao Editar e tente novamente.",
  student_invalid_name: "Informe o nome do aluno com pelo menos 2 caracteres e no maximo 160.",
  student_invalid_email: "Informe um e-mail valido para o aluno.",
  student_missing_password: "Informe uma senha inicial com pelo menos 8 caracteres para criar o aluno.",
  student_invalid_password: "A nova senha do aluno deve ter pelo menos 8 caracteres. Para manter a senha atual, deixe o campo em branco.",
  student_invalid_document: "O documento do aluno deve ter no maximo 32 caracteres.",
  student_invalid_phone: "O telefone do aluno deve ter no maximo 32 caracteres.",
  student_invalid_status: "Selecione um status valido para o aluno.",
  student_invalid_form: "Revise os campos do aluno: algum valor enviado nao corresponde aos campos esperados pelo cadastro.",
  student_not_found: "Este aluno nao foi encontrado para o produtor atual. Abra o cadastro pela listagem de alunos e tente novamente.",
  student_invalid_relation: "Nao foi possivel relacionar este aluno ao produtor atual. Reabra o cadastro pela listagem e tente novamente.",
  student_email_conflict: "Ja existe um usuario cadastrado com este e-mail.",
  student_document_conflict: "Ja existe um aluno cadastrado com este documento.",
  student_auth_conflict: "O acesso Auth deste aluno ja esta vinculado a outro usuario.",
  student_conflict: "Ja existe um aluno com estes dados.",
  student_auth_email: "Nao foi possivel atualizar o e-mail de acesso no Supabase Auth. Verifique se o e-mail ja existe ou esta em formato aceito.",
  student_auth_password: "Nao foi possivel atualizar a senha no Supabase Auth. Informe uma senha mais forte ou deixe o campo em branco para manter a senha atual.",
  student_auth_error: "Nao foi possivel atualizar o acesso do aluno no Supabase Auth. Verifique as credenciais e tente novamente.",
  student_producer_required: "Somente produtores podem cadastrar ou editar alunos nesta area.",
  student_save_error: "Nao foi possivel salvar o aluno. Nenhum campo foi alterado; tente novamente e verifique os dados informados.",
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
