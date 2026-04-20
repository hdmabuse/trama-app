import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("trama2026", 12);

  const user = await prisma.user.upsert({
    where: { email: "pesquisador@trama.app.br" },
    update: {},
    create: {
      name: "Pesquisador",
      email: "pesquisador@trama.app.br",
      passwordHash,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-projeto-01" },
    update: {},
    create: {
      id: "seed-projeto-01",
      name: "Redesign App Mobile",
      description: "Entrevistas de profundidade com 8 usuários sobre a experiência de uso do aplicativo atual.",
      color: "#6366f1",
      ownerId: user.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: user.id, projectId: project.id } },
    update: {},
    create: { userId: user.id, projectId: project.id, role: "OWNER" },
  });

  const doc = await prisma.document.upsert({
    where: { id: "seed-doc-01" },
    update: {},
    create: {
      id: "seed-doc-01",
      title: "Transcrição P01 — Maria",
      projectId: project.id,
      type: "TXT",
      wordCount: 342,
      content: `Entrevistador: Pode me contar como foi sua experiência com o aplicativo na última semana?

Participante: Olha, no geral eu gosto bastante do app. Uso todos os dias pra acompanhar minhas tarefas. Mas tem uma coisa que me incomoda muito: quando eu abro muitas abas ao mesmo tempo, o aplicativo fica extremamente lento, quase travando. Isso acontece principalmente no período da manhã, quando eu preciso ver tudo rápido.

Entrevistador: E como você lida com essa situação?

Participante: Às vezes eu fecho tudo e abro de novo. Funciona, mas é frustrante ter que fazer isso toda vez. Seria muito bom se tivesse um modo de visualização mais leve, tipo um modo compacto. Uma coisa que eu realmente gosto é a organização por cores — isso me ajuda demais a priorizar. Inclusive eu não sabia que dava pra personalizar as cores até uma colega me mostrar.

Entrevistador: Que outras funcionalidades você gostaria de ver?

Participante: Eu preciso muito de uma forma de exportar relatórios para PDF. Hoje eu copio e colo tudo num Google Docs e a formatação fica horrível. Também acho que o app deveria ter modo escuro. Trabalho muito à noite e a tela branca cansa.`,
    },
  });

  const codes = [
    { id: "seed-code-01", name: "Frustração",  color: "#ef4444" },
    { id: "seed-code-02", name: "Satisfação",  color: "#10b981" },
    { id: "seed-code-03", name: "Sugestão",    color: "#6366f1" },
    { id: "seed-code-04", name: "Dúvida",      color: "#f59e0b" },
    { id: "seed-code-05", name: "Necessidade", color: "#ec4899" },
  ];

  for (const c of codes) {
    await prisma.code.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, projectId: project.id },
    });
  }

  await prisma.coding.upsert({
    where: { id: "seed-coding-01" },
    update: {},
    create: {
      id: "seed-coding-01",
      documentId: doc.id,
      codeId: "seed-code-01",
      authorId: user.id,
      startOffset: 230,
      endOffset: 362,
      selectedText: "quando eu abro muitas abas ao mesmo tempo, o aplicativo fica extremamente lento, quase travando.",
    },
  });

  console.log("Seed concluído com sucesso.");
  console.log("Login: pesquisador@trama.app.br / trama2026");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
