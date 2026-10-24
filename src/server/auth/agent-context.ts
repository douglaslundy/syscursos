import { AsyncLocalStorage } from "node:async_hooks";

// Aluno em nome de quem o agente (MCP) opera. Só o handler autenticado de /api/mcp chama runAsAgentStudent.
const store = new AsyncLocalStorage<string>();

export const runAsAgentStudent = <T>(studentId: string, run: () => Promise<T>) => store.run(studentId, run);
export const getAgentStudentId = () => store.getStore() ?? null;
