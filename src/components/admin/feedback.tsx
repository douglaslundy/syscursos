const messages: Record<string, string> = {
  saved: "Registro salvo com sucesso.",
  deleted: "Registro removido com sucesso.",
  renewed: "Matricula renovada com sucesso.",
  canceled: "Matricula cancelada com sucesso.",
};

type FeedbackProps = {
  status?: string;
};

export function Feedback({ status }: FeedbackProps) {
  if (!status || !messages[status]) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      {messages[status]}
    </div>
  );
}
