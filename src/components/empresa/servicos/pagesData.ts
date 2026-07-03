// Gerado automaticamente a partir de public/playbook-full.html (extração verificada
// byte-a-byte via indexOf no arquivo fonte). Conteúdo sempre visível de cada página
// (hero, cards de preço, timeline, notas) — os cliques em elementos [data-open]/[data-modal]
// dentro deste HTML são capturados por delegação em PlaybookComercial.tsx.

export const PAGE_HTML: Record<'agent' | 'dev' | 'studio', string> = {
  agent: `<div class="topbar"><span class="topbar-title">KORA AGENT — Inteligencia Artificial Comercial</span><span class="badge badge-a">AGENT</span></div>
  <div class="sec">
    <div class="vh">
      <div>
        <div class="vbadge vb-a">KORA AGENT</div>
        <div class="vh-title">Agente que Evolui<br>Como Funcionario</div>
        <div class="vh-tag">Nao e um plano — e uma contratacao. O agente comeca como SDR e vai sendo promovido conforme prova valor.</div>
      </div>
      <div class="qpw">
        <div class="qp" data-modal="agent-chat"><div class="qn">CHAT</div><div class="qv" style="color:var(--agent)">R$97</div><div class="qs">/user/mes</div></div>
        <div class="qp" data-modal="agent-base"><div class="qn">BASE</div><div class="qv" style="color:var(--agent)">R$1.470</div><div class="qs">setup</div></div>
        <div class="qp" data-modal="agent-plus"><div class="qn">PLUS &#9733;</div><div class="qv" style="color:var(--purple)">R$3.470</div><div class="qs">setup</div></div>
        <div class="qp" data-modal="agent-pro"><div class="qn">PRO &#9733;</div><div class="qv" style="color:var(--gold)">R$6.470</div><div class="qs">setup</div></div>
      </div>
    </div>
    <div class="nota nota-green"><span class="nota-i">&#127873;</span><span><strong style="color:var(--text)">1 Mes Gratis:</strong> Ao fechar PLUS ou PRO, o primeiro mes de recorrencia e gratuito. Use como argumento de fechamento — nunca entregue antes de ser pedido.</span></div>
    <div class="hr"><div class="hr-line"></div><div class="hr-lbl">Jornada do Agente</div><div class="hr-line"></div></div>
    <div class="evo">
      <div class="es" style="opacity:.6"><div class="es-lbl">Pre-entrada</div><div class="es-name" style="color:var(--agent)">Kora Chat</div><div class="es-price">R$97/user</div></div>
      <div class="es"><div class="es-lbl">Base com IA</div><div class="es-name" style="color:var(--agent)">SDR</div><div class="es-price">incluso BASE+</div></div>
      <div class="es"><div class="es-lbl">Promocao 1</div><div class="es-name">Vendas Ativa</div><div class="es-price">+R$777/+R$147</div></div>
      <div class="es"><div class="es-lbl">Promocao 2</div><div class="es-name">Follow-up</div><div class="es-price">+R$600/+R$100</div></div>
      <div class="es"><div class="es-lbl">Promocao 3</div><div class="es-name">Recuperacao</div><div class="es-price">+R$700/+R$120</div></div>
    </div>
    <div class="ttl" style="margin-bottom:6px;">Planos — Clique para abrir o playbook completo</div>
    <div class="desc">Scripts, precos, ancoragem, piso, fluxo de call e objecoes dentro de cada card.</div>
    <div class="entry-card" data-open="agent-chat">
      <div><div class="ec-badge">ENTRY POINT — SEM IA</div><div class="ec-name">KORA CHAT</div><div class="ec-desc">WhatsApp centralizado no Chatwoot. Atendentes 100% humanos. Porta de entrada para o ecossistema — quando quiser IA, e so ativar.</div></div>
      <div class="ec-r">
        <div class="ec-pb"><div class="ec-plbl">Setup</div><div class="ec-pval" style="color:var(--text2);font-size:18px">R$0</div><div class="ec-psub">sem implantacao</div></div>
        <div class="ec-div"></div>
        <div class="ec-pb"><div class="ec-plbl">Recorrencia</div><div class="ec-pval">R$97</div><div class="ec-psub">/usuario/mes</div><div class="ec-psub">min. 3 = R$297/mes</div></div>
      </div>
    </div>
    <div class="uparrow">Kora Chat &nbsp;&#8594;&nbsp; adicione IA a qualquer momento e sobe para BASE</div>
    <div class="plans-grid">
      <div class="pc" data-open="agent-base">
        <div class="pc-glow" style="background:var(--agent)"></div>
        <div class="pc-head"><div class="pc-tier t-a">KORA AGENT</div><div class="pc-name">BASE</div><div class="pc-tag">Agente puro · backend invisivel</div></div>
        <div class="pc-price"><div class="pc-plbl">Setup</div><div class="pc-pval">R$1.470</div><div class="pc-plbl" style="margin-top:9px">Recorrencia</div><div class="pc-pval">R$397<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso: <span>R$970 setup · R$337/mes</span></div></div>
        <div class="pc-feat">
          <div class="fi"><span class="fya">&#10003;</span><span>Agente SDR 24/7 customizado</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>Integracoes WhatsApp + CRM + email</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>4 promocoes de capacidade</span></div>
          <div class="fi"><span class="fn">—</span><span style="color:var(--text3)">Sem interface visual</span></div>
        </div>
        <div class="pc-cta"><button class="pc-btn">Abrir playbook completo &#8594;</button></div>
      </div>
      <div class="pc feat" data-open="agent-plus">
        <div class="pc-glow" style="background:var(--purple)"></div>
        <div class="pc-free">1&#186; MES GRATIS</div>
        <div class="pc-head"><div class="pc-tier t-a">KORA AGENT</div><div class="pc-name">PLUS</div><div class="pc-tag">Agente + Kora Chat</div></div>
        <div class="pc-price"><div class="pc-plbl">Setup</div><div class="pc-pval" style="color:var(--purple)">R$3.470</div><div class="pc-plbl" style="margin-top:9px">Recorrencia</div><div class="pc-pval" style="color:var(--purple)">R$647<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso: <span>R$2.770 setup · R$577/mes</span></div></div>
        <div class="pc-feat">
          <div class="fi"><span class="fya">&#10003;</span><span>TUDO do BASE</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>Kora Chat (Chatwoot WL)</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>3 licencas operacionais</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>Agente visivel em tempo real</span></div>
        </div>
        <div class="pc-cta"><button class="pc-btn pc-btnf">Abrir playbook completo &#8594;</button></div>
      </div>
      <div class="pc" data-open="agent-pro">
        <div class="pc-glow" style="background:var(--gold)"></div>
        <div class="pc-free">1&#186; MES GRATIS</div>
        <div class="pc-head"><div class="pc-tier t-a">KORA AGENT</div><div class="pc-name">PROFESSIONAL</div><div class="pc-tag">Agente + Chat + Gestao 360</div></div>
        <div class="pc-price"><div class="pc-plbl">Setup</div><div class="pc-pval" style="color:var(--gold)">R$6.470</div><div class="pc-plbl" style="margin-top:9px">Recorrencia</div><div class="pc-pval" style="color:var(--gold)">R$897<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso: <span>R$4.970 setup · R$777/mes</span></div></div>
        <div class="pc-feat">
          <div class="fi"><span class="fya">&#10003;</span><span>TUDO do PLUS</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>Dashboard Gestao 360</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>Comite mensal de insights</span></div>
          <div class="fi"><span class="fya">&#10003;</span><span>Account manager dedicado</span></div>
        </div>
        <div class="pc-cta"><button class="pc-btn">Abrir playbook completo &#8594;</button></div>
      </div>
    </div>
    <div class="garantia"><div class="g-icon">&#128737;&#65039;</div><div><div class="g-title">Garantia de 30 Dias — Sem Risco</div><p class="g-text"><p>Se em 30 dias o agente nao qualificar ou gerar retorno claro, devolvemos 100% do setup. Recorrencia so cobrada enquanto o sistema roda. Use proativamente — nao espere o cliente perguntar.</p></div></div>
  </div>`,
  dev: `<div class="topbar"><span class="topbar-title">KORA DEV — Engenharia Senior Sob Demanda</span><span class="badge badge-d">DEV</span></div>
  <div class="sec">
    <div class="vh">
      <div><div class="vbadge vb-d">KORA DEV</div><div class="vh-title">Engenharia Senior<br>Sem Contratar Senior</div><div class="vh-tag">Retainer de horas ou entregas pontuais. SaaS, LPs de alta conversao ou sustentacao — fracao do custo interno.</div></div>
      <div class="qpw">
        <div class="qp" data-modal="dev-start"><div class="qn">START</div><div class="qv" style="color:var(--dev)">R$1.197</div><div class="qs">/mes</div></div>
        <div class="qp" data-modal="dev-plus"><div class="qn">PLUS</div><div class="qv" style="color:var(--dev)">R$2.470</div><div class="qs">setup</div></div>
        <div class="qp" data-modal="dev-pro"><div class="qn">PRO</div><div class="qv" style="color:var(--gold)">R$15.970+</div><div class="qs">setup</div></div>
      </div>
    </div>
    <div class="nota"><span class="nota-i">&#9889;</span><span><strong style="color:var(--text)">Acionamento avulso: R$347</strong> — Taxa de abertura para qualquer sprint tecnico fora do retainer. Nao negocie isso.</span></div>
    <div class="plans-grid">
      <div class="pc" data-open="dev-start">
        <div class="pc-glow" style="background:var(--dev)"></div>
        <div class="pc-head"><div class="pc-tier t-d">KORA DEV</div><div class="pc-name">START</div><div class="pc-tag">Suporte e Ajustes Rapidos</div></div>
        <div class="pc-price"><div class="pc-plbl">Ancoragem</div><div class="pc-pval">R$1.197<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso (boleto/debito): <span>R$970/mes</span></div></div>
        <div class="pc-feat"><div class="fi"><span class="fy">&#10003;</span><span>10h mensais de engenharia senior</span></div><div class="fi"><span class="fy">&#10003;</span><span>Bugs, manutencao, seguranca</span></div><div class="fi"><span class="fn">—</span><span style="color:var(--text3)">Sem novas features</span></div></div>
        <div class="pc-cta"><button class="pc-btn">Abrir playbook completo &#8594;</button></div>
      </div>
      <div class="pc feat" data-open="dev-plus">
        <div class="pc-glow" style="background:var(--dev)"></div>
        <div class="pc-head"><div class="pc-tier t-d">KORA DEV</div><div class="pc-name">PLUS</div><div class="pc-tag">Tracao Digital e Alta Conversao</div></div>
        <div class="pc-price"><div class="pc-plbl">LP Premium</div><div class="pc-pval" style="color:var(--dev)">R$2.470</div><div class="pc-floor">PIX: <span>R$1.870</span></div><div class="pc-plbl" style="margin-top:8px">Retainer 20h</div><div class="pc-pval" style="color:var(--dev)">R$2.170<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso: <span>R$1.770/mes</span></div></div>
        <div class="pc-feat"><div class="fi"><span class="fy">&#10003;</span><span>LP Premium — UX, Pixel, Speed A</span></div><div class="fi"><span class="fy">&#10003;</span><span>OU 20h evolucao de plataforma</span></div></div>
        <div class="pc-cta"><button class="pc-btn pc-btnf">Abrir playbook completo &#8594;</button></div>
      </div>
      <div class="pc" data-open="dev-pro">
        <div class="pc-glow" style="background:var(--gold)"></div>
        <div class="pc-head"><div class="pc-tier t-d">KORA DEV</div><div class="pc-name">PROFESSIONAL</div><div class="pc-tag">SaaS e Inovacao</div></div>
        <div class="pc-price"><div class="pc-plbl">Setup SaaS</div><div class="pc-pval" style="color:var(--gold)">A partir R$15.970</div><div class="pc-floor">Piso (marcos 40/30/30): <span>R$13.470</span></div><div class="pc-plbl" style="margin-top:8px">Sustentacao</div><div class="pc-pval" style="color:var(--gold)">R$897<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso: <span>R$747/mes</span></div></div>
        <div class="pc-feat"><div class="fi"><span class="fy">&#10003;</span><span>SaaS/App completo do zero</span></div><div class="fi"><span class="fy">&#10003;</span><span>OU Retainer 40h + Consultoria</span></div></div>
        <div class="pc-cta"><button class="pc-btn">Abrir playbook completo &#8594;</button></div>
      </div>
    </div>
  </div>`,
  studio: `<div class="topbar"><span class="topbar-title">KORA STUDIO — Criatividade com IA Cinematica</span><span class="badge badge-s">STUDIO</span></div>
  <div class="sec">
    <div class="vh">
      <div><div class="vbadge vb-s">KORA STUDIO</div><div class="vh-title">Producao de Agencia.<br>Preco Acessivel.</div><div class="vh-tag">Video, foto IA, reels, carroseis, brandbook — qualidade cinematica por preco que agencias tradicionais nao batem.</div></div>
      <div class="qpw">
        <div class="qp" data-modal="studio-start"><div class="qn">START</div><div class="qv" style="color:var(--studio)">R$1.197</div><div class="qs">unico</div></div>
        <div class="qp" data-modal="studio-plus"><div class="qn">PLUS</div><div class="qv" style="color:var(--studio)">R$1.770</div><div class="qs">/mes trim.</div></div>
        <div class="qp" data-modal="studio-pro"><div class="qn">PRO</div><div class="qv" style="color:var(--gold)">R$1.470</div><div class="qs">/mes anual</div></div>
      </div>
    </div>
    <div class="nota nota-red"><span class="nota-i">&#9888;&#65039;</span><span><strong style="color:var(--text)">Clausula anti-refacao:</strong> Max 2 rodadas por ativo. Extra: R$147/render. Mencione no inicio da call — nunca como surpresa.</span></div>
    <div class="plans-grid">
      <div class="pc" data-open="studio-start">
        <div class="pc-glow" style="background:var(--studio)"></div>
        <div class="pc-head"><div class="pc-tier t-s">KORA STUDIO</div><div class="pc-name">START</div><div class="pc-tag">Ativos de Impacto Avulsos</div></div>
        <div class="pc-price"><div class="pc-plbl">Venda Unica</div><div class="pc-pval">R$1.197</div><div class="pc-floor">PIX: <span>R$947</span></div></div>
        <div class="pc-feat"><div class="fi"><span class="fys">&#10003;</span><span>1 Video Premium (ate 45s)</span></div><div class="fi"><span class="fys">&#10003;</span><span>Roteiro + locucao + SFX + IA</span></div><div class="fi"><span class="fys">&#10003;</span><span>OU 25 fotos IA alta resolucao</span></div></div>
        <div class="pc-cta"><button class="pc-btn">Abrir playbook completo &#8594;</button></div>
      </div>
      <div class="pc feat" data-open="studio-plus">
        <div class="pc-glow" style="background:var(--studio)"></div>
        <div class="pc-head"><div class="pc-tier t-s">KORA STUDIO</div><div class="pc-name">PLUS</div><div class="pc-tag">Kora Campaign · Trimestral</div></div>
        <div class="pc-price"><div class="pc-plbl">Ancoragem (trim.)</div><div class="pc-pval" style="color:var(--studio)">R$1.770<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso (multa 30%): <span>R$1.530/mes</span></div></div>
        <div class="pc-feat"><div class="fi"><span class="fys">&#10003;</span><span>1 Filme 30s + 4 Reels/mes</span></div><div class="fi"><span class="fys">&#10003;</span><span>2 Carroseis + assets + copys</span></div><div class="fi"><span class="fys">&#10003;</span><span>Planejamento de campanha</span></div></div>
        <div class="pc-cta"><button class="pc-btn pc-btnf">Abrir playbook completo &#8594;</button></div>
      </div>
      <div class="pc" data-open="studio-pro">
        <div class="pc-glow" style="background:var(--gold)"></div>
        <div class="pc-head"><div class="pc-tier t-s">KORA STUDIO</div><div class="pc-name">PROFESSIONAL</div><div class="pc-tag">Branding e Direcao de Arte</div></div>
        <div class="pc-price"><div class="pc-plbl">Ancoragem (anual)</div><div class="pc-pval" style="color:var(--gold)">R$1.470<span style="font-size:12px;color:var(--text2)">/mes</span></div><div class="pc-floor">Piso secreto (cartao rec.): <span>R$1.230/mes</span></div></div>
        <div class="pc-feat"><div class="fi"><span class="fys">&#10003;</span><span>TUDO do PLUS mensalmente</span></div><div class="fi"><span class="fys">&#10003;</span><span>Brandbook guiado por IA</span></div><div class="fi"><span class="fys">&#10003;</span><span>Comite mensal de tendencias</span></div></div>
        <div class="pc-cta"><button class="pc-btn">Abrir playbook completo &#8594;</button></div>
      </div>
    </div>
  </div>`,
};
