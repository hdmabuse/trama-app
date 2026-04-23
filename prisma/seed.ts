import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const pw = await hash("trama2026", 12);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "pesquisador@trama.app.br" },
    update: { isAdmin: true, plan: "PRO" },
    create: { name: "Pesquisador", email: "pesquisador@trama.app.br", passwordHash: pw, isAdmin: true, plan: "PRO", isActive: true },
  });

  // Free user
  const free = await prisma.user.upsert({
    where: { email: "teste@trama.app.br" },
    update: {},
    create: { name: "Teste Free", email: "teste@trama.app.br", passwordHash: pw, plan: "FREE", isActive: true },
  });

  // Project
  const project = await prisma.project.upsert({
    where: { id: "seed-projeto-01" },
    update: {},
    create: { id: "seed-projeto-01", name: "Redesign App Mobile", description: "Entrevistas de profundidade com 8 usuários sobre a experiência de uso do aplicativo atual.", color: "#6366f1", ownerId: admin.id },
  });

  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: admin.id, projectId: project.id } },
    update: {},
    create: { userId: admin.id, projectId: project.id, role: "OWNER" },
  });

  // Documents
  const doc1 = await prisma.document.upsert({
    where: { id: "seed-doc-01" }, update: {},
    create: { id: "seed-doc-01", title: "Transcrição P01 — Maria", projectId: project.id, type: "TXT", wordCount: 210,
      content: `Entrevistador: Pode me contar como foi sua experiência com o aplicativo na última semana?\n\nParticipante: Olha, no geral eu gosto bastante do app. Uso todos os dias pra acompanhar minhas tarefas. Mas tem uma coisa que me incomoda muito: quando eu abro muitas abas ao mesmo tempo, o aplicativo fica extremamente lento, quase travando. Isso acontece principalmente no período da manhã, quando eu preciso ver tudo rápido.\n\nEntrevistador: E como você lida com essa situação?\n\nParticipante: Às vezes eu fecho tudo e abro de novo. Funciona, mas é frustrante ter que fazer isso toda vez. Seria muito bom se tivesse um modo de visualização mais leve, tipo um modo compacto. Uma coisa que eu realmente gosto é a organização por cores — isso me ajuda demais a priorizar. Inclusive eu não sabia que dava pra personalizar as cores até uma colega me mostrar.\n\nEntrevistador: Que outras funcionalidades você gostaria de ver?\n\nParticipante: Eu preciso muito de uma forma de exportar relatórios para PDF. Hoje eu copio e colo tudo num Google Docs e a formatação fica horrível. Também acho que o app deveria ter modo escuro. Trabalho muito à noite e a tela branca cansa.` },
  });

  await prisma.document.upsert({
    where: { id: "seed-doc-02" }, update: {},
    create: { id: "seed-doc-02", title: "Transcrição P02 — João", projectId: project.id, type: "TXT", wordCount: 180,
      content: `Entrevistador: Como você descreveria sua relação com o aplicativo?\n\nParticipante: É uma ferramenta essencial pro meu trabalho. Uso desde que lançou. O que mais gosto é a velocidade de criar tarefas novas, é bem direto ao ponto. Mas quando preciso buscar algo antigo, a busca não funciona bem. Já perdi tempo procurando uma tarefa que eu sabia que existia.\n\nEntrevistador: O que você mudaria se pudesse?\n\nParticipante: Primeiro, a busca. Precisa melhorar muito. Segundo, eu gostaria de poder compartilhar uma visão filtrada com meu gestor sem dar acesso a tudo. Tipo um relatório semanal automático. Terceiro, notificações — às vezes eu perco prazos porque o app não me avisa.\n\nEntrevistador: E em relação à interface visual?\n\nParticipante: A interface é limpa, gosto disso. Mas os ícones são muito pequenos no celular. Preciso apertar várias vezes pra acertar. E a fonte poderia ser um pouco maior, especialmente no modo lista.` },
  });

  // Codes
  const codes = [
    { id: "seed-code-01", name: "Frustração", color: "#ef4444", desc: "Experiências negativas" },
    { id: "seed-code-02", name: "Satisfação", color: "#10b981", desc: "Aspectos positivos" },
    { id: "seed-code-03", name: "Sugestão", color: "#6366f1", desc: "Propostas de melhoria" },
    { id: "seed-code-04", name: "Dúvida", color: "#f59e0b", desc: "Falta de conhecimento" },
    { id: "seed-code-05", name: "Necessidade", color: "#ec4899", desc: "Funcionalidade inexistente" },
    { id: "seed-code-06", name: "Performance", color: "#ef4444", desc: "Velocidade e responsividade", parentId: "seed-code-01" },
    { id: "seed-code-07", name: "UI/Acessibilidade", color: "#8b5cf6", desc: "Interface e legibilidade" },
  ];

  for (const c of codes) {
    await prisma.code.upsert({ where: { id: c.id }, update: {},
      create: { id: c.id, name: c.name, color: c.color, description: c.desc, projectId: project.id, parentId: (c as any).parentId || null } });
  }

  // Codings
  const codings = [
    { id: "seed-coding-01", docId: "seed-doc-01", codeId: "seed-code-01", start: 230, end: 362, text: "quando eu abro muitas abas ao mesmo tempo, o aplicativo fica extremamente lento, quase travando." },
    { id: "seed-coding-02", docId: "seed-doc-01", codeId: "seed-code-03", start: 567, end: 662, text: "Seria muito bom se tivesse um modo de visualização mais leve, tipo um modo compacto." },
    { id: "seed-coding-03", docId: "seed-doc-01", codeId: "seed-code-02", start: 663, end: 751, text: "Uma coisa que eu realmente gosto é a organização por cores — isso me ajuda demais a priorizar." },
    { id: "seed-coding-04", docId: "seed-doc-01", codeId: "seed-code-05", start: 860, end: 928, text: "Eu preciso muito de uma forma de exportar relatórios para PDF." },
    { id: "seed-coding-05", docId: "seed-doc-02", codeId: "seed-code-01", start: 310, end: 418, text: "quando preciso buscar algo antigo, a busca não funciona bem. Já perdi tempo procurando uma tarefa" },
    { id: "seed-coding-06", docId: "seed-doc-02", codeId: "seed-code-05", start: 467, end: 485, text: "Primeiro, a busca." },
    { id: "seed-coding-07", docId: "seed-doc-02", codeId: "seed-code-07", start: 769, end: 858, text: "os ícones são muito pequenos no celular. Preciso apertar várias vezes pra acertar." },
  ];

  for (const c of codings) {
    await prisma.coding.upsert({ where: { id: c.id }, update: {},
      create: { id: c.id, documentId: c.docId, codeId: c.codeId, authorId: admin.id, startOffset: c.start, endOffset: c.end, selectedText: c.text } });
  }

  // Themes
  const themes = [
    { id: "seed-theme-01", name: "Barreiras de uso", color: "#ef4444", desc: "Obstáculos que impedem ou dificultam o uso fluido", order: 0, codeIds: ["seed-code-01", "seed-code-06", "seed-code-07"] },
    { id: "seed-theme-02", name: "Oportunidades de produto", color: "#6366f1", desc: "Funcionalidades inexistentes ou melhorias demandadas", order: 1, codeIds: ["seed-code-03", "seed-code-05"] },
    { id: "seed-theme-03", name: "Pontos fortes percebidos", color: "#10b981", desc: "Aspectos que geram satisfação e retenção", order: 2, codeIds: ["seed-code-02"] },
  ];

  for (const t of themes) {
    await prisma.theme.upsert({ where: { id: t.id }, update: {},
      create: { id: t.id, name: t.name, color: t.color, description: t.desc, sortOrder: t.order, projectId: project.id } });
    for (const codeId of t.codeIds) {
      await prisma.themeCode.upsert({ where: { themeId_codeId: { themeId: t.id, codeId } }, update: {}, create: { themeId: t.id, codeId } });
    }
  }

  // Sample invite
  await prisma.adminInvite.upsert({
    where: { id: "seed-invite-01" }, update: {},
    create: { id: "seed-invite-01", email: "colega@exemplo.com", plan: "FREE", message: "Venha testar o TRAMA!",
      invitedById: admin.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  console.log("Seed concluído com sucesso.");
  console.log("─────────────────────────────────");
  console.log("Admin:  pesquisador@trama.app.br / trama2026 (plano Pro, isAdmin)");
  console.log("Teste:  teste@trama.app.br / trama2026 (plano Free)");
  console.log(`Dados:  1 projeto, 2 docs, ${codes.length} códigos, ${codings.length} codificações, ${themes.length} temas, 1 convite`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
