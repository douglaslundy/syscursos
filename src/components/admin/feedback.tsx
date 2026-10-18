const messages: Record<string, string> = {
  saved: "Registro salvo com sucesso.",
  deleted: "Registro removido com sucesso.",
  renewed: "Matricula renovada com sucesso.",
  canceled: "Matricula cancelada com sucesso.",
  approved: "Solicitacao aprovada e matricula liberada.",
  rejected: "Solicitacao recusada.",
  durations_scanned: "Duracoes lidas. Aulas sem valor (PDF, OneDrive ou arquivo nao compartilhado) usam estimativa no planejador.",
  durations_partial: "Parte das duracoes foi lida. Clique em Ler duracoes de novo para continuar.",
  study_prefs_saved: "Preferencias de estudo salvas.",
  study_prefs_invalid: "Escolha ao menos um dia da semana e um horario final maior que o inicial.",
  gkey_saved: "Chave salva. Use Testar para confirmar que funciona.",
  gkey_removed: "Chave removida.",
  gkey_invalid_format: "A chave parece invalida (20 a 200 caracteres, sem espacos).",
  gkey_test_ok: "Funcionou: a chave leu os dados de um arquivo do Drive.",
  gkey_test_empty: "Nenhuma chave para testar. Cole uma chave ou salve antes.",
  gkey_test_invalid: "Chave invalida. Confira se foi copiada por inteiro.",
  gkey_test_disabled: "A chave existe, mas a Drive API nao esta ativada no projeto do Google Cloud.",
  gkey_test_unshared: "A chave foi aceita, mas o arquivo de teste nao esta compartilhado por link (ou a chave tem restricoes).",
  gkey_test_no_sample: "Nao ha aula do Google Drive cadastrada para usar no teste.",
  gkey_test_youtube_disabled: "Drive OK, mas a YouTube Data API v3 nao esta ativada no projeto. Ative-a para ler a duracao das aulas do YouTube.",
  gkey_test_network: "Nao foi possivel falar com o Google. Tente novamente.",
  transcription_saved: "Metodo de transcricao salvo.",
  transcription_need_key: "Para usar o Gemini, salve antes a chave do Gemini.",
  gemini_saved: "Chave do Gemini salva. Use Testar para confirmar que funciona.",
  gemini_removed: "Chave do Gemini removida. O metodo voltou para o navegador do aluno.",
  gemini_invalid_format: "A chave parece invalida (20 a 200 caracteres, sem espacos).",
  gemini_test_ok: "Funcionou: o Gemini respondeu com essa chave.",
  gemini_test_empty: "Nenhuma chave para testar. Cole uma chave ou salve antes.",
  gemini_test_invalid: "Chave invalida ou sem permissao. Confira se foi copiada por inteiro.",
  gemini_test_quota: "A chave e valida, mas o limite de uso do Gemini foi atingido. Tente mais tarde.",
  gemini_test_network: "Nao foi possivel falar com o Gemini. Tente novamente.",
  durations_no_key: "Aulas do Google Drive exigem a Google API Key. Cadastre em Configuracoes (login de administrador). Nenhuma duracao foi lida.",
  linked_existing: "Aluno ja possuia cadastro na plataforma e foi vinculado com sucesso a sua lista.",
  student_lookup_found: "Aluno encontrado na plataforma. Os dados foram carregados e o proximo passo e somente vincular.",
  student_lookup_not_found: "Aluno nao encontrado na plataforma. Preencha os campos para realizar um novo cadastro.",
  invalid: "Algum campo obrigatorio esta ausente ou fora do formato esperado.",
  student_invalid_id: "Nao foi possivel identificar o aluno em edicao. Abra o cadastro pelo botao Editar e tente novamente.",
  student_invalid_user_id: "O identificador do usuario do aluno esta ausente ou invalido. Abra o cadastro pelo botao Editar e tente novamente.",
  student_invalid_profile_id: "O identificador do perfil do aluno esta ausente ou invalido. Abra o cadastro pelo botao Editar e tente novamente.",
  student_invalid_name: "Informe o nome do aluno com pelo menos 2 caracteres e no maximo 160.",
  student_invalid_email: "Informe um e-mail valido para o aluno.",
  student_missing_password: "Senha inicial nao e mais obrigatoria para criar aluno.",
  student_invalid_password: "A nova senha do aluno deve ter pelo menos 8 caracteres. Para manter a senha atual, deixe o campo em branco.",
  student_invalid_document: "O documento do aluno deve ter no maximo 32 caracteres.",
  student_invalid_phone: "O telefone do aluno deve ter no maximo 32 caracteres.",
  student_invalid_status: "Selecione um status valido para o aluno.",
  student_invalid_form: "Revise os campos do aluno: algum valor enviado nao corresponde aos campos esperados pelo cadastro.",
  student_not_found: "Este aluno nao foi encontrado para o produtor atual. Abra o cadastro pela listagem de alunos e tente novamente.",
  student_already_linked: "Este aluno ja esta vinculado a este produtor.",
  student_invalid_relation: "Nao foi possivel relacionar este aluno ao produtor atual. Reabra o cadastro pela listagem e tente novamente.",
  student_email_conflict: "Ja existe um usuario cadastrado com este e-mail.",
  student_document_conflict: "Ja existe um aluno cadastrado com este documento.",
  student_auth_conflict: "O acesso Auth deste aluno ja esta vinculado a outro usuario.",
  student_conflict: "Ja existe um aluno com estes dados.",
  student_auth_email: "Nao foi possivel atualizar o e-mail de acesso no Supabase Auth. Verifique se o e-mail ja existe ou esta em formato aceito.",
  student_auth_password: "Nao foi possivel atualizar a senha no Supabase Auth. Informe uma senha mais forte ou deixe o campo em branco para manter a senha atual.",
  student_auth_error: "Nao foi possivel atualizar o acesso do aluno no Supabase Auth. Verifique as credenciais e tente novamente.",
  supabase_admin_config: "A integracao administrativa com o Supabase nao esta configurada corretamente no servidor. Atualize a chave service_role do ambiente e tente novamente.",
  student_producer_required: "Somente produtores podem cadastrar ou editar alunos nesta area.",
  student_save_error: "Nao foi possivel salvar o aluno. Nenhum campo foi alterado; tente novamente e verifique os dados informados.",
  lesson_invalid: "Nao foi possivel salvar a aula. Verifique os campos obrigatorios, a posicao e o modulo selecionado.",
  lesson_conflict: "Ja existe outra aula com esta posicao no modulo atual.",
  lesson_auth_error: "Nao foi possivel configurar o acesso da aula no Supabase Auth. Tente novamente.",
  lesson_storage_error: "Nao foi possivel enviar a capa da aula. Verifique o bucket/permissoes de storage no Supabase.",
  lesson_save_error: "Nao foi possivel salvar a aula. Verifique os dados informados e tente novamente.",
  conflict: "Ja existe um registro com estes dados.",
  auth_error: "Nao foi possivel configurar o acesso do usuario. Verifique as variaveis do Supabase.",
  storage_error: "Nao foi possivel enviar a capa. Verifique o bucket/permissoes de storage no Supabase.",
  cover_too_large: "A imagem da capa e maior que o limite permitido (5 MB). Reduza o tamanho e tente novamente.",
  cover_invalid_type: "Formato de imagem nao suportado. Use JPEG, PNG, WEBP, GIF ou AVIF.",
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
  const isError = !["saved", "deleted", "renewed", "canceled", "linked_existing", "durations_scanned", "durations_partial", "study_prefs_saved", "gkey_saved", "gkey_removed", "gkey_test_ok", "transcription_saved", "gemini_saved", "gemini_removed", "gemini_test_ok"].includes(status);

  return isError
    ? "mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
    : "mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-100";
}
