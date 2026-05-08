import Link from "next/link";

export default function ConstituicaoPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="h-14 bg-white border-b border-stone-200 flex items-center px-5">
        <Link href="/" className="text-xl font-black text-trama-500 tracking-tight">trama</Link>
        <div className="flex-1" />
        <Link href="/login" className="text-sm text-stone-500 hover:text-stone-700 mr-4">Entrar</Link>
        <Link href="/cadastro" className="text-sm text-trama-500 font-medium">Criar conta</Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Constituição ética</h1>
        <p className="text-sm text-stone-400 mb-12">Os princípios que governam o desenvolvimento, a operação e a evolução do TRAMA.</p>

        <p className="text-stone-600 leading-relaxed mb-12">
          O TRAMA é uma ferramenta de análise qualitativa que lida com dados de pessoas reais: transcrições de entrevistas, relatos de experiências, narrativas de vida. Esses dados carregam a confiança que participantes depositaram em pesquisadores. Esta constituição estabelece os compromissos éticos vinculantes para todas as decisões de produto, arquitetura e design.
        </p>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">1. Toda tecnologia que adotamos é um projeto histórico, não uma ferramenta neutra</h2>
          <p className="text-stone-600 leading-relaxed">
            Um sistema de análise qualitativa carrega embutido em seu funcionamento escolhas sobre quem é usuário, quais comportamentos são normais, quais resultados são desejáveis e quais populações são sujeitos ou objetos do sistema. Essas escolhas não são técnicas: são políticas, são históricas, são culturais. Quando o TRAMA é utilizado em projetos de pesquisa, políticas públicas ou diagnósticos organizacionais, assume-se integralmente a responsabilidade pelas escolhas de valor que o sistema incorpora. A pergunta ética que nos cabe fazer não é se o sistema funciona, mas a serviço de que e de quem ele funciona.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">2. Os dados do Brasil não são o Brasil</h2>
          <p className="text-stone-600 leading-relaxed">
            Os mapas, os conjuntos de dados e os modelos com que trabalhamos foram construídos a partir de pontos de vista particulares. Carregam os silêncios de quem nunca foi perguntado, as ausências de quem nunca foi mapeado, as distorções de quem foi medido com categorias que não reconhece como suas. Quando forem utilizados modelos de IA integrados ao TRAMA, esses modelos sub-representam as regiões Norte e Nordeste, as populações indígenas, as comunidades de terreiro, os saberes dos artesãos, as economias informais, as línguas e as estéticas periféricas. Adotar esses modelos sem filtragem crítica é reproduzir, em código, as mesmas exclusões que a pesquisa qualitativa deveria tornar visíveis. O TRAMA compromete-se a interrogar sistematicamente os pressupostos de cada modelo antes de qualquer integração, e a documentar publicamente as limitações conhecidas dos modelos adotados.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">3. Quem mais perde quando o sistema erra é quem deve validar se ele funciona</h2>
          <p className="text-stone-600 leading-relaxed">
            O conhecimento produzido pelas comunidades que habitam os territórios afetados por uma pesquisa não é anedota a ser verificada pela ciência. É fonte epistêmica primária. Quem organiza a própria vida com menos margem de erro, quem navega as instituições com menos recursos, quem acumula a experiência de ser sistematicamente mal atendido: esse conjunto de pessoas tem acesso a dimensões da realidade que nenhum conjunto de dados captura sozinho. Quando forem utilizados modelos de IA no TRAMA, a métrica de admissibilidade para qualquer modelo é o desempenho sobre os grupos mais expostos a danos, definidos pela articulação de raça, gênero, classe e território. Essa métrica vem antes de qualquer indicador de eficiência.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">4. A soberania sobre a análise não pode ser terceirizada a nenhum algoritmo</h2>
          <p className="text-stone-600 leading-relaxed">
            Um sistema de análise que não pode ser questionado, corrigido ou suspenso por quem é responsável pela pesquisa não é um sistema de apoio à interpretação. É um sistema de transferência de poder para quem o desenvolveu. O TRAMA não adotará nem recomendará modelos opacos em contextos de pesquisa qualitativa. Quando forem utilizados modelos de IA, toda funcionalidade que os envolva deve ser compreensível pelo pesquisador que a opera, contestável pelas pessoas que ela afeta e suspendível imediatamente quando os resultados não satisfaçam os critérios de equidade. O pesquisador que precisa de uma equipe de engenheiros para entender por que o sistema produziu aquela sugestão sobre aquele trecho já perdeu a capacidade de ser responsável por sua análise. Por isso o TRAMA opera, por padrão, sem IA: todos os processos analíticos são conduzidos manualmente pelo pesquisador, que mantém controle total sobre a interpretação dos dados.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">5. O processo tem tanto peso quanto o resultado</h2>
          <p className="text-stone-600 leading-relaxed">
            Não existe auditoria de equidade que seja realizada uma única vez. Não existe certificação que substitua a revisão contínua. Os participantes que são fontes da pesquisa também precisam ter voz sobre como seus dados são tratados, com poder real de intervenção sobre os sistemas, incluindo sua suspensão. O TRAMA compromete-se a manter ciclos regulares de revisão participativa em todas as funcionalidades que envolvam processamento automatizado de dados. E compromete-se a documentar publicamente tanto os acertos quanto as falhas, porque o aprendizado que não é compartilhado não serve ao território.
          </p>
        </section>

        <section className="border-t border-stone-200 pt-10">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Como estes princípios se materializam no TRAMA</h2>
          <ul className="space-y-3 text-stone-600 text-sm leading-relaxed">
            <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-trama-500 mt-2 shrink-0" /><span><strong className="text-stone-800">Zero IA por padrão.</strong> O pesquisador codifica, categoriza e interpreta manualmente. Nenhum algoritmo interfere na análise sem ação explícita.</span></li>
            <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-trama-500 mt-2 shrink-0" /><span><strong className="text-stone-800">Criptografia de ponta-a-ponta.</strong> Os dados dos participantes são cifrados no navegador do pesquisador. Nem os administradores do servidor podem lê-los.</span></li>
            <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-trama-500 mt-2 shrink-0" /><span><strong className="text-stone-800">Código aberto (AGPL-3.0).</strong> Qualquer pesquisador, instituição ou comunidade pode inspecionar, auditar e modificar o sistema.</span></li>
            <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-trama-500 mt-2 shrink-0" /><span><strong className="text-stone-800">Exportação irrestrita.</strong> O pesquisador pode exportar todos os seus dados a qualquer momento em formatos abertos.</span></li>
            <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-trama-500 mt-2 shrink-0" /><span><strong className="text-stone-800">Compliance LGPD.</strong> Exportação e exclusão completa de dados pessoais sob demanda.</span></li>
            <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-trama-500 mt-2 shrink-0" /><span><strong className="text-stone-800">Transparência algorítmica.</strong> Quando forem utilizados modelos de IA, cada sugestão exibirá indicador de confiança, e nenhuma será aplicada automaticamente.</span></li>
          </ul>
        </section>

        <footer className="mt-16 pt-8 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-400">trama.app.br · AGPL-3.0-or-later</p>
        </footer>
      </main>
    </div>
  );
}
