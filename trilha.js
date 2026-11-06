/* Aula em trilha (beta) — aba do Aula por IA. Gerado a partir de trilha.html; carregado só quando a aba abre. */
(function(){

var H = null, RAIZ = null;
function $(id){ return document.getElementById('tr_' + id); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function api(acao, dados){ return H.api(acao, dados); }
function erroGeral(m){ var e = $('erroGeral'); if(!e) return; e.textContent = m || ''; e.classList.toggle('oculto', !m); if(m) e.scrollIntoView({block:'nearest'}); }
/* =====================================================================================
   PROMPT para a IA externa (Claude etc.): o professor cola junto com o material das aulas
   ===================================================================================== */
// REGRAS v2 (06/11/2026), escritas pelo Claude que monta as aulas, a pedido do professor
var PROMPT_TRILHA = [
"Você vai montar uma AULA EM TRILHA para a plataforma \"Aula por IA\". É uma aula interativa que o estudante assiste sozinho, no formato de vídeo vertical (celular): a plataforma desenha em cima um gráfico que se anima e embaixo uma CENA de moléculas animadas, uma voz de IA lê a sua \"fala\" de cada passo com legenda, e o estudante pode pausar e tirar dúvidas por voz com outra IA (que usa o seu \"contexto_ia\" como base).",
"",
"MATERIAL: logo abaixo vem primeiro um resumo da disciplina (orientações e regras do professor, próxima prova, onde a turma está indo mal, glossário e a apostila de referência dele) e depois, aula por aula, a ata, a apostila gerada, as questões que ele fez em sala e a transcrição da fala dele. No fim, a PASTA DO GOOGLE DRIVE da disciplina com a lista dos arquivos (slides, apostilas). Se você tiver acesso ao Google Drive do professor, abra os arquivos que correspondem às aulas marcadas e use-os (os slides e as apostilas são a melhor base para a ORDEM das aulas, para os conceitos, para os gráficos e para os números). Se não tiver acesso, diga ao professor quais arquivos da lista ele deve anexar na conversa antes de você continuar.",
"",
"══════════════════════════════════════════════════════════════",
"REGRA PRINCIPAL (vale acima de todas as outras)",
"══════════════════════════════════════════════════════════════",
"NUNCA coloque um erro no vídeo. Se o professor falou algo errado ou impreciso na aula (conceito trocado, explicação incompleta que leva a uma ideia errada, número \"chutado\" ou impossível, lapso de fala), NÃO reproduza o erro e NÃO deixe o trecho de fora: CORRIJA. Ensine o conceito certo, mantendo a sequência da aula, os exemplos e o jeito de explicar do professor. Toda correção deve ser registrada no campo \"fonte\", em \"AJUSTES FEITOS EM RELAÇÃO À FALA\", dizendo o que ele falou e como ficou. Na dúvida entre \"erro do professor\" e \"erro da transcrição\", interprete pelo contexto, pelos slides e pela apostila; se continuar em dúvida, corrija e avise no campo \"fonte\" para ele conferir.",
"",
"REGRAS DE CONTEÚDO:",
"1. FIDELIDADE: siga a aula do professor: a mesma sequência, os mesmos conceitos, exemplos e números que ele usou. Você pode explicar de outro jeito, mais claro, e pode completar uma explicação que ficou pela metade, mas não acrescente assuntos que a aula não deu. A exceção é a REGRA PRINCIPAL: o que estiver errado é corrigido.",
"2. A transcrição foi feita automaticamente do áudio: palavras técnicas podem ter saído erradas (ex.: \"mylar\" = Maillard; \"sorvato\" = sorbato). Interprete pelo contexto e pelo glossário. Trechos fora do assunto (conversas paralelas, avisos da turma) ficam de fora.",
"3. Valores que você precisar criar só para desenhar (parâmetros de curva, um limite de exemplo) devem ser coerentes com a aula e com a literatura e marcados como \"(ilustrativo)\" no rótulo ou nos pontos. Quando existir valor real conhecido (ex.: ponto de congelamento de uma salmoura), use o valor real aproximado.",
"4. \"fala\" é para ser OUVIDA: frases curtas e naturais, como o professor falando, 2 a 5 frases por passo (no máximo ~700 caracteres). Sem símbolos nem siglas soltas: escreva \"atividade de água\" e não \"Aw\", \"trinta por cento\" e não \"30%\", \"graus Celsius\" e não \"°C\". Os \"pontos\" (texto na tela) podem usar símbolos.",
"5. UM BLOCO POR TRILHA: cada aula em trilha (cada arquivo JSON) tem UM ÚNICO bloco, sobre um assunto, com 6 a 12 passos (uns 5 a 8 minutos). Assuntos diferentes viram trilhas diferentes, nunca blocos juntos no mesmo arquivo. Cada passo mostra uma coisa nova no gráfico e/ou na cena.",
"6. \"contexto_ia\" (800 a 3000 caracteres): resumo fiel e CORRETO do que a aula ensina naquele bloco, com os exemplos e números usados (já corrigidos). É a base da IA que tira as dúvidas, então escreva tudo o que ela precisa saber para não contradizer a aula nem repetir um erro.",
"7. Feche o bloco com uma \"checagem\" (múltipla escolha que exige entender, não decorar) e uma \"pergunta_falada\" (o estudante responde falando).",
"8. No fim do bloco o estudante faz a avaliação de profundidade do \"Estudar com IA\" sobre o assunto. Em \"subtopico_id\", ponha o id do assunto do CATÁLOGO DO ESTUDAR COM IA (no fim deste prompt) que melhor corresponde ao bloco; se nenhum servir, deixe vazio.",
"9. Em \"tema_id\", ponha o id do SUBTEMA DA DISCIPLINA (lista no fim deste prompt) do assunto do bloco: as questões abertas do estudo dirigido no fim do bloco saem desse subtema. Se nenhum servir, deixe vazio.",
"10. VISUAL: toda trilha leva \"visual\": {\"fundo\": \"branco\"}. Use as cores pelo nome (a plataforma escolhe o tom com contraste para o fundo branco).",
"",
"REGRAS DO GRÁFICO (a plataforma desenha; você só descreve). O gráfico é opcional: se o trecho da aula não tiver gráfico, omita \"grafico\" e a parte de cima da tela mostra os \"pontos\" do passo em letras grandes.",
"- Coordenadas SEMPRE nas unidades dos eixos (ex.: x de 0 a 1 para atividade de água), nunca em pixels.",
"- Curvas são calculadas a partir de um modelo e parâmetros. Modelos: \"gab\" {m0, c, k (k<1)}; \"bet\" {m0, c} (só até x≈0,5); \"linear\" {a, b}: y=a+b·x; \"exponencial\" {a, b}: y=a·e^(b·x); \"sino\" {altura, centro, largura}; \"pontos\" {pontos: [[x,y],…]} para qualquer curva lida de um slide (com \"marcadores\": true mostra só as bolinhas). Opcional por série: \"rotulo_x\" (em que x o nome da curva aparece).",
"- Confira as contas: a curva inteira (de \"de\" até \"ate\") precisa caber entre y.min e y.max.",
"- A MAIORIA DOS ESTUDANTES VAI ASSISTIR NO CELULAR: rótulos bem curtos (até ~22 caracteres), no máximo 3 ou 4 anotações visíveis ao mesmo tempo (use \"limpar\"), \"pontos\" curtos (até ~90 caracteres) e títulos de passo curtos (até ~40 caracteres).",
"- Ponha a ORIGEM das setas (\"de\") num espaço vazio do gráfico, longe das curvas: o rótulo da seta fica na origem. A ponta (\"para\") encosta no que ela aponta.",
"- As séries começam escondidas; aparecem com a ação \"serie\". \"limpar\" apaga tudo (mostre de novo as curvas que precisar). Cada passo herda o que os anteriores desenharam (até um \"limpar\").",
"- Cores: azul, laranja, verde, vermelho, roxo, cinza, ambar.",
"",
"AÇÕES DO GRÁFICO (campo \"acoes\" do passo; \"atraso\" opcional em milissegundos, contado do começo do passo):",
"  {\"tipo\":\"serie\",\"serie\":\"id\"}  ·  {\"tipo\":\"destacar\",\"serie\":\"id\"}",
"  {\"tipo\":\"regiao\",\"de\":x1,\"ate\":x2,\"rotulo\":\"I\",\"cor\":\"azul\"}",
"  {\"tipo\":\"seta\",\"de\":[x,y],\"para\":[x,y],\"rotulo\":\"texto\",\"cor\":\"vermelho\"}",
"  {\"tipo\":\"ponto\",\"x\":x,\"serie\":\"id\",\"rotulo\":\"texto\"}  (ou \"y\" no lugar de \"serie\")",
"  {\"tipo\":\"ponto_movel\",\"serie\":\"id\",\"de\":x1,\"ate\":x2,\"rotulo\":\"texto\",\"duracao\":3000}",
"  {\"tipo\":\"linha_v\",\"x\":x,\"rotulo\":\"texto\"}  ·  {\"tipo\":\"linha_h\",\"y\":y,\"rotulo\":\"texto\"}",
"  {\"tipo\":\"distancia\",\"serie_a\":\"id\",\"serie_b\":\"id\",\"x\":x,\"rotulo\":\"texto\"}",
"  {\"tipo\":\"texto\",\"x\":x,\"y\":y,\"texto\":\"texto\"}  ·  {\"tipo\":\"limpar\"}",
"",
"CENA DE MOLÉCULAS (parte de baixo da tela; mostre o que a fala está explicando, como num desenho animado do fenômeno):",
"- Declare no bloco: \"cena\": {\"elementos\": [ … ]}. Coordenadas da cena: x de 0 a 100 (esquerda → direita), y de 0 a 60 (topo → base). Elementos começam escondidos.",
"- Tipos de elemento: \"agua\" (molécula de água; \"tamanho\" para ampliar), \"ion\" (\"rotulo\": \"Na⁺\", \"Cl⁻\"…), \"acucar\", \"cadeia\" (amido, fibra, proteína; \"unidades\": nº de anéis; \"cor\"), \"gordura\", \"particula\", \"bacteria\", \"caixa\" (objeto sólido, ex.: lata, embalagem; \"w\", \"h\"), \"estrutura\" (parede de um alimento, ex.: queijo; \"w\", \"h\"), \"rede\" (rede de gel/polímero; \"w\", \"h\"). Todos aceitam \"id\", \"x\", \"y\", \"rotulo\".",
"- Em cada passo, \"cena_acoes\" (mesma regra de \"atraso\"; cada passo herda a cena dos anteriores até um \"limpar_cena\"):",
"  {\"tipo\":\"aparecer\",\"elemento\":\"id\"} · {\"tipo\":\"sumir\",\"elemento\":\"id\"} · {\"tipo\":\"mover\",\"elemento\":\"id\",\"para\":[x,y],\"duracao\":1500}",
"  {\"tipo\":\"destacar\",\"elemento\":\"id\"} · {\"tipo\":\"danificar\",\"alvo\":\"id\",\"rotulo\":\"texto\"} · {\"tipo\":\"vagar\",\"elemento\":\"id\",\"agitacao\":0.1}",
"  {\"tipo\":\"aguas\",\"grupo\":\"w\",\"n\":30,\"area\":[x1,y1,x2,y2] ou \"dentro\":\"id\",\"agitacao\":0.6}  moléculas de água livres se agitando",
"  {\"tipo\":\"solutos\",\"especie\":\"ion|acucar|particula|gordura|o2\",\"n\":6,\"area\":[…]}  partículas soltas",
"  {\"tipo\":\"agitar\",\"grupo\":\"w\",\"agitacao\":0.1}  muda a agitação (ex.: esfriar)",
"  {\"tipo\":\"pontes\",\"alvo\":\"id\",\"n\":4}  pontes de hidrogênio em volta de uma molécula",
"  {\"tipo\":\"hidratar\",\"alvo\":\"id\",\"camadas\":1|2,\"n\":12,\"grupo\":\"w\",\"rotulo\":\"camada de hidratação\"}  a água livre migra e forma a camada (chamar de novo com n maior faz a camada crescer)",
"  {\"tipo\":\"congelar\",\"nucleos\":[[x,y],…],\"raio\":r,\"area\":[…] ou \"dentro\":\"id\",\"evitar_raio\":6,\"duracao\":5000}  cristal de gelo cresce a partir dos núcleos; com \"evitar_raio\" deixa bolsões líquidos em volta dos solutos; sem ele, empurra os solutos para fora",
"  {\"tipo\":\"derreter\",\"centro\":[x,y],\"raio\":12,\"duracao\":3000} · {\"tipo\":\"evaporar\",\"duracao\":3000} (sai toda a água menos a ligada)",
"  {\"tipo\":\"desidratar\",\"alvo\":\"id\",\"n\":8}  água sai de dentro de uma célula · {\"tipo\":\"prender\",\"grupo\":\"w\",\"dentro\":\"id\"}  água capturada por uma rede",
"  {\"tipo\":\"coletar\",\"especie\":\"particula\",\"para\":[x,y]}",
"  {\"tipo\":\"rotulo\",\"x\":x,\"y\":y,\"texto\":\"texto\",\"cor\":\"azul\"} · {\"tipo\":\"circulo\",\"x\":x,\"y\":y,\"r\":6,\"rotulo\":\"texto\"} · {\"tipo\":\"seta\",\"de\":[x,y],\"para\":[x,y],\"rotulo\":\"texto\"} · {\"tipo\":\"linha\",\"de\":[x,y],\"para\":[x,y]} · {\"tipo\":\"limpar_cena\"}",
"- Para comparar dois casos, divida a cena ao meio com uma \"linha\" em x=50 e rótulos no topo de cada lado. Rótulos da cena também curtos (até ~30 caracteres). As cenas são esquemáticas (fora de escala); diga isso no campo \"fonte\".",
"",
"REVISÃO COM O PROFESSOR (antes do arquivo final): primeiro mostre a LISTA de trilhas na ordem do curso (ordem dos PDFs das aulas e da apostila no Google Drive, não a ordem das gravações), com o assunto de cada uma e de quais aulas gravadas vem. Depois de aprovada, mostre o ROTEIRO de cada trilha (tabela com nº do passo, título, o que a voz diz, o que aparece no gráfico e o que acontece na cena) e, se a sua interface permitir conteúdo visual, uma PRÉVIA animada no formato vertical. Liste as correções feitas (REGRA PRINCIPAL). Ajuste o que ele pedir e só entregue o JSON final quando ele aprovar (ou se ele pedir o JSON direto).",
"",
"LOTE: se o material tiver vários assuntos, faça várias trilhas curtas (uma por assunto, um bloco cada), na ordem do curso, e devolva um arquivo .json por trilha. Se a resposta for ficar longa demais, entregue algumas trilhas por vez e diga quais ainda faltam; o professor pede \"continue\".",
"",
"FORMATO DE CADA ARQUIVO (devolva SÓ o JSON, sem comentários):",
"{",
"  \"formato\": \"aula-trilha/1\",",
"  \"titulo\": \"título curto da aula em trilha\",",
"  \"tema\": \"assuntos cobertos\",",
"  \"visual\": {\"fundo\": \"branco\"},",
"  \"fonte\": \"de quais aulas/slides veio. AJUSTES FEITOS EM RELAÇÃO À FALA: … As cenas de moléculas são esquemáticas (fora de escala).\",",
"  \"blocos\": [",
"    {",
"      \"id\": \"b1\",",
"      \"titulo\": \"título do bloco\",",
"      \"contexto_ia\": \"resumo fiel e correto do que a aula ensina neste bloco…\",",
"      \"subtopico_id\": \"id do catálogo do Estudar com IA (ou vazio)\",",
"      \"tema_id\": \"id do subtema da disciplina (ou vazio)\",",
"      \"grafico\": {",
"        \"x\": {\"rotulo\": \"Atividade de água (Aw)\", \"min\": 0, \"max\": 1, \"passo\": 0.1},",
"        \"y\": {\"rotulo\": \"Umidade (g/100 g ss)\", \"min\": 0, \"max\": 40, \"passo\": 10},",
"        \"series\": [",
"          {\"id\": \"ads\", \"nome\": \"adsorção\", \"modelo\": \"gab\", \"params\": {\"m0\": 5, \"c\": 12, \"k\": 0.9}, \"de\": 0.02, \"ate\": 0.95, \"cor\": \"azul\"}",
"        ]",
"      },",
"      \"cena\": {\"elementos\": [{\"id\": \"na\", \"tipo\": \"ion\", \"x\": 50, \"y\": 30, \"rotulo\": \"Na⁺\"}]},",
"      \"passos\": [",
"        {\"titulo\": \"título do passo\", \"fala\": \"o que a voz diz…\", \"pontos\": [\"ponto-chave que aparece na tela\"],",
"         \"acoes\": [{\"tipo\": \"serie\", \"serie\": \"ads\"}],",
"         \"cena_acoes\": [{\"tipo\": \"aguas\", \"grupo\": \"w\", \"n\": 30}, {\"tipo\": \"aparecer\", \"elemento\": \"na\"}, {\"tipo\": \"hidratar\", \"alvo\": \"na\", \"camadas\": 2, \"n\": 14, \"atraso\": 2000}]}",
"      ],",
"      \"checagem\": {\"tipo\": \"multipla\", \"pergunta\": \"…\", \"alternativas\": [\"…\", \"…\", \"…\"], \"correta\": 0, \"explicacao\": \"por que a certa é a certa\"},",
"      \"pergunta_falada\": {\"pergunta\": \"…\", \"esperado\": \"o que uma boa resposta contém\"}",
"    }",
"  ]",
"}",
"(\"correta\" conta do 0: a primeira alternativa é 0. \"blocos\" sempre com UM bloco.)",
"",
"============================== MATERIAL DAS AULAS =============================="
].join('\n');

// pedido de AJUSTE de uma aula já pronta (o professor anota o que mudar em cada passo)
function promptAjuste(trilha, notas){
  var ini = PROMPT_TRILHA.indexOf('REGRA PRINCIPAL'); if(ini < 0) ini = PROMPT_TRILHA.indexOf('REGRAS DE CONTEÚDO');
  var fim = PROMPT_TRILHA.indexOf('============================== MATERIAL DAS AULAS');
  return [
    'Você vai AJUSTAR uma AULA EM TRILHA já pronta da plataforma "Aula por IA" (aula interativa: slides com gráficos que se animam, narrada por voz de IA, com dúvidas por voz).',
    'Abaixo vêm as regras do formato (as mesmas de quando a aula foi criada), o JSON ATUAL da aula e os AJUSTES que o professor pediu, passo a passo.',
    'Faça SÓ o que foi pedido e mantenha o resto igual: os mesmos ids de blocos e a mesma ordem dos passos (assim a narração já gravada continua valendo onde a fala não mudou).',
    'Primeiro mostre ao professor, em poucas linhas, o que você vai mudar em cada passo (se a sua interface permitir, mostre também uma prévia visual do gráfico dos passos alterados). Depois devolva o JSON COMPLETO da aula ajustada, num bloco de código ou arquivo .json.',
    '', PROMPT_TRILHA.slice(ini, fim).replace(/\n?REVISÃO COM O PROFESSOR[^\n]*\n/, '\n').replace(/\n?DIVIDIR EM AULAS CURTAS[^\n]*\n/, '\n').replace(/\n?LOTE:[^\n]*\n/, '\n'),
    '============================== AJUSTES PEDIDOS PELO PROFESSOR ==============================', notas,
    '', '============================== JSON ATUAL DA AULA ==============================', JSON.stringify(trilha, null, 1)
  ].join('\n');
}
function chaveAjustes(){ return 'trilha_aj_' + (T && T.id ? T.id : 'previa'); }
function lerAjustes(){ try{ return JSON.parse(localStorage.getItem(chaveAjustes()) || '{}') || {}; }catch(e){ return {}; } }
function gravarAjustes(a){ try{ localStorage.setItem(chaveAjustes(), JSON.stringify(a)); }catch(e){} }
function textoAjustes(){
  var a = lerAjustes(), linhas = [];
  if(a.geral) linhas.push('• Na aula toda: ' + a.geral);
  T.trilha.blocos.forEach(function(b, bi){ b.passos.forEach(function(p, i){ var n = a[b.id + ':' + i]; if(n) linhas.push('• Bloco ' + (bi + 1) + ' "' + b.titulo + '" › passo ' + (i + 1) + ' "' + (p.titulo || '') + '": ' + n); }); });
  return linhas;
}
function mostrarAjuste(){
  if(!$('txtAjuste')) return;
  var b = blocoAtual(), a = lerAjustes();
  $('txtAjuste').value = a[b.id + ':' + P.passo] || '';
  $('rotAjuste').textContent = 'O que mudar no passo ' + (P.passo + 1) + ' (' + (b.passos[P.passo].titulo || b.titulo) + ')?';
  var n = textoAjustes().length; $('nAjustes').textContent = n ? n + ' ajuste(s) anotado(s)' : '';
}
/* ===================== estado geral ===================== */
var L = {disciplinas: [], trilhas: [], vozes: []};   // lista
var T = null;          // trilha aberta: {id, versao, trilha, narracao, voz, previa}
var conferida = null;  // última trilha conferida (antes de salvar)

function inicio(){
  if(!token){ irParaLogin(); return; }
  api('trilhasListar').then(function(r){ L = r; desenharLista(); })
    .catch(function(e){ $('corpo').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
}

/* ===================== LISTA, CRIAÇÃO E ESTATÍSTICA ===================== */
function nomeDisc(id){ var d = L.disciplinas.filter(function(x){ return x.id === id; })[0]; return d ? d.nome : '—'; }
var MODO = 'prof';   // 'prof': monta e gerencia as trilhas; 'aluno': só assiste e interage
function desenharLista(){
  if(MODO === 'aluno'){ desenharListaAluno(); return; }
  pararTudo();
  T = null;
  var filtro = ''; try{ filtro = localStorage.getItem('trilha_filtro_prof') || ''; }catch(e){}
  var discsCom = {}; L.trilhas.forEach(function(t){ discsCom[t.disciplina_id || ''] = (discsCom[t.disciplina_id || ''] || 0) + 1; });
  var discsOrd = Object.keys(discsCom).sort(function(a, b){ return nomeDisc(a).localeCompare(nomeDisc(b)); });
  if(!filtro || !discsCom[filtro]) filtro = discsOrd[0] || '';   // uma matéria por vez (com 30 aulas cada, "todas" vira bagunça)
  var h = '<div class="caixa"><h2>Suas aulas em trilha</h2>';
  if(L.trilhas.length){
    h += (discsOrd.length > 1 ? '<div class="t-blocos">' + discsOrd.map(function(d){ return '<button class="t-chip' + (d === filtro ? ' t-atual' : '') + '" data-trfiltro="' + esc(d) + '">' + esc(nomeDisc(d)) + ' (' + discsCom[d] + ')</button>'; }).join('') + '</div>' : '') +
      '<div class="botoes" style="margin:4px 0 10px"><input type="text" id="tr_buscaTrilha" placeholder="🔎 buscar aula…" style="flex:1 1 200px;max-width:340px"><button class="mini secundario" id="tr_btAbrirTodos">abrir todos</button><button class="mini secundario" id="tr_btFecharTodos">fechar todos</button></div>' +
      '<div id="tr_listaTrilhasProf"></div>' +
      '<details class="convite" style="margin-top:12px"><summary class="link"><b>🌙 Voz de leitura em segundo plano</b> (todas as aulas de uma vez; a voz é mais neutra que a da conversa)</summary><div class="aviso">Para a voz natural, abra a aula e use <b>🎙 Gravar com a voz da conversa</b>. Aqui o servidor grava sozinho (pode fechar o site), com a cota pequena de voz (umas 10 falas por modelo por dia); se acabar, continua no dia seguinte e te avisa no celular.</div>' +
      '<div class="botoes" style="margin-top:8px"><label>Voz: <select id="tr_vozLote">' + L.vozes.map(function(v){ return '<option>' + v + '</option>'; }).join('') + '</select></label><button class="mini secundario" id="tr_btGravarTodas">Gravar a voz de todas as aulas que faltam</button><span id="tr_msgLote" class="aviso"></span></div></details>';
  } else h += '<p class="aviso">Nenhuma ainda. Crie a primeira aqui embaixo.</p>';
  h += '</div>';
  h += '<div class="caixa"><h2>Criar uma aula em trilha</h2>' +
    '<p class="aviso" style="margin-top:0">O conteúdo é feito por uma IA robusta de fora (Claude, por exemplo), com o prompt da plataforma e o material das suas aulas. A plataforma confere, guarda no seu Drive (pasta "Aula em trilha", com as versões) e monta a aula.</p>' +
    '<p><span class="t-passoNum">1</span><b>Escolha as aulas que viram material</b></p>' +
    '<select id="tr_selDisc"><option value="">— disciplina —</option>' + L.disciplinas.map(function(d){ return '<option value="' + esc(d.id) + '">' + esc(d.nome) + ' (' + esc(d.semestre) + ')</option>'; }).join('') + '</select>' +
    '<div id="tr_boxAulas"></div>' +
    '<p style="margin-top:16px"><span class="t-passoNum">2</span><b>Copie o prompt e cole na sua IA</b></p>' +
    '<p class="aviso" style="margin-top:0">O prompt já leva as atas e transcrições das aulas marcadas e o link da <b>pasta de material da disciplina no Drive</b> com a lista dos arquivos (o campo "material no Drive" da disciplina). Se a sua IA não tiver acesso ao seu Drive, ela vai pedir os arquivos: aí é só anexar os slides (PDF) na conversa.</p>' +
    '<div class="botoes" style="margin-top:4px"><button id="tr_btCopiar" disabled>📋 Copiar o prompt com o material</button><button class="secundario" id="tr_btBaixarPrompt" disabled>⬇ Baixar como arquivo .txt</button><span id="tr_msgPrompt" class="aviso"></span></div>' +
    '<p style="margin-top:16px"><span class="t-passoNum">3</span><b>Traga de volta o que a IA devolveu</b></p>' +
    '<textarea id="tr_txtJson" placeholder="Cole aqui o JSON que a IA devolveu (ou escolha o arquivo .json abaixo)"></textarea>' +
    '<div class="botoes"><input type="file" id="tr_arqJson" accept=".json,application/json,text/plain"><button id="tr_btConferir">Conferir</button></div>' +
    '<div id="tr_resConf"></div></div>';

  h += '<div class="caixa"><h2>🎬 Criar a partir de um vídeo (NotebookLM)</h2>' +
    '<p class="aviso" style="margin-top:0">1) Suba o vídeo no YouTube como <b>não listado</b> e copie o link. 2) Escolha aqui o mesmo arquivo MP4: a plataforma guarda uma cópia no seu Drive, a IA assiste uma vez e monta o roteiro com os trechos marcados por tempo. 3) Confira e salve. Quem assiste não gasta IA.</p>' +
    '<select id="tr_selDiscVid"><option value="">— disciplina —</option>' + L.disciplinas.map(function(d){ return '<option value="' + esc(d.id) + '">' + esc(d.nome) + ' (' + esc(d.semestre) + ')</option>'; }).join('') + '</select>' +
    '<input type="text" id="tr_linkVid" placeholder="link do YouTube (ex.: https://youtu.be/…)" style="width:100%;margin-top:8px">' +
    '<div class="botoes"><input type="file" id="tr_arqVid" accept="video/mp4,video/*"><button id="tr_btVid">🎬 Enviar e montar o roteiro</button></div><div id="tr_msgVid"></div></div>';
  h += '<div class="caixa"><h2>📊 Quem estudou</h2><div id="tr_boxUso"><p class="aviso">Carregando…</p></div></div>';
  $('corpo').innerHTML = h;

  document.querySelectorAll('[data-trfiltro]').forEach(function(b){ b.addEventListener('click', function(){ try{ localStorage.setItem('trilha_filtro_prof', b.getAttribute('data-trfiltro')); }catch(e){} desenharLista(); }); });
  if($('buscaTrilha')){ var tb = null; $('buscaTrilha').addEventListener('input', function(){ clearTimeout(tb); tb = setTimeout(desenharListaProf, 200); }); }
  if($('btAbrirTodos')) $('btAbrirTodos').addEventListener('click', function(){ document.querySelectorAll('[data-trgrupoprof]').forEach(function(d){ d.open = true; }); });
  if($('btFecharTodos')) $('btFecharTodos').addEventListener('click', function(){ document.querySelectorAll('[data-trgrupoprof]').forEach(function(d){ d.open = false; }); });
  desenharListaProf();
  if($('btGravarTodas')) $('btGravarTodas').addEventListener('click', function(){ this.disabled = true; $('msgLote').textContent = 'Colocando na fila…'; api('trilhaNarrarFundo', {todas: true, voz: $('vozLote').value}).then(function(r){ return api('trilhasListar').then(function(r2){ L = r2; desenharLista(); $('msgLote').textContent = r.falas ? '✓ ' + r.falas + ' fala(s) de ' + r.aulas + ' aula(s) na fila. Pode fechar o site.' : 'Nada para gravar: já está tudo com a voz da IA.'; }); }).catch(function(e){ erroGeral(e.message); }); });
  $('selDisc').addEventListener('change', carregarAulasMaterial);
  $('btCopiar').addEventListener('click', function(){ montarPrompt(function(txt){
    navigator.clipboard.writeText(txt).then(function(){ $('msgPrompt').textContent = '✓ Copiado (' + Math.round(txt.length / 1000) + ' mil caracteres). Cole na sua IA.'; })
      .catch(function(){ $('msgPrompt').textContent = 'O navegador não deixou copiar: use "Baixar como arquivo".'; });
  }); });
  $('btBaixarPrompt').addEventListener('click', function(){ montarPrompt(function(txt){
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'text/plain;charset=utf-8'})); a.download = 'prompt-aula-em-trilha.txt'; a.click();
    $('msgPrompt').textContent = '✓ Arquivo baixado: anexe na conversa da sua IA.';
  }); });
  $('arqJson').addEventListener('change', function(){ var f = this.files[0]; if(!f) return; f.text().then(function(t){ $('txtJson').value = t; conferir(); }); });
  $('btConferir').addEventListener('click', conferir);
  $('btVid').addEventListener('click', function(){
    var bt = this, f = $('arqVid').files[0], link = $('linkVid').value.trim(), disc = $('selDiscVid').value, msg = $('msgVid');
    if(!link){ msg.innerHTML = '<div class="erro">Cole o link do vídeo no YouTube.</div>'; return; }
    if(!f){ msg.innerHTML = '<div class="erro">Escolha o arquivo MP4 do vídeo (o mesmo que subiu no YouTube).</div>'; return; }
    if(f.size > 45 * 1024 * 1024){ msg.innerHTML = '<div class="erro">O vídeo passa de 45 MB: por aqui não dá para enviar.</div>'; return; }
    bt.disabled = true;
    // lê o formato (vertical ou horizontal) e a duração do próprio arquivo
    var v = document.createElement('video'); v.preload = 'metadata'; v.src = URL.createObjectURL(f);
    var info = new Promise(function(res){ v.onloadedmetadata = function(){ res({vertical: v.videoHeight > v.videoWidth, duracao: v.duration || 0}); }; v.onerror = function(){ res({vertical: false, duracao: 0}); }; setTimeout(function(){ res({vertical: false, duracao: 0}); }, 8000); });
    var b64 = new Promise(function(res, rej){ var r = new FileReader(); r.onload = function(){ res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(f); });
    msg.innerHTML = '<p class="aviso">Enviando o vídeo (' + (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB)…</p>';
    Promise.all([info, b64]).then(function(x){
      var meta = x[0];
      return api('trilhaVideoEnviar', {b64: x[1], nome: f.name}).then(function(r){
        msg.innerHTML = '<p class="aviso">A IA está assistindo ao vídeo (' + (meta.vertical ? 'vertical' : 'horizontal') + ', ' + Math.round(meta.duracao / 60) + ' min) e montando o roteiro… leva de 1 a 3 minutos.</p>';
        return api('trilhaVideoAnalisar', {arquivoId: r.arquivoId, youtube: link, disciplinaId: disc, vertical: meta.vertical, duracao: meta.duracao});
      });
    }).then(function(r){
      bt.disabled = false;
      msg.innerHTML = '<div class="ok">✓ Roteiro montado. Confira logo abaixo (▶ Ver antes de salvar) e salve.</div>';
      $('txtJson').value = r.texto;
      if(disc){ $('selDisc').value = disc; }
      conferir();
      $('resConf').scrollIntoView({behavior: 'smooth', block: 'start'});
    }).catch(function(e){ bt.disabled = false; msg.innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
  });
  carregarUso();
}
// lista do professor: grande tema (na ordem do curso) → aulas (na ordem dos subtemas)
function desenharListaProf(){
  var box = $('listaTrilhasProf'); if(!box) return;
  var filtro = ''; try{ filtro = localStorage.getItem('trilha_filtro_prof') || ''; }catch(e){}
  var ds = {}; L.trilhas.forEach(function(t){ ds[t.disciplina_id || ''] = 1; });
  if(!filtro || !ds[filtro]) filtro = Object.keys(ds).sort(function(a, b){ return nomeDisc(a).localeCompare(nomeDisc(b)); })[0] || '';
  var q = ($('buscaTrilha') ? $('buscaTrilha').value : '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  var bate = function(t){ if(!q) return true; return (t.titulo + ' ' + (t.tema || '') + ' ' + (t.subtemas || []).join(' ') + ' ' + (t.grandeTema || '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) !== -1; };
  var lista = L.trilhas.filter(function(t){ return (t.disciplina_id || '') === filtro && bate(t); });
  if(!lista.length){ box.innerHTML = '<p class="aviso">' + (q ? 'Nenhuma aula com "' + esc(q) + '".' : 'Nenhuma aula nesta matéria.') + '</p>'; return; }
  var grupos = {}, ordem = {}, nomes = [];
  lista.forEach(function(t){ var g = t.grandeTema || 'Sem grande tema (ligue os subtemas na aula)'; if(!grupos[g]){ grupos[g] = []; nomes.push(g); } grupos[g].push(t); if(t.grandeOrdem) ordem[g] = t.grandeOrdem; });
  nomes.sort(function(a, b){ return ((ordem[a] || 1e6) - (ordem[b] || 1e6)) || a.localeCompare(b); });
  var abertos = {}; try{ abertos = JSON.parse(localStorage.getItem('trilha_grupos_prof') || '{}') || {}; }catch(e){}
  var tipoTxt = {video: '🎬 vídeo', cena: '🔬 cena', grafico: '📈 gráfico'};
  box.innerHTML = nomes.map(function(g){
    var l = grupos[g].sort(function(a, b){ return ((a.subOrdem === undefined ? 9999 : a.subOrdem) - (b.subOrdem === undefined ? 9999 : b.subOrdem)) || a.titulo.localeCompare(b.titulo); });
    var comVoz = l.filter(function(t){ return t.audios || t.tipo === 'video'; }).length;
    return '<details class="convite" data-trgrupoprof="' + esc(g) + '" style="margin:0 0 8px;padding:8px 12px"' + (q || abertos[g] || nomes.length === 1 ? ' open' : '') + '>' +
      '<summary style="cursor:pointer"><b>' + esc(g) + '</b> <span class="aviso">· ' + l.length + ' aula' + (l.length > 1 ? 's' : '') + ' · ' + comVoz + ' com voz</span></summary>' +
      l.map(function(t){
        var voz = t.tipo === 'video' ? '' : t.fila ? '⏳ gravando (faltam ' + t.fila.faltam + ')' : t.audios ? '🔊 voz da IA' : '🔈 voz do navegador';
        return '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid var(--linha);border-radius:8px;padding:8px 10px;margin-top:6px">' +
          '<div style="flex:1 1 240px;min-width:0"><b>' + esc(t.titulo) + '</b>' +
            '<div class="aviso" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc((t.subtemas || []).filter(function(x, i, a){ return a.indexOf(x) === i; }).join(' · ') || t.tema || '') + '</div>' +
            '<div class="aviso" style="margin-top:2px">' + [tipoTxt[t.tipo] || '', voz, 'v' + t.versao, t.sessoes ? '👥 ' + t.alunos : ''].filter(Boolean).join(' · ') + '</div></div>' +
          '<div style="display:flex;gap:6px;align-items:center"><button class="mini" data-trabrir="' + esc(t.id) + '">▶ Abrir</button>' +
            '<details style="position:relative"><summary class="link" style="list-style:none;cursor:pointer;font-size:18px;padding:0 6px" title="mais opções">⋯</summary>' +
              '<div style="position:absolute;right:0;z-index:5;background:#fff;border:1px solid var(--linha);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;min-width:190px;box-shadow:0 4px 14px #0002">' +
              (t.tipo === 'video' ? '' : '<button class="mini secundario" data-trgravar="' + esc(t.id) + '">🎙 ' + (t.audios ? 'Gravar as falas que faltam' : 'Gravar com a voz da IA') + '</button>') +
              '<button class="mini secundario" data-trapagar="' + esc(t.id) + '">🗑 Apagar</button></div></details></div></div>';
      }).join('') + '</details>';
  }).join('');
  box.querySelectorAll('[data-trgrupoprof]').forEach(function(d){ d.addEventListener('toggle', function(){ if(q) return; try{ var a = JSON.parse(localStorage.getItem('trilha_grupos_prof') || '{}') || {}; a[d.getAttribute('data-trgrupoprof')] = d.open; localStorage.setItem('trilha_grupos_prof', JSON.stringify(a)); }catch(e){} }); });
  ligarBotoesListaProf();
}
function ligarBotoesListaProf(){
  document.querySelectorAll('[data-trabrir]').forEach(function(b){ b.addEventListener('click', function(){ abrirTrilha(b.getAttribute('data-trabrir')); }); });
  var gravarFundo = function(dados, msg){
    $('msgLote').textContent = 'Colocando na fila…';
    api('trilhaNarrarFundo', dados).then(function(r){
      return api('trilhasListar').then(function(r2){ L = r2; desenharLista(); $('msgLote').textContent = r.falas ? '✓ ' + r.falas + ' fala(s) de ' + r.aulas + ' aula(s) na fila. Pode fechar o site.' : 'Nada para gravar: já está tudo com a voz da IA.'; });
    }).catch(function(e){ $('msgLote').textContent = ''; erroGeral(e.message); });
  };
  document.querySelectorAll('[data-trgravar]').forEach(function(b){ b.addEventListener('click', function(){ abrirTrilha(b.getAttribute('data-trgravar'), true); }); });
  document.querySelectorAll('[data-trapagar]').forEach(function(b){ b.addEventListener('click', function(){
    var t = L.trilhas.filter(function(x){ return x.id === b.getAttribute('data-trapagar'); })[0];
    if(!confirm('Apagar "' + t.titulo + '"? A pasta dela vai para a lixeira do seu Drive (dá para recuperar por 30 dias).')) return;
    b.disabled = true;
    api('trilhaApagar', {id: t.id}).then(inicio).catch(function(e){ b.disabled = false; erroGeral(e.message); });
  }); });
}
// visão do aluno: só a lista para estudar (sem criar, sem apagar, sem estatística)
function barraPct(p){ var c = p >= 100 ? '#1a7a3c' : p >= 50 ? '#2E62C6' : '#B8890A'; return '<div style="height:7px;background:#e3e8f2;border-radius:4px;overflow:hidden;margin:5px 0 2px"><div style="height:100%;width:' + Math.max(0, Math.min(100, p || 0)) + '%;background:' + c + '"></div></div>'; }
function desenharListaAluno(){
  pararTudo(); T = null;
  var porDisc = {}, ordem = [];
  L.trilhas.forEach(function(t){ var d = t.disciplina_id || ''; if(!porDisc[d]){ porDisc[d] = []; ordem.push(d); } porDisc[d].push(t); });
  ordem.sort(function(a, b){ return nomeDisc(a).localeCompare(nomeDisc(b)); });
  if(!L.trilhas.length){ $('corpo').innerHTML = '<p class="aviso">Ainda não há aulas em trilha.</p>'; return; }
  var atual = ''; try{ atual = localStorage.getItem('trilha_materia') || ''; }catch(e){}
  if(!porDisc[atual]) atual = ordem[0];
  var h = '<div class="t-blocos">' + ordem.map(function(d){
    var l = porDisc[d], pct = Math.round(l.reduce(function(a, t){ return a + (t.progresso || 0); }, 0) / l.length);
    return '<button class="t-chip' + (d === atual ? ' t-atual' : '') + '" data-trmateria="' + esc(d) + '">' + esc(nomeDisc(d)) + ' <span style="opacity:.75">· ' + pct + '%</span></button>';
  }).join('') + '</div>';
  // grandes temas da matéria (ex.: Água), cada um com as suas aulas e o % concluído
  var grupos = {}, ordG = [];
  porDisc[atual].forEach(function(t){ var g = t.grandeTema || 'Outros assuntos'; if(!grupos[g]){ grupos[g] = []; ordG.push(g); } grupos[g].push(t); });
  // na sequência do curso (a ordem que o professor deu aos grandes temas); sem ordem vão para o fim
  var ordemG = {}; porDisc[atual].forEach(function(t){ var g = t.grandeTema || 'Outros assuntos'; if(t.grandeOrdem) ordemG[g] = t.grandeOrdem; });
  ordG.sort(function(a, b){ return ((ordemG[a] || 1e6) - (ordemG[b] || 1e6)) || a.localeCompare(b); });
  var abertos = {}; try{ abertos = JSON.parse(localStorage.getItem('trilha_grupos') || '{}') || {}; }catch(e){}
  h += ordG.map(function(g){
    var l = grupos[g], pct = Math.round(l.reduce(function(a, t){ return a + (t.progresso || 0); }, 0) / l.length);
    return '<details class="convite" data-trgrupo="' + esc(g) + '" style="margin-bottom:10px"' + (abertos[g] || ordG.length === 1 ? ' open' : '') + '><summary style="cursor:pointer;list-style:none"><div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><b style="font-size:16px">' + esc(g) + '</b><span class="aviso">' + l.length + ' aula' + (l.length > 1 ? 's' : '') + ' · <b>' + pct + '% concluído</b></span></div>' + barraPct(pct) + '</summary>' +
      l.map(function(t){
        var subs = (t.subtemas || []).filter(function(x, i, a){ return a.indexOf(x) === i; });
        return '<div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:#fff;border:1px solid var(--linha);border-radius:8px;padding:9px 11px;margin-top:8px"><div style="flex:1 1 200px"><b>' + ((t.progresso || 0) >= 100 || t.estudei ? '✓ ' : '') + esc(t.titulo) + '</b>' + (t.estudei ? ' <span class="t-tag">já estudei</span>' : '') +
          (subs.length ? '<div class="aviso">' + esc(subs.join(' · ')) + '</div>' : '') + barraPct(t.progresso || 0) + '<span class="aviso">' + (t.progresso || 0) + '% · vídeo, questões e Estudar com IA</span></div>' +
          '<button class="mini' + (t.progresso ? ' secundario' : '') + '" data-trestudar="' + esc(t.id) + '">' + (t.progresso >= 100 ? '↻ Rever' : t.progresso ? '▶ Continuar' : '▶ Estudar') + '</button></div>';
      }).join('') + '</details>';
  }).join('');
  $('corpo').innerHTML = h;
  document.querySelectorAll('[data-trgrupo]').forEach(function(d){ d.addEventListener('toggle', function(){ try{ var a = JSON.parse(localStorage.getItem('trilha_grupos') || '{}') || {}; a[d.getAttribute('data-trgrupo')] = d.open; localStorage.setItem('trilha_grupos', JSON.stringify(a)); }catch(e){} }); });
  document.querySelectorAll('[data-trmateria]').forEach(function(b){ b.addEventListener('click', function(){ try{ localStorage.setItem('trilha_materia', b.getAttribute('data-trmateria')); }catch(e){} desenharListaAluno(); }); });
  document.querySelectorAll('[data-trestudar]').forEach(function(b){ b.addEventListener('click', function(){ abrirTrilha(b.getAttribute('data-trestudar')); }); });
}
function carregarAulasMaterial(){
  var id = $('selDisc').value; $('btCopiar').disabled = $('btBaixarPrompt').disabled = true;
  if(!id){ $('boxAulas').innerHTML = ''; return; }
  $('boxAulas').innerHTML = '<p class="aviso">Carregando as aulas…</p>';
  api('trilhaMaterial', {disciplinaId: id}).then(function(r){
    $('boxAulas').innerHTML = r.aulas.length ? '<div class="t-listaAulas">' + r.aulas.map(function(a){
      return '<label><input type="checkbox" data-traulamat="' + esc(a.id) + '"> <span>Aula ' + esc(a.numero) + ' · ' + esc(a.data) + ' · <b>' + esc(a.tema || 'sem tema') + '</b>' + (a.gravada ? (a.temAta ? '' : ' <span class="aviso">(sem ata)</span>') : ' <span class="aviso">(não gravada: sem transcrição)</span>') + '</span></label>';
    }).join('') + '</div><p class="aviso">Marque só as aulas do assunto da trilha (material demais deixa a IA menos precisa).</p>' : '<p class="aviso">Essa disciplina ainda não tem aulas.</p>';
    document.querySelectorAll('[data-traulamat]').forEach(function(c){ c.addEventListener('change', function(){ $('btCopiar').disabled = $('btBaixarPrompt').disabled = !document.querySelector('[data-traulamat]:checked'); }); });
  }).catch(function(e){ $('boxAulas').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
}
function montarPrompt(feito){
  var ids = Array.prototype.map.call(document.querySelectorAll('[data-traulamat]:checked'), function(c){ return c.getAttribute('data-traulamat'); });
  $('msgPrompt').textContent = 'Juntando o material…';
  api('trilhaMaterial', {disciplinaId: $('selDisc').value, aulaIds: ids}).then(function(r){
    feito(PROMPT_TRILHA.replace('para a plataforma "Aula por IA".', 'para a plataforma "Aula por IA", disciplina "' + r.disciplina + '" (graduação em Engenharia de Alimentos).') + '\n\n' + r.texto + (r.cortado ? '\n\n(Aviso: o material foi cortado por tamanho.)' : '') + (r.drive ? '\n\n============================== MATERIAL NO GOOGLE DRIVE ==============================\nPasta da disciplina: ' + r.drive.url + (r.drive.arquivos && r.drive.arquivos.length ? '\n' + r.drive.arquivos.map(function(f){ return '- ' + f.nome + ' — ' + f.url; }).join('\n') : (r.drive.erro ? '\n(' + r.drive.erro + ')' : '')) : '') + (r.temas ? '\n\n============================== SUBTEMAS DA DISCIPLINA (id — tema › subtema) ==============================\n' + r.temas : '') + (r.catalogo ? '\n\n============================== CATÁLOGO DO ESTUDAR COM IA (id — área › assunto) ==============================\n' + r.catalogo : ''));
  }).catch(function(e){ $('msgPrompt').textContent = ''; erroGeral(e.message); });
}
function conferir(){
  var txt = $('txtJson').value.trim();
  if(!txt){ $('resConf').innerHTML = '<div class="erro">Cole o JSON ou escolha o arquivo.</div>'; return; }
  $('resConf').innerHTML = '<p class="aviso">Conferindo…</p>'; conferida = null;
  api('trilhaEnviar', {texto: txt, salvar: false}).then(function(r){
    var h = '';
    if(r.erros.length) h += '<div class="erro"><b>Precisa corrigir antes de salvar (' + r.erros.length + '):</b><ul class="t-erros">' + r.erros.map(function(e){ return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>Dica: copie esta lista e peça à IA para corrigir.</div>';
    if(r.avisos.length) h += '<div class="convite"><b>Avisos:</b><ul class="t-erros">' + r.avisos.map(function(e){ return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
    if(!r.erros.length){
      conferida = r.trilhas && r.trilhas.length ? r.trilhas : [r.trilha];
      var lote = conferida.length > 1;
      h += '<div class="ok">✓ Formato certo' + (lote ? ': <b>' + conferida.length + ' aulas em trilha</b> neste arquivo' : '') + '.<ul class="t-erros" style="margin-bottom:0">' + (r.resumo || []).map(function(x){ return '<li><b>' + esc(x.titulo) + '</b> · ' + x.blocos + ' bloco(s) · ' + x.passos + ' passos</li>'; }).join('') + '</ul></div>' +
        '<div class="botoes">' + (lote ? '<select id="tr_selPrevia">' + conferida.map(function(t, i){ return '<option value="' + i + '">' + esc(t.titulo) + '</option>'; }).join('') + '</select>' : '') + '<button class="secundario" id="tr_btPrevia">▶ Ver antes de salvar</button>' +
        '<select id="tr_selDiscSalvar"><option value="">disciplina…</option>' + L.disciplinas.map(function(d){ return '<option value="' + esc(d.id) + '"' + (d.id === $('selDisc').value ? ' selected' : '') + '>' + esc(d.nome) + '</option>'; }).join('') + '</select>' +
        (lote ? '' : '<select id="tr_selDestino"><option value="">salvar como trilha nova</option>' + L.trilhas.map(function(t){ return '<option value="' + esc(t.id) + '">nova versão de: ' + esc(t.titulo) + ' (v' + t.versao + ')</option>'; }).join('') + '</select>') +
        '<button id="tr_btSalvar">' + (lote ? 'Salvar as ' + conferida.length + ' aulas' : 'Salvar') + '</button></div><div id="tr_msgSalvar"></div>';
    }
    $('resConf').innerHTML = h;
    if(!r.erros.length){
      $('btPrevia').addEventListener('click', function(){ abrirPlayer({id: '', versao: 0, trilha: conferida[$('selPrevia') ? Number($('selPrevia').value) : 0], narracao: {}, voz: 'Kore', previa: true}); });
      $('btSalvar').addEventListener('click', function(){
        var b = this; b.disabled = true; $('msgSalvar').innerHTML = '<p class="aviso">Salvando no Drive…</p>';
        api('trilhaEnviar', {texto: $('txtJson').value, salvar: true, disciplinaId: $('selDiscSalvar').value, id: $('selDestino') ? $('selDestino').value : ''}).then(function(s){
          if(s.erros && s.erros.length) throw new Error(s.erros.join(' '));
          return api('trilhasListar').then(function(r2){ L = r2; if((s.ids || []).length > 1){ desenharLista(); erroGeral(''); $('corpo').insertAdjacentHTML('afterbegin', '<div class="ok">✓ ' + s.ids.length + ' aulas em trilha salvas no seu Drive.</div>'); } else abrirTrilha(s.id); });
        }).catch(function(e){ b.disabled = false; $('msgSalvar').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
      });
    }
  }).catch(function(e){ $('resConf').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
}
function fmtTempo(s){ s = Math.round(s || 0); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' h ' + m + ' min' : m ? m + ' min' : s + ' s'; }
function carregarUso(){
  api('trilhaUso', {}).then(function(l){
    var nomeT = function(id){ var t = L.trilhas.filter(function(x){ return x.id === id; })[0]; return t ? t.titulo : '(apagada)'; };
    $('boxUso').innerHTML = l.length ? '<div class="tabelaBox"><table><tr><th>Quem</th><th>Aula</th><th>Tempo de estudo</th><th>Avanço</th><th>Dúvidas por voz</th><th>Checagens</th><th>Profundidade (Estudar com IA)</th><th>Marcou como estudada</th><th>Comentário</th><th>Último uso</th></tr>' +
      l.map(function(a){
        return '<tr><td>' + esc(a.aluno) + '</td><td>' + esc(nomeT(a.trilha_id)) + '</td><td>' + fmtTempo(a.segundos) + ' <span class="aviso">(' + a.sessoes + ' sessão' + (a.sessoes > 1 ? 'ões' : '') + ')</span></td>' +
          '<td>' + a.passos + ' de ' + a.total_passos + ' passos</td><td>' + (a.duvidas ? a.duvidas + ' · ' + fmtTempo(a.duvida_seg) : '—') + '</td>' +
          '<td>' + (a.checagens ? a.acertos + ' de ' + a.checagens + ' certas' : '—') + '</td><td>' + (a.profundidade !== undefined ? '<b>' + a.profundidade + '</b> <span class="aviso">(melhor de ' + a.avaliacoes + ')</span>' : '—') + '</td><td>' + (a.estudei ? '✓ ' + esc(a.estudei) : '—') + '</td><td style="max-width:260px">' + (a.comentario ? esc(a.comentario) : '—') + '</td><td>' + esc(a.ultimo || '—') + '</td></tr>';
      }).join('') + '</table></div><p class="aviso">Tempo de estudo conta só com a aula aberta na tela e em uso. Por enquanto só você usa; quando liberarmos para os alunos, eles aparecem aqui.</p>' :
      '<p class="aviso">Ninguém usou ainda. Aqui vai aparecer quem estudou, por quanto tempo, até onde chegou, as dúvidas por voz, os acertos nas checagens, quem marcou como estudada e os comentários.</p>';
  }).catch(function(e){ $('boxUso').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
}

/* ===================== PLAYER ===================== */
var P = {bloco: 0, passo: 0, tocando: false, modoVoz: 'auto', vel: 1, timers: [], raf: null, fimAcoes: 0, aud: null, cacheAud: {}, fimDoBloco: false};
function abrirTrilha(id, gravar){
  $('corpo').innerHTML = '<p class="aviso">Abrindo a aula…</p>';
  api('trilhaVer', {id: id}).then(function(t){
    abrirPlayer(t);
    // veio do botão "Gravar com a voz da IA": já abre o painel da narração
    if(gravar && $('admNarr')){ var d = $('admNarr'); d.open = true; desenharNarracao(); setTimeout(function(){ d.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 100); }
  }).catch(function(e){ $('corpo').innerHTML = '<div class="erro">' + esc(e.message) + '</div><a class="link" onclick="Trilha.voltar()">voltar</a>'; });
}
function abrirPlayer(t){
  pararTudo();
  T = t; P.bloco = 0; P.passo = 0; P.cacheAud = {}; P.tocando = false; P.blocoAssunto = -1;
  try{ P.vel = Number(localStorage.getItem('trilha_vel') || 1) || 1; }catch(e){}
  U.iniciar();
  var tr = t.trilha;
  var h = '<div class="botoes" style="margin:0 0 6px;justify-content:space-between"><a class="link" id="tr_lnVoltar">← ' + (MODO === 'aluno' ? 'outras aulas em trilha' : 'todas as aulas em trilha') + '</a>' +
    (MODO === 'aluno' ? '' : t.previa ? '<span class="t-tag">pré-visualização (ainda não salva)</span>' : '<span class="aviso">v' + t.versao + ' · <a href="' + esc(t.pasta) + '" target="_blank" rel="noopener">pasta no Drive</a></span>') + '</div>' +
    '<h2 style="margin:0">' + esc(tr.titulo) + '</h2>' +
    '<div class="t-blocos" id="tr_chips">' + tr.blocos.map(function(b, i){ return '<button class="t-chip" data-trbloco="' + i + '">' + (i + 1) + '. ' + esc(b.titulo) + '</button>'; }).join('') + '</div>' +
    (MODO === 'prof' && !t.previa ? '<div id="tr_temaBox" class="aviso" style="margin:-4px 0 4px"></div><div id="tr_assuntoBox" class="aviso" style="margin:0 0 10px"></div>' : '') +
    '<div class="t-palco"><div class="t-titSlide" id="tr_titSlide"></div><div class="t-ref" id="tr_refSlide"></div>' +
    (tr.video ? '<div class="t-videoBox' + (tr.video.vertical ? ' t-vertical' : '') + '"><div id="tr_ytPlayer"></div></div><div id="tr_notaProf" class="t-notaProf oculto"></div>' : '<div id="tr_quadro" class="t-quadro"><svg id="tr_svg" viewBox="0 0 800 440" role="img" aria-label="gráfico da aula"></svg><div id="tr_cenaBox" class="t-cenaBox oculto"><svg id="tr_cenaSvg" viewBox="0 0 100 60" role="img" aria-label="cena animada da aula"></svg></div></div>') + '</div>' +
    '<div class="t-controles">' +
      '<button class="mini secundario" id="tr_btVolta" title="passo anterior">⏮</button>' +
      '<button class="mini" id="tr_btPlay" style="min-width:110px">▶ Começar</button>' +
      '<button class="mini secundario" id="tr_btAvanca" title="próximo passo">⏭</button>' +
      '<span class="t-info" id="tr_passoInfo"></span><div class="t-barra"><div id="tr_barra"></div></div>' +
      (tr.video ? '' : '<select id="tr_selVoz" title="voz da narração"></select>') +
      (tr.video ? '<select id="tr_selVel" title="velocidade"><option value="0.75">0,75×</option><option value="1">1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option></select>' : '<select id="tr_selVel" title="velocidade"><option value="0.9">0,9×</option><option value="1">1×</option><option value="1.15">1,15×</option><option value="1.3">1,3×</option></select>') +
      '<button class="mini vermelho" id="tr_btDuvida">✋ Tenho uma dúvida</button>' +
    '</div>' +
    (MODO === 'prof' && !t.previa && !tr.video && !temNarracaoIA() ? '<div class="convite" id="tr_avisoNarr" style="margin-top:10px">🔈 Esta aula ainda está com a <b>voz do navegador</b> (robótica). Grave uma vez com a <b>voz da conversa</b> (a mesma voz natural da dúvida por voz); depois ela toca para todos. <button class="mini" id="tr_btIrNarr">🎙 Gravar com a voz da IA</button></div>' : '') +
    '<div id="tr_duvidaBox" class="t-duvidaBox oculto"></div>' +
    '<div class="t-texto"><div><b>Pontos-chave</b><ul class="t-pontos" id="tr_pontos"></ul></div>' +
      '<div><b>O que a voz está dizendo</b><div class="t-legenda" id="tr_legenda"></div><div id="tr_avisoVoz" class="convite oculto"></div></div></div>' +
    '<div id="tr_checagem"></div>' +
    (t.previa ? '' : '<div id="tr_marcaBox" class="convite" style="margin-top:14px"></div>') +
    (MODO === 'prof' ? '<details class="convite" id="tr_ajusteBox" style="margin-top:14px"><summary class="link"><b>📝 Pedir ajustes à IA</b> (anote o que mudar em cada passo)</summary>' +
      '<label class="aviso" id="tr_rotAjuste" for="txtAjuste" style="display:block;margin-top:8px"></label><textarea id="tr_txtAjuste" style="min-height:60px;font-family:inherit;font-size:14px" placeholder="ex.: a seta tem que apontar para a curva de cima; fala longa demais; trocar o exemplo do leite por café"></textarea>' +
      '<label class="aviso" for="txtAjusteGeral" style="display:block;margin-top:6px">Ajuste na aula toda (opcional)</label><input type="text" id="tr_txtAjusteGeral" style="width:100%" placeholder="ex.: falas mais curtas; mais um bloco sobre histerese">' +
      '<div class="botoes"><button class="mini" id="tr_btCopiarAjuste">📋 Copiar pedido de ajustes para a IA</button><button class="mini secundario" id="tr_btLimparAjuste">Limpar anotações</button><span id="tr_nAjustes" class="aviso"></span></div>' +
      '<p class="aviso" style="margin-bottom:0">Cole na sua IA (de preferência na mesma conversa em que a aula foi criada). Depois traga o JSON corrigido em <b>Criar uma aula em trilha → passo 3</b> e salve como <b>nova versão</b> desta aula.</p><div id="tr_msgAjuste"></div></details>' : '') +
    (MODO === 'prof' && !t.previa && tr.video ? '<details class="convite" id="tr_notaBox" style="margin-top:14px"><summary class="link"><b>📌 Nota do professor neste trecho</b> (aparece para o aluno nesse momento do vídeo; serve para corrigir ou completar sem refazer o vídeo)</summary>' +
      '<label class="aviso" id="tr_rotNota" for="txtNota" style="display:block;margin-top:8px"></label><textarea id="tr_txtNota" maxlength="400" style="min-height:56px;font-family:inherit;font-size:14px" placeholder="ex.: atenção: aqui o vídeo diz 0,7, mas o certo é 0,6"></textarea><div class="botoes"><button class="mini" id="tr_btNota">Salvar a nota</button><span id="tr_msgNota" class="aviso"></span></div></details>' : '') +
    (MODO === 'prof' && tr.video ? '<div class="botoes"><button class="mini secundario" id="tr_btCapitulos">📋 Copiar os capítulos para a descrição do YouTube</button><span id="tr_msgCap" class="aviso"></span></div>' : '') +
    (t.previa || MODO === 'aluno' || tr.video ? '' : '<details class="t-admNarr convite" id="tr_admNarr"><summary class="link"><b>🎙 Narração com voz da IA</b> (gravada uma vez, depois toca para todos sem gastar cota)</summary><div id="tr_admNarrCorpo"></div></details>');
  $('corpo').innerHTML = h;
  if(!t.previa) desenharMarca();
  if($('txtAjuste')){
    $('txtAjusteGeral').value = lerAjustes().geral || '';
    $('txtAjuste').addEventListener('input', function(){ var a = lerAjustes(), k = blocoAtual().id + ':' + P.passo; if(this.value.trim()) a[k] = this.value.trim(); else delete a[k]; gravarAjustes(a); mostrarAjuste(); });
    $('txtAjusteGeral').addEventListener('input', function(){ var a = lerAjustes(); if(this.value.trim()) a.geral = this.value.trim(); else delete a.geral; gravarAjustes(a); mostrarAjuste(); });
    $('btLimparAjuste').addEventListener('click', function(){ if(confirm('Apagar as anotações de ajuste desta aula?')){ gravarAjustes({}); $('txtAjusteGeral').value = ''; mostrarAjuste(); } });
    $('btCopiarAjuste').addEventListener('click', function(){
      var l = textoAjustes();
      if(!l.length){ $('msgAjuste').innerHTML = '<div class="erro">Anote pelo menos um ajuste (em algum passo ou na aula toda).</div>'; return; }
      var txt = promptAjuste(T.trilha, l.join('\n'));
      navigator.clipboard.writeText(txt).then(function(){ $('msgAjuste').innerHTML = '<div class="ok">✓ Copiado (' + l.length + ' ajuste(s)). Cole na sua IA.</div>'; })
        .catch(function(){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'text/plain;charset=utf-8'})); a.download = 'ajustes-aula-em-trilha.txt'; a.click(); $('msgAjuste').innerHTML = '<div class="ok">O navegador não deixou copiar: baixei como arquivo .txt.</div>'; });
    });
  }
  $('lnVoltar').addEventListener('click', function(){ U.enviar(true); inicio(); });
  document.querySelectorAll('[data-trbloco]').forEach(function(b){ b.addEventListener('click', function(){ irPara(Number(b.getAttribute('data-trbloco')), 0, P.tocando); }); });
  $('btPlay').addEventListener('click', function(){ if(P.tocando) pausar(); else { if(P.fimDoBloco) irPara(P.bloco, 0, false); tocar(); } });
  $('btAvanca').addEventListener('click', function(){ avancar(1); });
  $('btVolta').addEventListener('click', function(){ avancar(-1); });
  $('selVel').value = String(P.vel); if(!$('selVel').value) $('selVel').value = '1';
  if(tr.video && !$('selVel').value) $('selVel').value = '1';
  $('selVel').addEventListener('change', function(){ P.vel = Number(this.value); try{ localStorage.setItem('trilha_vel', String(P.vel)); }catch(e){} if(P.aud) P.aud.playbackRate = P.vel; if(ehVideo() && VID.p && VID.pronto) try{ VID.p.setPlaybackRate(P.vel); }catch(e){} });
  if(!tr.video) montarSelVoz();
  if(tr.video){ P.modoVoz = 'mudo'; criarVideo(); }
  // capítulos no formato do YouTube (começa em 0:00): cada bloco e, dentro dele, os trechos
  if($('btCapitulos')) $('btCapitulos').addEventListener('click', function(){
    var mm = function(x){ x = Math.round(x || 0); var h = Math.floor(x / 3600), m = Math.floor(x % 3600 / 60), sg = ('0' + x % 60).slice(-2); return h ? h + ':' + ('0' + m).slice(-2) + ':' + sg : m + ':' + sg; };
    var l = [];
    T.trilha.blocos.forEach(function(b, bi){ b.passos.forEach(function(q, k){ l.push(mm(l.length ? q.inicio : 0) + ' ' + (k === 0 ? 'Bloco ' + (bi + 1) + ' – ' + b.titulo : q.titulo || ('Trecho ' + (k + 1)))); }); });
    var txt = 'Capítulos' + String.fromCharCode(10) + l.join(String.fromCharCode(10));
    navigator.clipboard.writeText(txt).then(function(){ $('msgCap').textContent = '✓ ' + l.length + ' capítulos copiados: cole na descrição do vídeo no YouTube.'; }).catch(function(){ $('msgCap').textContent = 'O navegador não deixou copiar.'; });
  });
  if($('btNota')) $('btNota').addEventListener('click', function(){
    var k = blocoAtual().id + ':' + P.passo, v = $('txtNota').value; $('msgNota').textContent = 'salvando…';
    api('trilhaNota', {id: T.id, chave: k, texto: v}).then(function(n){ T.notas = n; mostrarNota(); $('msgNota').textContent = '✓ salva'; }).catch(function(e){ $('msgNota').textContent = e.message; });
  });
  $('btDuvida').addEventListener('click', abrirDuvida);
  if($('btIrNarr')) $('btIrNarr').addEventListener('click', function(){ var d = $('admNarr'); d.open = true; desenharNarracao(); d.scrollIntoView({behavior: 'smooth', block: 'start'}); });
  if($('admNarr')) $('admNarr').addEventListener('toggle', function(){ if(this.open) desenharNarracao(); });
  irPara(0, 0, false);
}
// o aluno marca a aula como estudada e pode deixar um comentário (o professor vê)
function minhaMarca(){ var x = L.trilhas.filter(function(y){ return T && y.id === T.id; })[0]; return x || {estudei: false, comentario: ''}; }
function desenharMarca(){
  var box = $('marcaBox'); if(!box) return;
  var m = minhaMarca();
  box.innerHTML = '<label style="display:flex;gap:8px;align-items:center;cursor:pointer;font-weight:bold"><input type="checkbox" id="tr_chkEstudei" style="width:18px;height:18px"' + (m.estudei ? ' checked' : '') + '> ✓ Já estudei esta aula</label>' +
    '<details style="margin-top:6px"' + (m.comentario ? ' open' : '') + '><summary class="link">' + (m.comentario ? 'Seu comentário' : 'Deixar um comentário (opcional)') + '</summary>' +
    '<textarea id="tr_txtComent" maxlength="2000" style="min-height:70px;font-family:inherit;font-size:14px" placeholder="O que ficou claro, o que ainda ficou confuso, uma sugestão…">' + esc(m.comentario) + '</textarea>' +
    '<div class="botoes" style="margin-top:6px"><button class="mini" id="tr_btComent">Salvar comentário</button></div></details><div id="tr_msgMarca"></div>';
  var salvar = function(msg){
    var est = $('chkEstudei').checked, com = $('txtComent').value;
    $('msgMarca').innerHTML = '<p class="aviso">Salvando…</p>';
    api('trilhaMarcar', {id: T.id, estudei: est, comentario: com}).then(function(r){
      var x = minhaMarca(); x.estudei = r.estudei; x.comentario = r.comentario;
      $('msgMarca').innerHTML = '<div class="ok" style="margin:6px 0 0">' + msg(r) + '</div>';
    }).catch(function(e){ $('msgMarca').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
  };
  $('chkEstudei').addEventListener('change', function(){ salvar(function(r){ return r.estudei ? '✓ Marcada como estudada.' : 'Desmarcada.'; }); });
  $('btComent').addEventListener('click', function(){ salvar(function(){ return '✓ Comentário salvo.'; }); });
}
// assunto do Estudar com IA ligado ao bloco (vem do servidor; na pré-visualização ainda não tem)
function assuntoDoBloco(b){ var a = (T.assuntos || []).filter(function(x){ return x.bloco === b.id; })[0]; return a && a.id ? a : null; }
function desenharTemaBloco(){
  var box = $('temaBox'); if(!box) return;
  var b = blocoAtual(), a = temaDoBloco(b), lista = T.temasDisc || [];
  if(!T.disciplina_id){ box.innerHTML = '📝 Questões: escolha a disciplina da trilha ao salvar (nova versão) para ligar os subtemas.'; return; }
  var gr = {}; lista.forEach(function(x){ (gr[x.grupo || 'Outros'] = gr[x.grupo || 'Outros'] || []).push(x); });
  box.innerHTML = '📝 Questões deste bloco (estudo dirigido): <select id="tr_selTemaBloco" style="max-width:100%;font-size:13px;padding:4px 6px"><option value="">— sem questão aberta —</option>' +
    Object.keys(gr).sort().map(function(g){ return '<optgroup label="' + esc(g) + '">' + gr[g].map(function(x){ return '<option value="' + esc(x.id) + '"' + (a && a.id === x.id ? ' selected' : '') + '>' + esc(x.nome) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>' +
    (a && a.origem === 'sugerido' ? ' <span class="t-tag">sugerido: confira</span>' : '') +
    ' <label style="white-space:nowrap;cursor:pointer"><input type="checkbox" id="tr_chkQProva"' + (T.questoesProva ? ' checked' : '') + '> incluir assuntos da próxima prova</label> <span id="tr_msgTema"></span>';
  $('selTemaBloco').addEventListener('change', function(){
    $('msgTema').textContent = 'salvando…';
    api('trilhaTema', {id: T.id, blocoId: b.id, temaId: this.value}).then(function(l){ T.temasBlocos = l; desenharTemaBloco(); $('msgTema').textContent = '✓ salvo'; }).catch(function(e){ $('msgTema').textContent = e.message; });
  });
  $('chkQProva').addEventListener('change', function(){
    var v = this.checked; $('msgTema').textContent = 'salvando…';
    api('trilhaQuestoesProva', {id: T.id, ligado: v}).then(function(r){ T.questoesProva = r; $('msgTema').textContent = '✓ salvo'; }).catch(function(e){ $('msgTema').textContent = e.message; });
  });
}
function desenharAssunto(){
  desenharTemaBloco();
  var box = $('assuntoBox'); if(!box) return;
  var b = blocoAtual(), a = assuntoDoBloco(b), cat = T.catalogo || [];
  if(!cat.length){ box.innerHTML = 'Não deu para ler o catálogo do Estudar com IA agora.'; return; }
  var areas = {}; cat.forEach(function(c){ (areas[c.area] = areas[c.area] || []).push(c); });
  box.innerHTML = '🎤 Avaliação no fim deste bloco (Estudar com IA): <select id="tr_selAssunto" style="max-width:100%;font-size:13px;padding:4px 6px"><option value="">— sem avaliação —</option>' +
    Object.keys(areas).sort().map(function(ar){ return '<optgroup label="' + esc(ar) + '">' + areas[ar].map(function(c){ return '<option value="' + esc(c.id) + '"' + (a && a.id === c.id ? ' selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('') + '</optgroup>'; }).join('') +
    '</select>' + (a && a.origem === 'sugerido' ? ' <span class="t-tag">sugerido: confira</span>' : '') + ' <span id="tr_msgAssunto"></span>';
  $('selAssunto').addEventListener('change', function(){
    var v = this.value; $('msgAssunto').textContent = 'salvando…';
    api('trilhaAssunto', {id: T.id, blocoId: b.id, subtopicoId: v}).then(function(l){ T.assuntos = l; P.blocoAssunto = -1; desenharAssunto(); $('msgAssunto').textContent = '✓ salvo'; })
      .catch(function(e){ $('msgAssunto').textContent = e.message; });
  });
}
// a própria página do Estudar com IA, embutida, já no assunto do bloco (fica no histórico do aluno)
function abrirAvaliacao(ass){
  pausar();
  var ctl = document.querySelector('.t-app .t-controles'); if(ctl) ctl.style.position = 'static';   // a barra fixa não cobre a avaliação
  var box = $('avalBox'); if(!box) return;
  box.innerHTML = '<b>🎤 ' + esc(ass.nome) + '</b> <span class="aviso">· Estudar com IA</span>' +
    '<iframe id="tr_frAval" src="index.html?embed=trilha&sub=' + encodeURIComponent(ass.id) + '" allow="microphone" title="Avaliação de profundidade" style="width:100%;border:0;min-height:460px;margin-top:6px;background:transparent"></iframe>';
}
var telaAval = '';
window.addEventListener('message', function(ev){
  var d = ev.data, fr = $('frAval');
  if(!fr || !d || d.tipo !== 'avaliador' || ev.source !== fr.contentWindow) return;
  if(d.altura) fr.style.height = Math.max(460, d.altura) + 'px';
  // mudou de tela lá dentro (rodada, resultado…): traz o topo da avaliação para a vista
  if(d.tela && telaAval && d.tela !== telaAval) fr.scrollIntoView({behavior: 'smooth', block: 'start'});
  telaAval = d.tela || telaAval;
});
/* ---------- aula em vídeo (YouTube): o vídeo toca e a plataforma acompanha o trecho ---------- */
var VID = {p: null, pronto: false, timer: null, seguindo: false, parouNoFim: false};
function ehVideo(){ return !!(T && T.trilha && T.trilha.video && T.trilha.video.youtube); }
function carregarYT(cb){
  if(window.YT && window.YT.Player){ cb(); return; }
  window.__filaYT = window.__filaYT || []; window.__filaYT.push(cb);
  if(!document.getElementById('api_youtube')){
    var anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){ try{ if(anterior) anterior(); }catch(e){} (window.__filaYT || []).splice(0).forEach(function(f){ try{ f(); }catch(e){} }); };
    var sc = document.createElement('script'); sc.id = 'api_youtube'; sc.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(sc);
  }
}
function criarVideo(){
  pararVideo();
  var alvo = T;
  carregarYT(function(){
    if(T !== alvo || !$('ytPlayer')) return;
    VID.p = new YT.Player('tr_ytPlayer', {videoId: T.trilha.video.youtube, width: '100%', height: '100%',
      playerVars: {playsinline: 1, rel: 0, modestbranding: 1},
      events: {
        onReady: function(){ VID.pronto = true; try{ VID.p.setPlaybackRate(P.vel); }catch(e){} },
        onStateChange: function(e){
          if(e.data === 1){ P.tocando = true; P.fimDoBloco = false; $('btPlay').textContent = '⏸ Pausar'; seguirVideo(); }
          else if(e.data === 2 || e.data === 0){
            if(VID.timer){ clearInterval(VID.timer); VID.timer = null; }
            if(e.data === 0 && !P.fimDoBloco){ P.tocando = false; fimDoBloco(); return; }
            if(!P.fimDoBloco){ P.tocando = false; $('btPlay').textContent = '▶ Continuar'; }
          }
        }
      }});
  });
}
function pararVideo(){
  if(VID.timer){ clearInterval(VID.timer); VID.timer = null; }
  try{ if(VID.p && VID.p.destroy) VID.p.destroy(); }catch(e){}
  VID.p = null; VID.pronto = false;
}
// a cada 0,3 s: em que trecho o vídeo está? troca os pontos-chave e, no fim de um bloco, pausa para as 3 partes
function seguirVideo(){
  if(VID.timer) clearInterval(VID.timer);
  VID.timer = setInterval(function(){
    if(!VID.p || !VID.pronto || !ehVideo()) return;
    var t = 0; try{ t = VID.p.getCurrentTime() || 0; }catch(e){ return; }
    var bl = T.trilha.blocos, ab = bl[P.bloco], fimBloco = ab.passos[ab.passos.length - 1].fim;
    // terminou o bloco atual tocando normalmente: pausa e abre as questões e o Estudar com IA
    if(P.tocando && t >= fimBloco - 0.25 && t < fimBloco + 2 && !P.fimDoBloco){
      try{ VID.p.pauseVideo(); }catch(e){}
      P.tocando = false; fimDoBloco(); return;
    }
    var nb = P.bloco, np = P.passo;
    for(var i = 0; i < bl.length; i++) for(var k = 0; k < bl[i].passos.length; k++){ var q = bl[i].passos[k]; if(t >= q.inicio && t < q.fim){ nb = i; np = k; } }
    if(nb !== P.bloco || np !== P.passo){ VID.seguindo = true; try{ irPara(nb, np, false); } finally { VID.seguindo = false; } }
  }, 300);
}
function mostrarNota(){
  var box = $('notaProf'); if(!box) return;
  var b = blocoAtual(), p = b.passos[P.passo], k = b.id + ':' + P.passo, n = (T.notas || {})[k] || p.nota || '';
  box.innerHTML = n ? '📌 <b>Nota do professor:</b> ' + esc(n) : '';
  box.classList.toggle('oculto', !n);
  if($('txtNota')){ $('txtNota').value = (T.notas || {})[k] || ''; var mm = function(x){ x = Math.round(x || 0); return Math.floor(x / 60) + ':' + ('0' + x % 60).slice(-2); }; $('rotNota').textContent = 'Trecho ' + mm(p.inicio) + '–' + mm(p.fim) + ' · ' + (p.titulo || b.titulo); }
}
function temNarracaoIA(){ return T && Object.keys(T.narracao || {}).some(function(k){ return T.narracao[k] === 'ok'; }); }
function montarSelVoz(){
  var s = $('selVoz'), ia = temNarracaoIA();
  s.innerHTML = (ia ? '<option value="ia">🔊 voz da IA (gravada)</option>' : '') + '<option value="nav">🔈 voz do navegador</option><option value="mudo">🔇 sem voz (só leitura)</option>';
  var pref = ''; try{ pref = localStorage.getItem('trilha_voz') || ''; }catch(e){}
  s.value = (pref === 'nav' || pref === 'mudo') ? pref : (ia ? 'ia' : 'nav');
  P.modoVoz = s.value;
  s.onchange = function(){ P.modoVoz = s.value; try{ localStorage.setItem('trilha_voz', s.value); }catch(e){} if(P.tocando){ pararSom(); narrar(); } };
}
var redim = null;
window.addEventListener('resize', function(){ clearTimeout(redim); redim = setTimeout(function(){ if(T && $('svg') && !P.tocando) G.desenhar(blocoAtual(), P.passo); }, 250); });
function blocoAtual(){ return T.trilha.blocos[P.bloco]; }
function totalPassos(){ return T.trilha.blocos.reduce(function(s, b){ return s + b.passos.length; }, 0); }
function irPara(bi, pi, continuar){
  limparTimers(); pararSom();
  P.bloco = Math.max(0, Math.min(T.trilha.blocos.length - 1, bi));
  var b = blocoAtual();
  P.passo = Math.max(0, Math.min(b.passos.length - 1, pi));
  P.fimDoBloco = false;
  document.querySelectorAll('[data-trbloco]').forEach(function(c){ c.classList.toggle('t-atual', Number(c.getAttribute('data-trbloco')) === P.bloco); });
  var p = b.passos[P.passo];
  $('titSlide').textContent = p.titulo || b.titulo;
  $('refSlide').textContent = b.titulo + ' · passo ' + (P.passo + 1) + ' de ' + b.passos.length;
  $('passoInfo').textContent = (P.passo + 1) + '/' + b.passos.length;
  $('barra').style.width = ((P.passo + 1) / b.passos.length * 100) + '%';
  $('legenda').textContent = p.fala;
  $('checagem').innerHTML = '';
  // pontos-chave: acumulam até o passo atual
  var html = '';
  b.passos.slice(0, P.passo + 1).forEach(function(q, k){ (q.pontos || []).forEach(function(t){ html += '<li class="' + (k === P.passo ? 't-ativo t-novo' : '') + '">' + esc(t) + '</li>'; }); });
  $('pontos').innerHTML = html || '<li class="aviso">—</li>';
  var ctl0 = document.querySelector('.t-app .t-controles'); if(ctl0) ctl0.style.position = '';
  if(ehVideo()){ mostrarNota(); if(!VID.seguindo && VID.p && VID.pronto) try{ VID.p.seekTo(p.inicio || 0, true); }catch(e){} }
  else G.desenhar(b, P.passo);
  if(P.blocoAssunto !== P.bloco){ P.blocoAssunto = P.bloco; desenharAssunto(); }
  U.visto(b.id + ':' + P.passo);
  mostrarAjuste();
  if(continuar){ if(ehVideo()) tocar(); else narrar(); }
  if(!T.previa && !ehVideo()) preCarregarAudio(1);
}
function avancar(d){
  var b = blocoAtual(), np = P.passo + d, nb = P.bloco, cont = P.tocando;
  if(np >= b.passos.length){ if(nb < T.trilha.blocos.length - 1){ nb++; np = 0; } else { np = b.passos.length - 1; } }
  if(np < 0){ if(nb > 0){ nb--; np = T.trilha.blocos[nb].passos.length - 1; } else np = 0; }
  irPara(nb, np, cont);
}
var AUD = null;
function liberarSom(){
  try{ if(!AUD){ AUD = new Audio(); AUD.setAttribute('playsinline', ''); AUD.src = 'data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; AUD.play().catch(function(){}); } }catch(e){}
  try{ if('speechSynthesis' in window && !P.vozLiberada){ P.vozLiberada = true; var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } }catch(e){}
}
function tocar(){
  if(ehVideo()){ P.tocando = true; $('btPlay').textContent = '⏸ Pausar'; if(VID.p && VID.pronto) try{ VID.p.playVideo(); }catch(e){} return; }
  liberarSom(); P.tocando = true; $('btPlay').textContent = '⏸ Pausar'; G.desenhar(blocoAtual(), P.passo); narrar(); }
function pausar(){ if(ehVideo() && VID.p && VID.pronto) try{ VID.p.pauseVideo(); }catch(e){} P.tocando = false; $('btPlay').textContent = '▶ Continuar'; limparTimers(); pararSom(); }
function limparTimers(){ P.timers.forEach(clearTimeout); P.timers = []; }
function pararSom(){
  try{ speechSynthesis.cancel(); }catch(e){}
  if(P.aud){ try{ P.aud.onended = null; P.aud.onerror = null; P.aud.pause(); }catch(e){} P.aud = null; }
}
function pararTudo(){ limparTimers(); pararSom(); P.tocando = false; pararVideo(); pararCena(); if(typeof encerrarDuvida === 'function' && wsD) encerrarDuvida(); }
// narra o passo atual e, no fim (e depois das animações), segue para o próximo
function narrar(){
  if(ehVideo()) return;
  limparTimers(); pararSom();
  var b = blocoAtual(), p = b.passos[P.passo], chave = b.id + ':' + P.passo, inicio = Date.now();
  var seguir = function(){
    if(!P.tocando) return;
    var falta = Math.max(0, G.fimAcoes - Date.now());
    P.timers.push(setTimeout(function(){
      if(!P.tocando) return;
      if(P.passo < b.passos.length - 1) irPara(P.bloco, P.passo + 1, true);
      else fimDoBloco();
    }, falta + 900));
  };
  var tempoLeitura = Math.max(4000, p.fala.length * 62 / P.vel);
  $('avisoVoz').classList.add('oculto');
  if(P.modoVoz === 'mudo'){ P.timers.push(setTimeout(seguir, tempoLeitura)); return; }
  if(P.modoVoz === 'ia' && T.narracao[chave] === 'ok'){
    pegarAudio(chave).then(function(url){
      if(!P.tocando || blocoAtual() !== b || b.passos[P.passo] !== p) return;
      var a = AUD || new Audio(); a.src = url; a.playbackRate = P.vel; P.aud = a;
      a.onended = seguir; a.onerror = function(){ falarNavegador(p.fala, seguir, tempoLeitura); };
      a.play().catch(function(){ falarNavegador(p.fala, seguir, tempoLeitura); });
    }).catch(function(){ falarNavegador(p.fala, seguir, tempoLeitura); });
    return;
  }
  falarNavegador(p.fala, seguir, tempoLeitura);
}
function melhorVozNavegador(){
  try{
    var v = speechSynthesis.getVoices().filter(function(x){ return /^pt(-|_)?BR/i.test(x.lang) || /portugu[eê]s.*brasil/i.test(x.name); });
    if(!v.length) v = speechSynthesis.getVoices().filter(function(x){ return /^pt/i.test(x.lang); });
    v.sort(function(a, b){ var n = function(x){ return (/natural|online|neural/i.test(x.name) ? 4 : 0) + (/google/i.test(x.name) ? 2 : 0) + (x.localService ? 0 : 1); }; return n(b) - n(a); });
    return v[0] || null;
  }catch(e){ return null; }
}
function falarNavegador(texto, seguir, tempoLeitura){
  if(!('speechSynthesis' in window)){ P.timers.push(setTimeout(seguir, tempoLeitura)); return; }
  var andou = false, comecou = false;
  var proximo = function(ms){ if(andou) return; andou = true; P.timers.push(setTimeout(seguir, ms)); };
  try{
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texto); u.lang = 'pt-BR'; u.rate = 1.0 * P.vel;
    var v = melhorVozNavegador(); if(v) u.voice = v;
    u.onstart = function(){ comecou = true; };
    u.onend = function(){ proximo(200); };
    u.onerror = function(){ proximo(tempoLeitura); };
    speechSynthesis.speak(u);
    // se a voz do navegador não começar em 1,5 s (alguns navegadores ficam mudos), a aula segue no tempo de leitura
    P.timers.push(setTimeout(function(){ if(!comecou){ $('avisoVoz').textContent = 'A voz do navegador não respondeu: a aula segue no tempo de leitura.'; $('avisoVoz').classList.remove('oculto'); proximo(tempoLeitura - 1500); } }, 1500));
  }catch(e){ proximo(tempoLeitura); }
}
function pegarAudio(chave){
  if(P.cacheAud[chave]) return P.cacheAud[chave];
  P.cacheAud[chave] = api('trilhaAudio', {id: T.id, chave: chave}).then(function(r){
    if(!r.b64) throw new Error('sem áudio');
    return URL.createObjectURL(new Blob([bytesDeB64(r.b64)], {type: 'audio/wav'}));
  });
  P.cacheAud[chave].catch(function(){ delete P.cacheAud[chave]; });
  return P.cacheAud[chave];
}
function preCarregarAudio(n){
  if(P.modoVoz !== 'ia') return;
  var b = blocoAtual();
  for(var i = 1; i <= n; i++){ var k = b.id + ':' + (P.passo + i); if(T.narracao[k] === 'ok') pegarAudio(k); }
}
// fim do bloco: 1) vídeo-aula (feito) 2) questões 3) Estudar com IA
function temaDoBloco(b){ var a = (T.temasBlocos || []).filter(function(x){ return x.bloco === b.id; })[0]; return a && a.id ? a : null; }
function fimDoBloco(){
  P.tocando = false; P.fimDoBloco = true; $('btPlay').textContent = '↻ Rever o bloco';
  var ctlF = document.querySelector('.t-app .t-controles'); if(ctlF) ctlF.style.position = 'static';   // nas questões a barra não fica presa no topo
  var b = blocoAtual(), c = b.checagem, ultimo = P.bloco >= T.trilha.blocos.length - 1, ass = assuntoDoBloco(b), tem = temaDoBloco(b);
  var passo = function(n, txt, feito){ return '<span style="display:inline-flex;align-items:center;gap:6px;margin-right:14px;font-weight:bold;color:' + (feito ? '#1a7a3c' : 'var(--navy)') + '"><span class="t-passoNum" style="background:' + (feito ? '#1a7a3c' : '') + '">' + (feito ? '✓' : n) + '</span>' + txt + '</span>'; };
  var h = '<div class="t-checagem"><div style="margin-bottom:10px">' + passo(1, 'Vídeo-aula', true) + passo(2, 'Questões') + (ass ? passo(3, 'Estudar com IA') : '') + '</div>';
  h += '<p style="margin:0 0 6px"><b>2 · Questões</b></p>';
  if(c && c.tipo === 'multipla'){
    h += '<p style="margin:4px 0"><b>✔ Confira se entendeu</b></p><p>' + esc(c.pergunta) + '</p>' + c.alternativas.map(function(a, i){ return '<button class="t-op" data-trop="' + i + '">' + esc(a) + '</button>'; }).join('') + '<div id="tr_retCheck"></div>';
  } else if(c && c.tipo === 'aberta'){
    h += '<p style="margin:4px 0"><b>✔ Pense nisto</b></p><p>' + esc(c.pergunta) + '</p><details><summary class="link">ver o que uma boa resposta contém</summary><p>' + esc(c.esperado) + '</p></details>';
  }
  if(tem && T.professorId && T.disciplina_id) h += '<div id="tr_questBox" class="convite" style="margin-top:12px"><b>📝 Questão aberta · ' + esc(tem.nome) + '</b><p class="aviso" style="margin:4px 0 0">Uma questão do estudo dirigido sobre o assunto do vídeo, com correção comentada. Não vale nota: é treino para a prova.</p><div class="botoes"><button class="mini" id="tr_btQuest">✍ Responder uma questão</button></div></div>';
  if(ass) h += '<p style="margin:16px 0 6px"><b>3 · Estudar com IA</b></p><div class="convite" id="tr_avalBox"><b>🎤 Agora explique com as suas palavras</b><p class="aviso" style="margin:4px 0 0">É a avaliação de profundidade do <b>Estudar com IA</b> sobre "' + esc(ass.nome) + '": você fala, ela conversa com você e dá a nota e o parecer. Fica guardada no seu histórico do Estudar com IA.</p><div class="botoes"><button class="mini" id="tr_btAvaliar">🎤 Fazer a avaliação</button></div></div>';
  h += '<div class="botoes">' + (ultimo ? '<span class="ok" style="margin:0">🎉 Você chegou ao fim desta aula em trilha. Marque ✓ Já estudei aqui embaixo.</span>' : '<button id="tr_btProxBloco">Próximo bloco →</button>') + '</div></div>';
  $('checagem').innerHTML = h;
  document.querySelectorAll('[data-trop]').forEach(function(bt){ bt.addEventListener('click', function(){
    var i = Number(bt.getAttribute('data-trop')), certo = i === c.correta;
    document.querySelectorAll('[data-trop]').forEach(function(x){ x.classList.remove('t-certa', 't-errada'); });
    bt.classList.add(certo ? 't-certa' : 't-errada');
    $('retCheck').innerHTML = '<div class="' + (certo ? 'ok' : 'erro') + '">' + (certo ? '✓ ' : '✗ ') + esc(certo ? (c.explicacao || 'Isso!') : 'Ainda não. Tente de novo ou reveja o bloco.') + '</div>';
    U.checagem(b.id, certo);
  }); });
  if($('btProxBloco')) $('btProxBloco').addEventListener('click', function(){ irPara(P.bloco + 1, 0, false); tocar(); });
  if($('btAvaliar')) $('btAvaliar').addEventListener('click', function(){ abrirAvaliacao(ass); });
  if($('btQuest')) $('btQuest').addEventListener('click', function(){ pedirQuestaoTrilha(tem.id); });
  $('checagem').scrollIntoView({behavior: 'smooth', block: 'nearest'});
}
// questões do estudo dirigido dentro da trilha (mesmo banco, mesma correção e mesmo limite do dia)
var QT = {q: null, r: null, tema: ''};
function notaDez(n){ return typeof window.dezEst === 'function' ? window.dezEst(n) : (n === null || n === undefined ? '—' : (Math.round(n) / 10).toFixed(1).replace('.', ',')); }
function pedirQuestaoTrilha(temaId){
  var box = $('questBox'); if(!box) return;
  pausar(); QT.tema = temaId;
  box.innerHTML = '<p class="aviso">Preparando a questão… (a primeira do assunto pode levar uns 20 segundos)</p>';
  api('estudoProxima', {professorId: T.professorId, disciplinaId: T.disciplina_id, temaId: temaId, daTrilha: !!temaId}).then(function(q){ QT.q = q; QT.r = null; desenharQuestaoTrilha(''); })
    .catch(function(e){ box.innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
}
function desenharQuestaoTrilha(rascunho){
  var box = $('questBox'), q = QT.q, u = QT.r;
  box.innerHTML = '<p style="margin:0 0 6px"><span class="t-tag">' + esc(q.tema) + '</span>' + (q.naProva && q.prova ? ' <span class="aviso">· cai na ' + esc(q.prova) + '</span>' : '') + '</p>' +
    '<p style="font-weight:bold;font-size:16px;margin:4px 0">' + esc(q.enunciado) + '</p>' +
    (u ? '<p class="aviso" style="margin:0 0 6px">Tentativa ' + (u.tentativa + 1) + ' · sua melhor nota até agora: <b>' + notaDez(Math.max(u.nota, u.melhorAntes || 0)) + '</b>.</p>' : '') +
    '<label style="display:flex;gap:8px;align-items:center;cursor:pointer;font-size:14.5px;margin:6px 0"><input type="checkbox" id="tr_qtAjuda" style="width:18px;height:18px"> 💡 Quero ajuda para montar a resposta</label>' +
    '<div class="oculto" id="tr_qtAjudaBox" style="background:#fff;border-left:4px solid #B8890A;padding:8px 10px;margin:6px 0;font-size:14px"><b>Sua resposta deve passar por:</b>' + (q.ajuda || []).map(function(t){ return '<br>• ' + esc(t); }).join('') + '</div>' +
    '<textarea id="tr_qtResp" placeholder="Escreva sua resposta com suas palavras…" style="min-height:130px;font-family:inherit;font-size:15px">' + esc(rascunho || '') + '</textarea>' +
    '<div class="botoes"><button class="mini" id="tr_qtEnviar">Enviar resposta</button><button class="mini secundario" id="tr_qtPular">Outra questão</button></div><div id="tr_qtMsg"></div>';
  var ta = $('qtResp');
  var barrar = function(e){ e.preventDefault(); $('qtMsg').innerHTML = '<div class="erro">Escreva a resposta com suas palavras.</div>'; };
  ta.addEventListener('paste', barrar); ta.addEventListener('drop', barrar);
  ta.addEventListener('beforeinput', function(e){ if(/^insertFrom(Paste|Drop)/.test(e.inputType || '')) barrar(e); });
  $('qtAjuda').addEventListener('change', function(){ $('qtAjudaBox').classList.toggle('oculto', !this.checked); });
  $('qtPular').addEventListener('click', function(){ pedirQuestaoTrilha(QT.tema); });
  $('qtEnviar').addEventListener('click', function(){
    var txt = ta.value.trim();
    if(txt.length < 10){ $('qtMsg').innerHTML = '<div class="erro">Escreva sua resposta antes de enviar.</div>'; return; }
    var bt = this; bt.disabled = true; $('qtMsg').innerHTML = '<p class="aviso">Corrigindo… (uns 10 a 20 segundos)</p>';
    var tentar = function(n){
      api('estudoResponder', {professorId: T.professorId, disciplinaId: T.disciplina_id, questaoId: q.id, resposta: txt, usouAjuda: $('qtAjuda').checked})
        .then(function(r){ QT.r = r; desenharCorrecaoTrilha(txt); })
        .catch(function(e){
          if(/ocupada/i.test(e.message) && n < 2){ $('qtMsg').innerHTML = '<p class="aviso">A IA está ocupada agora. Tento de novo sozinho em 40 segundos; sua resposta está guardada aqui.</p>'; setTimeout(function(){ if($('qtMsg')) tentar(n + 1); }, 40000); return; }
          bt.disabled = false; $('qtMsg').innerHTML = '<div class="erro">' + esc(e.message) + '</div>';
        });
    };
    tentar(0);
  });
}
function desenharCorrecaoTrilha(txt){
  var box = $('questBox'), q = QT.q, r = QT.r;
  var cor = r.nota >= 70 ? '#1a7a3c' : r.nota >= 50 ? '#b07d00' : '#c62828', subiu = r.melhorAntes !== null && r.melhorAntes !== undefined && r.nota > r.melhorAntes;
  var eixo = function(c, t, x){ return '<div style="background:#fff;border-left:4px solid ' + c + ';padding:7px 10px;margin:8px 0;font-size:14px"><b>' + t + '</b><br>' + esc(x || '') + '</div>'; };
  var f = r.feedback || {};
  box.innerHTML = '<p style="margin:0 0 6px"><span class="t-tag">' + esc(q.tema) + '</span></p><p style="font-weight:bold;margin:4px 0">' + esc(q.enunciado) + '</p>' +
    '<details style="margin:0 0 8px"><summary class="link" style="font-size:13px">ver a sua resposta</summary><p class="aviso" style="white-space:pre-line;margin:6px 0 0">' + esc(txt) + '</p></details>' +
    '<div style="display:flex;gap:16px;align-items:baseline;flex-wrap:wrap"><div><span class="aviso">sua nota</span><div style="font-size:26px;font-weight:bold;color:' + cor + '">' + notaDez(r.nota) + '</div></div>' +
    '<span class="aviso">tentativa ' + r.tentativa + (subiu ? ' · <b style="color:#1a7a3c">subiu de ' + notaDez(r.melhorAntes) + ' para ' + notaDez(r.nota) + '! 🎉</b>' : '') + ' · não vale nota</span></div>' +
    eixo('#1a7a3c', '✅ O que você acertou', f.acertos) + eixo('#c62828', '🔬 Conteúdo técnico', f.conteudo) + eixo('#2E62C6', '🧩 Estrutura da resposta', f.estrutura) + eixo('#8a6100', '🧠 Forma de pensar', f.pensamento) +
    (typeof window.htmlModelo === 'function' ? window.htmlModelo(r.modelo) : '') +
    '<div class="botoes"><button class="mini" id="tr_qtDeNovo">✍ Explicar de novo</button><button class="mini secundario" id="tr_qtProx"' + (r.restantesHoje ? '' : ' disabled') + '>Outra questão deste assunto</button>' +
    (T.questoesProva ? '<button class="mini secundario" id="tr_qtProva"' + (r.restantesHoje ? '' : ' disabled') + '>🎯 Questão de um assunto da prova</button>' : '') + '</div>' +
    '<p class="aviso">' + (r.restantesHoje ? 'Hoje você ainda pode fazer ' + r.restantesHoje + ' correção(ões).' : 'Você usou as correções de hoje. Volte amanhã!') + '</p>';
  $('qtDeNovo').addEventListener('click', function(){ desenharQuestaoTrilha(''); });
  $('qtProx').addEventListener('click', function(){ pedirQuestaoTrilha(QT.tema); });
  if($('qtProva')) $('qtProva').addEventListener('click', function(){ pedirQuestaoTrilha(''); });
  box.scrollIntoView({behavior: 'smooth', block: 'start'});
}

/* ===================== CENA (moléculas animadas) =====================
   Motor escrito pelo Claude na prévia da aula de água: bloco.cena = {elementos}, passo.cena_acoes = [...].
   Coordenadas: x de 0 a 100, y de 0 a 60. Só lê dados (o servidor já filtrou tipos e números). */
var Cena = (function () {
  const NS = "http://www.w3.org/2000/svg";
  const PAL_ESCURO = {
    fundo: "#262626", agua: "#7cc4ff", gelo: "#dff4ff", geloBorda: "#dff4ff", H: "#ffffff", Hb: "none", ligacao: "#dff4ff",
    ion: "#f2b84b", ionMenos: "#b9a5ff", acucar: "#ff9fc7", particula: "#e9826f",
    gordura: "#f5d76e", bacteria: "#7ddc9a", bactBorda: "#3f8f5c", bactSeca: "#5fae7a", bactDano: "#6a3b3b",
    caixa: "#e8e2d0", caixaFundo: "#ffffff12", estrutura: "#f2c79b", cadeia: "#e6c27a", o2: "#ff8a8a",
    giz: "#f4f1e8", dano: "#ff6b6b",
    azul: "#7cc4ff", laranja: "#ffb070", verde: "#8fe3b0", vermelho: "#ff8a8a",
    roxo: "#c7a6ff", cinza: "#bdbdbd", ambar: "#ffd479", rosa: "#ff9fc7"
  };
  const PAL_CLARO = {
    fundo: "#ffffff", agua: "#2b7fd4", gelo: "#cfe8fa", geloBorda: "#2b7fd4", H: "#ffffff", Hb: "#5d6b78", ligacao: "#2b7fd4",
    ion: "#f0a91e", ionMenos: "#8b6be0", acucar: "#d6337a", particula: "#c9472f",
    gordura: "#d9a90f", bacteria: "#3fb46a", bactBorda: "#1f7a42", bactSeca: "#2d8a50", bactDano: "#8a3a3a",
    caixa: "#6b6a64", caixaFundo: "#0000000a", estrutura: "#b8742d", cadeia: "#a8741a", o2: "#d62828",
    giz: "#1d1d1b", dano: "#d62828",
    azul: "#1f6fd1", laranja: "#d9650b", verde: "#1a8a47", vermelho: "#d62828",
    roxo: "#6b3fd1", cinza: "#6b6a64", ambar: "#a86f00", rosa: "#d6337a"
  };
  const RAIO = { agua: 1.35, ion: 2.6, acucar: 2.9, particula: 1.7, gordura: 3.0, bacteria: 4.8, cadeia: 5.2, o2: 1.6 };
  const SOLUTO = { ion: 1, acucar: 1, particula: 1, gordura: 1, bacteria: 1, cadeia: 1 };
  const S = 4.4; // espaçamento da rede de gelo

  function mk(tag, at, par) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (par) par.appendChild(e); return e; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function dist(a, b, c, d) { return Math.hypot(a - c, b - d); }

  function criar(raiz, def, opt) {
    const PAL = opt.tema === "claro" ? PAL_CLARO : PAL_ESCURO;
    def = def || { elementos: [] };
    const K = opt.largura / 100, X0 = opt.x, Y0 = opt.y;
    const root = mk("g", { transform: `translate(${X0},${Y0}) scale(${K})` }, raiz);
    const L = {
      halo: mk("g", {}, root), pontes: mk("g", {}, root), bonds: mk("g", {}, root),
      parts: mk("g", {}, root), els: mk("g", {}, root), ann: mk("g", {}, root)
    };
    let parts = [], els = {}, timers = [], procs = [], sites = new Set(), discos = [], pontes = [], raf = 0, last = 0, frame = 0;

    /* ---------- elementos declarados ---------- */
    function construirEl(d) {
      const g = mk("g", { opacity: 0 }, L.els);
      const e = { def: d, g, x: d.x, y: d.y, esc: 1, vis: false, dano: false, tipo: d.tipo };
      desenharEl(e);
      els[d.id] = e; posEl(e);
      return e;
    }
    function desenharEl(e) {
      const d = e.def, g = e.g; g.innerHTML = "";
      const t = d.tipo, tam = d.tamanho || 1;
      if (t === "agua") { desenharAgua(g, -90, false, tam); }
      else if (t === "ion") {
        const neg = /−|-/.test(d.rotulo || "");
        mk("circle", { r: RAIO.ion * tam, fill: neg ? PAL.ionMenos : PAL.ion, stroke: "#00000040", "stroke-width": .3 }, g);
        const tx = mk("text", { "text-anchor": "middle", y: 1.1 * tam, "font-size": 2.8 * tam, "font-weight": 700, fill: "#2b2b2b", "font-family": "system-ui,sans-serif" }, g);
        tx.textContent = d.rotulo || "+";
      }
      else if (t === "acucar") { hexagono(g, RAIO.acucar * tam, PAL.acucar); if (d.rotulo) rot(g, 0, RAIO.acucar * tam + 4, d.rotulo, 3.4); }
      else if (t === "particula") { mk("circle", { r: RAIO.particula * tam, fill: PAL.particula }, g); }
      else if (t === "cadeia") {
        const n = d.unidades || 4, cor = PAL[d.cor] || PAL.cadeia, r = 1.25 * tam, dx = 2.3 * tam;
        let pth = ""; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * dx, y = (i % 2 ? .9 : -.9) * tam; pth += (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2); }
        mk("path", { d: pth, stroke: cor, "stroke-width": .5, fill: "none" }, g);
        for (let i = 0; i < n; i++) { const gg = mk("g", { transform: `translate(${((i - (n - 1) / 2) * dx).toFixed(2)},${((i % 2 ? .9 : -.9) * tam).toFixed(2)})` }, g); hexagono(gg, r, cor); }
        if (d.rotulo) rot(g, 0, 4.6 * tam, d.rotulo, 3.3);
      }
      else if (t === "rede") {
        const w = d.w || 30, h = d.h || 24, cor = PAL[d.cor] || PAL.cadeia;
        mk("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 2, fill: cor + "10", stroke: "none" }, g);
        let pth = "";
        for (let k = 0; k < 5; k++) { const y = -h / 2 + h * (k + .5) / 5; pth += `M${-w / 2},${y.toFixed(1)}`; for (let x = -w / 2; x <= w / 2; x += 3) pth += `L${x.toFixed(1)},${(y + Math.sin(x * .6 + k) * 1.4).toFixed(1)}`; }
        for (let k = 0; k < 6; k++) { const x = -w / 2 + w * (k + .5) / 6; pth += `M${x.toFixed(1)},${-h / 2}`; for (let y = -h / 2; y <= h / 2; y += 3) pth += `L${(x + Math.sin(y * .7 + k) * 1.3).toFixed(1)},${y.toFixed(1)}`; }
        mk("path", { d: pth, stroke: cor, "stroke-width": .45, fill: "none", "stroke-opacity": .8 }, g);
        if (d.rotulo) rot(g, 0, -h / 2 - 1.8, d.rotulo, 3.4);
      }
      else if (t === "gordura") { mk("circle", { r: RAIO.gordura * tam, fill: PAL.gordura, opacity: .9 }, g); }
      else if (t === "bacteria") {
        const w = 10 * tam, h = 5.4 * tam;
        e.corpo = mk("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: e.dano ? PAL.bactDano : PAL.bacteria, stroke: e.dano ? PAL.dano : PAL.bactBorda, "stroke-width": .5 }, g);
        if (e.dano) mk("path", { d: `M${-w / 4},${-h / 2} l1.4,2 l-1.6,1.4 l1.8,2`, stroke: PAL.dano, "stroke-width": .6, fill: "none" }, g);
        if (d.rotulo) rot(g, 0, h / 2 + 3.6, d.rotulo, 3.2);
      }
      else if (t === "caixa" || t === "estrutura") {
        const w = d.w || 20, h = d.h || 14;
        const est = t === "estrutura";
        mk("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: est ? 3 : 1.2, fill: est ? PAL.estrutura + "14" : PAL.caixaFundo, stroke: e.dano ? PAL.dano : (est ? PAL.estrutura : PAL.caixa), "stroke-width": .55, "stroke-dasharray": e.dano ? "2.2 1.6" : "none" }, g);
        if (e.dano) for (let i = 0; i < 4; i++) { const px = rnd(-w / 2.4, w / 2.4), py = (i % 2 ? -1 : 1) * h / 2; mk("path", { d: `M${px},${py} l${rnd(-1.5, 1.5)},${-Math.sign(py) * 2} l${rnd(-1.5, 1.5)},${-Math.sign(py) * 1.8}`, stroke: PAL.dano, "stroke-width": .5, fill: "none" }, g); }
        if (d.rotulo) rot(g, 0, est ? -h / 2 - 1.8 : h / 2 - 1.8, d.rotulo, 3.3);
      }
    }
    function hexagono(g, r, cor) {
      let p = ""; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; p += (i ? "L" : "M") + (r * Math.cos(a)).toFixed(2) + "," + (r * Math.sin(a)).toFixed(2); }
      mk("path", { d: p + "Z", fill: cor + "33", stroke: cor, "stroke-width": .55 }, g);
    }
    function rot(g, x, y, txt, fs, cor) {
      const t = mk("text", { x, y, "text-anchor": "middle", "font-size": fs || 3.6, fill: cor || PAL.giz, "font-family": "Caveat, 'Patrick Hand', cursive", stroke: PAL.fundo, "stroke-width": .9, "paint-order": "stroke", "stroke-linejoin": "round" }, g);
      t.textContent = txt; return t;
    }
    function posEl(e) { e.g.setAttribute("transform", `translate(${e.x.toFixed(2)},${e.y.toFixed(2)}) scale(${e.esc})`); }
    function raioEl(e) { const t = e.tipo, tam = e.def.tamanho || 1; if (t === "cadeia") return ((e.def.unidades || 4) * 2.3 * tam) / 2 + .6; return (RAIO[t] || 3) * tam * e.esc; }

    /* ---------- moléculas (partículas) ---------- */
    function desenharAgua(g, ang, gelo, tam) {
      tam = tam || 1;
      const o = mk("circle", { r: RAIO.agua * tam, fill: gelo ? PAL.gelo : PAL.agua }, g);
      const hs = [];
      [-52, 52].forEach(da => { const a = (ang + da) * Math.PI / 180; hs.push(mk("circle", { cx: Math.cos(a) * 1.55 * tam, cy: Math.sin(a) * 1.55 * tam, r: .62 * tam, fill: PAL.H, stroke: PAL.Hb, "stroke-width": .22 }, g)); });
      return { o, hs };
    }
    function novaParte(tipo, x, y, op) {
      op = op || {};
      const g = mk("g", { opacity: 0 }, L.parts);
      const p = { tipo, x, y, vx: 0, vy: 0, modo: "livre", casa: null, lim: op.lim || { t: "r", x1: 1, y1: 1, x2: 99, y2: 59 }, agit: op.agit == null ? .6 : op.agit, g, alfa: 0, alvoAlfa: 1, ang: op.ang == null ? rnd(0, 360) : op.ang, grupo: op.grupo || "w", gelo: false, id: Math.random() };
      if (tipo === "agua") p.vis = desenharAgua(g, p.ang, false);
      else if (tipo === "ion") mk("circle", { r: 1.9, fill: PAL.ion }, g);
      else if (tipo === "acucar") hexagono(g, 2.2, PAL.acucar);
      else if (tipo === "gordura") mk("circle", { r: 2.4, fill: PAL.gordura }, g);
      else if (tipo === "o2") { mk("circle", { cx: -.8, r: 1, fill: PAL.o2 }, g); mk("circle", { cx: .8, r: 1, fill: PAL.o2 }, g); }
      else mk("circle", { r: RAIO.particula, fill: PAL.particula }, g);
      parts.push(p); return p;
    }
    function setGelo(p, v) {
      if (p.tipo !== "agua" || p.gelo === v) return; p.gelo = v;
      p.vis.o.setAttribute("fill", v ? PAL.gelo : PAL.agua); p.vis.o.setAttribute("stroke", v ? PAL.geloBorda : "none"); p.vis.o.setAttribute("stroke-width", v ? .3 : 0);
    }
    function orient(p, ang) {
      if (p.tipo !== "agua") return; p.ang = ang;
      const a1 = (ang - 52) * Math.PI / 180, a2 = (ang + 52) * Math.PI / 180;
      p.vis.hs[0].setAttribute("cx", Math.cos(a1) * 1.55); p.vis.hs[0].setAttribute("cy", Math.sin(a1) * 1.55);
      p.vis.hs[1].setAttribute("cx", Math.cos(a2) * 1.55); p.vis.hs[1].setAttribute("cy", Math.sin(a2) * 1.55);
    }
    function remover(p) { p.alvoAlfa = 0; p.morrer = true; }
    function livres(grupo, cond) { return parts.filter(p => p.tipo === "agua" && p.modo === "livre" && !p.morrer && !p.reserva && (!grupo || p.grupo === grupo || grupo === "*") && (!cond || cond(p))); }
    function maisProxima(lista, x, y) { let b = null, bd = 1e9; for (const p of lista) { const d = dist(p.x, p.y, x, y); if (d < bd) { bd = d; b = p; } } return b; }
    function solutos(area) {
      const out = [];
      for (const id in els) { const e = els[id]; if (e.vis && SOLUTO[e.tipo] && (!area || dentro(area, e.x, e.y))) out.push({ x: e.x, y: e.y, r: raioEl(e), el: e }); }
      for (const p of parts) if (p.tipo !== "agua" && !p.morrer && (!area || dentro(area, p.x, p.y))) out.push({ x: p.x, y: p.y, r: RAIO[p.tipo] || 1.8, p });
      return out;
    }
    function dentro(a, x, y) { return x >= a[0] && x <= a[2] && y >= a[1] && y <= a[3]; }
    function areaDe(a) {
      if (a.dentro && els[a.dentro]) { const e = els[a.dentro], w = (e.def.w || 20) / 2 - 1.8, h = (e.def.h || 14) / 2 - 1.8; return [e.x - w, e.y - h, e.x + w, e.y + h]; }
      return a.area || [2, 2, 98, 58];
    }

    /* ---------- laço de animação ---------- */
    function tick(t) {
      const dt = Math.min(.05, (t - (last || t)) / 1000); last = t; frame++;
      procs = procs.filter(fn => fn(t) !== false);
      const obst = Object.values(els).filter(e => e.vis && e.tipo === "caixa");
      for (const p of parts) {
        if (p.modo === "livre") {
          const a = p.agit * 38;
          p.vx += (Math.random() - .5) * a * dt * 6; p.vy += (Math.random() - .5) * a * dt * 6;
          const damp = Math.pow(.18, dt); p.vx *= damp; p.vy *= damp;
          const vmax = 3 + p.agit * 9; const v = Math.hypot(p.vx, p.vy); if (v > vmax) { p.vx *= vmax / v; p.vy *= vmax / v; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          const l = p.lim;
          if (l.t === "r") { if (p.x < l.x1) { p.x = l.x1; p.vx = Math.abs(p.vx); } if (p.x > l.x2) { p.x = l.x2; p.vx = -Math.abs(p.vx); } if (p.y < l.y1) { p.y = l.y1; p.vy = Math.abs(p.vy); } if (p.y > l.y2) { p.y = l.y2; p.vy = -Math.abs(p.vy); } }
          else { const d = dist(p.x, p.y, l.cx, l.cy); if (d > l.r) { p.x = l.cx + (p.x - l.cx) * l.r / d; p.y = l.cy + (p.y - l.cy) * l.r / d; p.vx *= -.5; p.vy *= -.5; } }
          if (l.t === "r") {
            for (const dk of discos) { const d = dist(p.x, p.y, dk.cx, dk.cy); if (d < dk.r && d > .01) { p.x = dk.cx + (p.x - dk.cx) * dk.r / d; p.y = dk.cy + (p.y - dk.cy) * dk.r / d; } }
            for (const e of obst) { const w = (e.def.w || 20) / 2 + 1.4, h = (e.def.h || 14) / 2 + 1.4; if (Math.abs(p.x - e.x) < w && Math.abs(p.y - e.y) < h) { const dx = w - Math.abs(p.x - e.x), dy = h - Math.abs(p.y - e.y); if (dx < dy) p.x = e.x + Math.sign(p.x - e.x || 1) * w; else p.y = e.y + Math.sign(p.y - e.y || 1) * h; } }
          }
          if (p.tipo === "agua" && frame % 3 === 0) orient(p, p.ang + (Math.random() - .5) * 30 * p.agit);
        } else if (p.casa) {
          const vel = p.modo === "indo" ? 2.2 : 7;
          const k = 1 - Math.exp(-vel * dt);
          p.x += (p.casa.x - p.x) * k; p.y += (p.casa.y - p.y) * k;
          if (p.modo === "indo" && dist(p.x, p.y, p.casa.x, p.casa.y) < .35) { p.modo = p.modoFinal || "preso"; if (p.modo === "gelo") { setGelo(p, true); orient(p, -90); } if (p.modo === "livre") { p.casa = null; continue; } }
          const j = p.modo === "gelo" ? .05 : .22;
          p.jx = (Math.random() - .5) * j; p.jy = (Math.random() - .5) * j;
        }
        if (p.alfa !== p.alvoAlfa) { p.alfa += Math.sign(p.alvoAlfa - p.alfa) * Math.min(Math.abs(p.alvoAlfa - p.alfa), dt * 2.2); p.g.setAttribute("opacity", p.alfa.toFixed(2)); }
        p.g.setAttribute("transform", `translate(${(p.x + (p.jx || 0)).toFixed(2)},${(p.y + (p.jy || 0)).toFixed(2)})`);
      }
      const mortos = parts.filter(p => p.morrer && p.alfa <= 0); if (mortos.length) { mortos.forEach(p => p.g.remove()); parts = parts.filter(p => !(p.morrer && p.alfa <= 0)); }
      if (frame % 6 === 0) ligacoesGelo();
      desenharPontes();
      raf = requestAnimationFrame(tick);
    }
    function ligacoesGelo() {
      const gs = parts.filter(p => p.modo === "gelo" && !p.morrer);
      let d = "";
      for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) {
        const a = gs[i], b = gs[j]; if (Math.abs(a.x - b.x) > S * 1.2 || Math.abs(a.y - b.y) > S * 1.2) continue;
        if (dist(a.x, a.y, b.x, b.y) < S * 1.12) d += `M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
      }
      L.bonds.innerHTML = d ? `<path d="${d}" stroke="${PAL.ligacao}" stroke-opacity=".35" stroke-width=".35" fill="none" stroke-dasharray=".8 .6"/>` : "";
    }
    function desenharPontes() {
      if (!pontes.length) { if (L.pontes.childNodes.length) L.pontes.innerHTML = ""; return; }
      let d = ""; for (const pr of pontes) { const a = pr.a, b = pr.b; if (b.alfa < .3) continue; d += `M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`; }
      L.pontes.innerHTML = `<path d="${d}" stroke="${PAL.ambar}" stroke-width=".45" stroke-dasharray="1 .8" fill="none"/>`;
    }
    function iniciar() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

    /* ---------- tween genérico ---------- */
    function tween(dur, fn, anim) {
      if (!anim || !dur) { fn(1); return; }
      const t0 = performance.now();
      procs.push(t => { const k = Math.min(1, (t - t0) / dur); fn(k < 1 ? (1 - Math.cos(k * Math.PI)) / 2 : 1); return k < 1; });
    }
    function fade(node, anim) { if (!anim) { node.setAttribute("opacity", 1); return; } node.setAttribute("opacity", 0); tween(700, k => node.setAttribute("opacity", k), true); }

    /* ---------- AÇÕES ---------- */
    const A = {};
    A.aparecer = (a, an) => { const e = els[a.elemento]; if (!e) return; e.vis = true; fade(e.g, an); };
    A.sumir = (a, an) => { const e = els[a.elemento]; if (!e) return; e.vis = false; tween(an ? 600 : 0, k => e.g.setAttribute("opacity", 1 - k), an); };
    A.mover = (a, an) => { const e = els[a.elemento]; if (!e) return; const x0 = e.x, y0 = e.y; if (!e.vis) { e.vis = true; e.g.setAttribute("opacity", 1); } tween(an ? (a.duracao || 1500) : 0, k => { e.x = x0 + (a.para[0] - x0) * k; e.y = y0 + (a.para[1] - y0) * k; posEl(e); }, an); };
    A.destacar = (a, an) => { const e = els[a.elemento]; if (!e || !an) return; tween(1600, k => { e.esc = 1 + .35 * Math.sin(k * Math.PI * 2) * (1 - k); posEl(e); }, true); };
    A.danificar = (a, an) => { const e = els[a.alvo || a.elemento]; if (!e) return; e.dano = true; const op = e.g.getAttribute("opacity"); desenharEl(e); e.g.setAttribute("opacity", op); if (an) A.destacar({ elemento: e.def.id }, true); if (a.rotulo) A.rotulo({ x: e.x, y: e.y - raioEl(e) - 4, texto: a.rotulo, cor: "vermelho" }, an); };

    A.aguas = (a, an) => {
      const ar = areaDe(a);
      for (let i = 0; i < (a.n || 20); i++) {
        const p = novaParte("agua", rnd(ar[0], ar[2]), rnd(ar[1], ar[3]), { grupo: a.grupo || "w", agit: a.agitacao, lim: { t: "r", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3] } });
        if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); }
      }
    };
    A.solutos = (a, an) => {
      const ar = areaDe(a);
      for (let i = 0; i < (a.n || 6); i++) {
        const p = novaParte(a.especie || "particula", rnd(ar[0], ar[2]), rnd(ar[1], ar[3]), { grupo: "sol", agit: a.agitacao == null ? .35 : a.agitacao, lim: { t: "r", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3] } });
        if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); }
      }
    };
    A.agitar = (a) => { parts.forEach(p => { if (!a.grupo || p.grupo === a.grupo) p.agit = a.agitacao; }); };

    A.pontes = (a, an) => {
      const e = els[a.alvo]; if (!e) return;
      const n = a.n || 4, R = a.distancia || 6.5;
      for (let i = 0; i < n; i++) {
        const ang = (45 + 90 * i) * Math.PI / 180, x = e.x + Math.cos(ang) * R, y = e.y + Math.sin(ang) * R;
        const p = novaParte("agua", x, y, { ang: (ang * 180 / Math.PI) + 180 });
        p.modo = "preso"; p.casa = { x, y };
        if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); }
        else { p.alfa = 0; p.alvoAlfa = 0; timers.push(setTimeout(() => p.alvoAlfa = 1, i * 450)); }
        pontes.push({ a: e, b: p });
      }
    };

    A.hidratar = (a, an) => {
      const e = els[a.alvo]; if (!e) return;
      const re = raioEl(e), cam = a.camadas || 1, n = a.n || 8;
      const r1 = re + 2.3, r2 = r1 + 2.9;
      const n1 = cam === 2 ? Math.max(4, Math.round(n * .42)) : n, n2 = n - n1;
      const pos = [];
      for (let i = 0; i < n1; i++) { const t = 2 * Math.PI * i / n1; pos.push([r1, t]); }
      for (let i = 0; i < n2; i++) { const t = 2 * Math.PI * (i + .5) / n2; pos.push([r2, t]); }
      const ion = e.tipo === "ion";
      e.hid = (e.hid || []).filter(q => !q.morrer);
      const antigos = e.hid.slice(); e.hid = [];
      pos.forEach(([r, t], i) => {
        const x = e.x + Math.cos(t) * r, y = e.y + Math.sin(t) * r;
        let p = antigos.length ? antigos.shift() : maisProxima(livres(a.grupo || "*"), x, y);
        if (!p) p = novaParte("agua", rnd(2, 98), rnd(2, 58));
        e.hid.push(p);
        p.ligada = cam === 2 && i < n1;
        p.reserva = false; p.modo = an ? "indo" : "preso"; p.modoFinal = "preso"; p.casa = { x, y };
        if (ion) orient(p, t * 180 / Math.PI); // oxigênio voltado ao cátion
        if (!an) { p.x = x; p.y = y; p.alfa = 1; p.g.setAttribute("opacity", 1); }
      });
      antigos.forEach(q => { q.modo = "livre"; q.casa = null; });
      const rh = (cam === 2 ? r2 : r1) + 1.9;
      if (e.halo) e.halo.remove();
      const halo = mk("g", {}, L.halo); e.halo = halo;
      if (a.halo !== false) mk("circle", { cx: e.x, cy: e.y, r: rh, fill: PAL.azul + "14", stroke: PAL.azul, "stroke-width": .35, "stroke-dasharray": "1.2 1" }, halo);
      if (a.rotulo) rot(halo, e.x, e.y + rh + 3.8, a.rotulo, 3.4, PAL.azul);
      if (an) { halo.setAttribute("opacity", 0); timers.push(setTimeout(() => fade(halo, true), 1800)); }
    };

    A.congelar = (a, an) => {
      const ar = areaDe(a);
      const nuc = a.nucleos || [[(ar[0] + ar[2]) / 2, (ar[1] + ar[3]) / 2]];
      const R = a.raio == null ? 999 : a.raio;
      const sol = solutos(ar);
      const ev = a.evitar_raio;
      // 1) solutos: presos no lugar (com bolsão líquido) ou expulsos do cristal
      if (ev != null) {
        sol.forEach(s => {
          if (s.p) { s.p.modo = "preso"; s.p.casa = { x: s.p.x, y: s.p.y }; }
          const rb = s.r + ev - 1.2;
          const nb = Math.max(2, Math.round(rb * .9));
          for (let i = 0; i < nb; i++) { const t = rnd(0, 6.28), rr = rnd(s.r + 1.2, rb); const p = novaParte("agua", s.x + Math.cos(t) * rr, s.y + Math.sin(t) * rr, { agit: .55, lim: { t: "c", cx: s.x, cy: s.y, r: rb } }); if (!an) { p.alfa = 1; p.g.setAttribute("opacity", 1); } }
        });
      } else if (a.expulsar !== false) {
        sol.forEach(s => {
          if (s.el && s.el.tipo === "bacteria") return;
          let x = s.x, y = s.y;
          for (let it = 0; it < 3; it++) for (const [nx, ny] of nuc) { const d = dist(x, y, nx, ny); if (d < R + 1.5) { const k = (R + 2.4) / (d || .01); x = nx + (x - nx) * k; y = ny + (y - ny) * k; } }
          x = Math.min(Math.max(x, ar[0] + 1), ar[2] - 1); y = Math.min(Math.max(y, ar[1] + 1), ar[3] - 1);
          if (s.p) { s.p.modo = an ? "indo" : "preso"; s.p.modoFinal = "preso"; s.p.casa = { x, y }; if (!an) { s.p.x = x; s.p.y = y; } }
          else if (s.el) A.mover({ elemento: s.el.def.id, para: [x, y], duracao: a.duracao || 3000 }, an);
        });
      }
      // 2) sítios da rede hexagonal
      const st = [];
      const dy = S * .866;
      for (let j = 0, y = ar[1] + S / 2; y <= ar[3] - .6; j++, y += dy) for (let x = ar[0] + S / 2 + (j % 2 ? S / 2 : 0); x <= ar[2] - .6; x += S) {
        const key = x.toFixed(1) + "," + y.toFixed(1); if (sites.has(key)) continue;
        let dn = 1e9; for (const [nx, ny] of nuc) dn = Math.min(dn, dist(x, y, nx, ny)); if (dn > R) continue;
        if (ev != null && sol.some(s => dist(x, y, s.x, s.y) < s.r + ev)) continue;
        if (ev == null && sol.some(s => s.el && s.el.tipo === "bacteria" && dist(x, y, s.x, s.y) < 3.2)) { /* cristal atravessa a célula */ }
        st.push({ x, y, key, dn });
      }
      st.sort((p, q) => p.dn - q.dn);
      st.forEach(s => sites.add(s.key));
      if (R < 900) nuc.forEach(([nx, ny]) => discos.push({ cx: nx, cy: ny, r: R + S * .55 }));
      else discos.push({ cx: (ar[0] + ar[2]) / 2, cy: (ar[1] + ar[3]) / 2, r: 0, area: ar });
      const ocupar = s => {
        let p = maisProxima(livres(a.grupo || "*", q => q.lim.t === "r" && dentro([ar[0] - 6, ar[1] - 6, ar[2] + 6, ar[3] + 6], q.x, q.y)), s.x, s.y);
        if (!p) { p = novaParte("agua", s.x + rnd(-6, 6), s.y + rnd(-6, 6)); if (!an) p.alfa = 1; }
        p.reserva = true; p.casa = { x: s.x, y: s.y };
        if (an) { p.modo = "indo"; p.modoFinal = "gelo"; }
        else { p.modo = "gelo"; p.x = s.x; p.y = s.y; setGelo(p, true); orient(p, -90); p.alfa = 1; p.g.setAttribute("opacity", 1); }
        p.sitio = s.key;
      };
      const limpaSobra = () => {
        // águas livres que ficaram dentro da região congelada desaparecem (viraram gelo)
        livres("*", q => q.lim.t === "r" && dentro(ar, q.x, q.y) && (R > 900 || nuc.some(([nx, ny]) => dist(q.x, q.y, nx, ny) < R))).forEach(remover);
      };
      if (!an || !a.duracao) { st.forEach(ocupar); if (!an) limpaSobra(); else timers.push(setTimeout(limpaSobra, 1500)); return; }
      const t0 = performance.now(); let i = 0;
      procs.push(t => { const k = Math.min(1, (t - t0) / a.duracao); const alvo = Math.floor(k * st.length); while (i < alvo) ocupar(st[i++]); if (k >= 1) { while (i < st.length) ocupar(st[i++]); timers.push(setTimeout(limpaSobra, 1800)); return false; } });
    };

    A.derreter = (a, an) => {
      const [cx, cy] = a.centro, R = a.raio || 10;
      const alvo = parts.filter(p => p.modo === "gelo" || (p.modoFinal === "gelo" && p.modo === "indo")).filter(p => dist(p.casa.x, p.casa.y, cx, cy) < R).sort((p, q) => dist(p.x, p.y, cx, cy) - dist(q.x, q.y, cx, cy));
      const liberar = p => { if (p.sitio) sites.delete(p.sitio); p.modo = "livre"; p.reserva = false; p.modoFinal = null; setGelo(p, false); p.agit = a.agitacao == null ? .7 : a.agitacao; p.lim = { t: "c", cx, cy, r: R }; p.grupo = a.grupo || "w"; };
      discos = discos.filter(d => dist(d.cx, d.cy, cx, cy) > R || d.r === 0);
      if (!an) { alvo.forEach(liberar); return; }
      const dur = a.duracao || 2500, t0 = performance.now(); let i = 0;
      procs.push(t => { const k = Math.min(1, (t - t0) / dur); const n = Math.floor(k * alvo.length); while (i < n) liberar(alvo[i++]); return k < 1; });
    };

    A.desidratar = (a, an) => {
      const e = els[a.alvo]; if (!e) return;
      const n = a.n || 8, ps = [];
      for (let i = 0; i < n; i++) { const p = novaParte("agua", e.x + rnd(-3, 3), e.y + rnd(-1.2, 1.2), { agit: .8 }); p.modo = "preso"; p.casa = { x: p.x, y: p.y }; ps.push(p); if (!an) { p.alfa = 1; } }
      const sair = () => ps.forEach(p => { p.modo = "livre"; p.lim = { t: "r", x1: 2, y1: 2, x2: 98, y2: 58 }; const t = Math.atan2(p.y - e.y, p.x - e.x); p.vx = Math.cos(t) * 14; p.vy = Math.sin(t) * 14; });
      if (!an) { ps.forEach(p => { const t = rnd(0, 6.28); p.x = e.x + Math.cos(t) * rnd(9, 20); p.y = e.y + Math.sin(t) * rnd(8, 16); p.modo = "livre"; p.lim = { t: "r", x1: 2, y1: 2, x2: 98, y2: 58 }; p.g.setAttribute("opacity", 1); }); e.esc = .78; posEl(e); if (e.corpo) e.corpo.setAttribute("fill", PAL.bactSeca); return; }
      timers.push(setTimeout(() => { sair(); tween(1800, k => { e.esc = 1 - .22 * k; posEl(e); }, true); if (e.corpo) e.corpo.setAttribute("fill", PAL.bactSeca); }, 900));
    };

    A.coletar = (a, an) => {
      const ps = parts.filter(p => p.tipo === (a.especie || "particula") && !p.morrer);
      const [cx, cy] = a.para;
      ps.forEach((p, i) => { const r = 2.2 * Math.sqrt(i), t = i * 2.4; const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r; p.casa = { x, y }; p.modo = an ? "indo" : "preso"; p.modoFinal = "preso"; if (!an) { p.x = x; p.y = y; } });
    };

    A.rotulo = (a, an) => { const g = mk("g", {}, L.ann); rot(g, a.x, a.y, a.texto, a.tamanho || 3.9, PAL[a.cor] || PAL.giz); fade(g, an); };
    A.circulo = (a, an) => { const g = mk("g", {}, L.ann); const c = PAL[a.cor] || PAL.ambar; mk("circle", { cx: a.x, cy: a.y, r: a.r || 6, fill: "none", stroke: c, "stroke-width": .5, "stroke-dasharray": "1.4 1" }, g); if (a.rotulo) rot(g, a.x, a.y - (a.r || 6) - 1.6, a.rotulo, 3.6, c); fade(g, an); };
    A.linha = (a, an) => { const g = mk("g", {}, L.ann); mk("line", { x1: a.de[0], y1: a.de[1], x2: a.para[0], y2: a.para[1], stroke: PAL[a.cor] || PAL.giz + "66", "stroke-width": .4, "stroke-dasharray": "1.5 1.2" }, g); fade(g, an); };
    A.seta = (a, an) => {
      const g = mk("g", {}, L.ann); const c = PAL[a.cor] || PAL.giz;
      const [x1, y1] = a.de, [x2, y2] = a.para, t = Math.atan2(y2 - y1, x2 - x1);
      mk("line", { x1, y1, x2, y2, stroke: c, "stroke-width": .55 }, g);
      mk("path", { d: `M${x2},${y2}L${x2 - 2 * Math.cos(t - .45)},${y2 - 2 * Math.sin(t - .45)}L${x2 - 2 * Math.cos(t + .45)},${y2 - 2 * Math.sin(t + .45)}Z`, fill: c }, g);
      if (a.rotulo) rot(g, x1, y1 + (y2 > y1 ? -1.6 : 4), a.rotulo, 3.6, c);
      fade(g, an);
    };
    A.evaporar = (a, an) => {
      const ar = a.area || [0, 0, 100, 60];
      const alvo = parts.filter(p => p.tipo === "agua" && !p.morrer && !p.ligada && dentro(ar, p.x, p.y));
      alvo.forEach((p, i) => {
        const sair = () => { p.modo = "indo"; p.modoFinal = "preso"; p.casa = { x: p.x + rnd(-6, 6), y: -8 }; p.alvoAlfa = 0; p.morrer = true; if (p.sitio) sites.delete(p.sitio); };
        if (!an) { p.g.remove(); p.morrer = true; p.alfa = 0; return; }
        timers.push(setTimeout(sair, rnd(0, a.duracao || 3000)));
      });
      if (!an) parts = parts.filter(p => !(p.morrer && p.alfa <= 0));
      Object.values(els).forEach(e => { if (e.hid) e.hid = e.hid.filter(q => q.ligada); if (e.halo && an) tween(1500, k => e.halo.setAttribute("opacity", 1 - k), true); else if (e.halo) e.halo.setAttribute("opacity", 0); });
    };
    A.prender = (a, an) => {
      const ar = areaDe(a);
      parts.filter(p => p.tipo === "agua" && p.modo === "livre" && !p.morrer && (!a.grupo || p.grupo === a.grupo)).slice(0, a.n || 999).forEach(p => {
        const x = rnd(ar[0], ar[2]), y = rnd(ar[1], ar[3]);
        p.lim = { t: "r", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3] };
        if (a.agitacao != null) p.agit = a.agitacao;
        if (!an) { p.x = x; p.y = y; return; }
        p.modo = "indo"; p.modoFinal = "livre"; p.casa = { x, y };
      });
    };
    A.vagar = (a, an) => {
      const e = els[a.elemento]; if (!e) return;
      const ar = a.area || [6, 6, 94, 54]; let vx = 0, vy = 0, t0 = 0;
      const ag = a.agitacao == null ? .5 : a.agitacao;
      e.vagando = true;
      procs.push(t => { if (!e.vagando) return false; const dt = t0 ? Math.min(.05, (t - t0) / 1000) : 0; t0 = t;
        vx += (Math.random() - .5) * ag * 40 * dt * 6; vy += (Math.random() - .5) * ag * 40 * dt * 6; const dmp = Math.pow(.2, dt); vx *= dmp; vy *= dmp;
        e.x += vx * dt; e.y += vy * dt; if (e.x < ar[0] || e.x > ar[2]) { vx *= -1; e.x = Math.min(Math.max(e.x, ar[0]), ar[2]); } if (e.y < ar[1] || e.y > ar[3]) { vy *= -1; e.y = Math.min(Math.max(e.y, ar[1]), ar[3]); } posEl(e); });
    };
    A.limpar_cena = () => limpar();

    function limpar() {
      timers.forEach(clearTimeout); timers = []; procs = [];
      parts.forEach(p => p.g.remove()); parts = []; sites = new Set(); discos = []; pontes = [];
      Object.values(L).forEach(l => l.innerHTML = "");
      els = {}; (def.elementos || []).forEach(construirEl);
    }

    function executar(a, anim) {
      const fn = A[a.tipo]; if (!fn) return;
      if (anim && a.atraso) timers.push(setTimeout(() => fn(a, true), a.atraso));
      else fn(a, anim);
    }

    limpar(); iniciar();
    return {
      executar, limpar,
      parar() { timers.forEach(clearTimeout); timers = []; procs = []; cancelAnimationFrame(raf); raf = 0; root.remove(); },
      acoes: Object.keys(A)
    };
  }

  return { criar: criar };
})();
var CENA = null;
function carregarFonteGiz(){
  if(document.getElementById('fonte_giz')) return;
  var l = document.createElement('link'); l.id = 'fonte_giz'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Patrick+Hand&display=swap';
  document.head.appendChild(l);
}
function pararCena(){ if(CENA){ try{ CENA.parar(); }catch(e){} CENA = null; } }
// estado da cena no passo: refaz do último "limpar_cena" até aqui (os anteriores já prontos; o atual animado se estiver tocando)
function desenharCena(b, passo, anim){
  var box = $('cenaBox'), sv = $('cenaSvg'); if(!box || !sv) return;
  pararCena(); sv.innerHTML = '';
  if($('quadro')) $('quadro').classList.toggle('t-comCena', !!b.cena);
  if(!b.cena){ box.classList.add('oculto'); return; }
  box.classList.remove('oculto'); carregarFonteGiz();
  var claro = !!(T && T.trilha && T.trilha.visual && T.trilha.visual.fundo === 'branco');
  box.classList.toggle('t-claro', claro);
  CENA = Cena.criar(sv, b.cena, {x: 0, y: 0, largura: 100, tema: claro ? 'claro' : 'escuro'});
  var ultimo = function(ac){ var k = -1; (ac || []).forEach(function(a, i){ if(a.tipo === 'limpar_cena') k = i; }); return k; };
  var j0 = 0; for(var j = passo; j >= 0; j--){ if(ultimo(b.passos[j].cena_acoes) >= 0){ j0 = j; break; } }
  for(var i = j0; i <= passo; i++){
    var ac = b.passos[i].cena_acoes || [], k = ultimo(ac); if(k >= 0) ac = ac.slice(k + 1);
    var an = !!anim && i === passo;
    ac.forEach(function(a){ try{ CENA.executar(a, an); }catch(e){} });
  }
}

/* ===================== GRÁFICO (desenhado a partir dos dados; nada de código vindo do arquivo) ===================== */
var G = (function(){
  var NS = 'http://www.w3.org/2000/svg', W = 800, H = 440, ML = 74, MR = 26, MT = 22, MB = 58;
  var X0 = ML, X1 = W - MR, Y0 = H - MB, Y1 = MT;
  // tela estreita (celular): folha de 480 de largura, assim o texto do gráfico sai ~70% maior
  function geometria(comCena){
    var larg = svg.getBoundingClientRect().width || (svg.parentNode && svg.parentNode.clientWidth) || 800, cel = larg < 620;
    W = cel ? 420 : 800; H = cel ? (comCena ? 300 : 420) : 440; ML = cel ? 54 : 74; MR = cel ? 10 : 26; MT = cel ? 16 : 22; MB = cel ? 52 : 58;
    X0 = ML; X1 = W - MR; Y0 = H - MB; Y1 = MT;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  }
  var svg, gReg, gSer, gAnot, gRot, b, caixas = [], visiveis = {}, destaque = '', animarAte = 0;
  var CORES = {azul: '#2E62C6', laranja: '#D9731A', verde: '#1E8A4C', vermelho: '#C0392B', roxo: '#7D3C98', cinza: '#6B7A90', ambar: '#B8890A'};
  function cor(c){ return CORES[c] || '#26344f'; }
  function el(tag, at, pai){ var e = document.createElementNS(NS, tag); for(var k in at) e.setAttribute(k, at[k]); if(pai) pai.appendChild(e); return e; }
  function px(x){ var g = b.grafico; return X0 + (x - g.x.min) / (g.x.max - g.x.min) * (X1 - X0); }
  function py(y){ var g = b.grafico; return Y0 - (y - g.y.min) / (g.y.max - g.y.min) * (Y0 - Y1); }
  function serie(id){ return b.grafico.series.filter(function(s){ return s.id === id; })[0]; }
  function valor(s, x){
    var p = s.params;
    switch(s.modelo){
      case 'gab': return p.m0 * p.c * p.k * x / ((1 - p.k * x) * (1 - p.k * x + p.c * p.k * x));
      case 'bet': return p.m0 * p.c * x / ((1 - x) * (1 + (p.c - 1) * x));
      case 'linear': return p.a + p.b * x;
      case 'exponencial': return p.a * Math.exp(p.b * x);
      case 'sino': return p.altura * Math.exp(-Math.pow(x - p.centro, 2) / (2 * p.largura * p.largura));
      case 'pontos':
        var q = p.pontos; if(x <= q[0][0]) return q[0][1];
        for(var i = 1; i < q.length; i++) if(x <= q[i][0]){ var f = (x - q[i - 1][0]) / ((q[i][0] - q[i - 1][0]) || 1); return q[i - 1][1] + f * (q[i][1] - q[i - 1][1]); }
        return q[q.length - 1][1];
    }
    return NaN;
  }
  function num(v){ var a = Math.abs(v); return (a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, '').replace('.', ','); }
  function passos(e){ if(e.passo) return e.passo; var r = (e.max - e.min) / 6, p = Math.pow(10, Math.floor(Math.log10(r))), m = r / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
  // rótulo que não encosta em outro rótulo nem sai do gráfico
  function rotulo(x, y, texto, c, ancora, opc){
    if(!texto) return;
    opc = opc || {};
    var larg = texto.length * (W < 600 ? 9.6 : 8.2) + 6, alt = 18;
    var tenta = [0, -18, 18, -36, 36, -54, 54], melhor = null;
    for(var i = 0; i < tenta.length; i++){
      var yy = y + tenta[i], a = ancora, xi = a === 'end' ? x - larg : a === 'middle' ? x - larg / 2 : x;
      if(xi < X0 + 2){ xi = X0 + 2; } if(xi + larg > W - 4){ xi = W - 4 - larg; }
      if(yy - alt < 4) yy = alt + 4; if(yy > H - 4) yy = H - 4;
      var cx = {x: xi, y: yy - alt + 3, w: larg, h: alt};
      var bate = caixas.some(function(o){ return !(cx.x + cx.w < o.x || o.x + o.w < cx.x || cx.y + cx.h < o.y || o.y + o.h < cx.y); });
      if(!bate){ melhor = cx; break; }
      if(!melhor) melhor = cx;
    }
    caixas.push(melhor);
    var t = el('text', {x: melhor.x, y: melhor.y + alt - 3, class: 't-rot', fill: cor(c)}, gRot);
    t.textContent = texto;
    if(opc.fade) aparecer(t, opc.atraso);
    return t;
  }
  function aparecer(e, atraso){ if(!atraso && atraso !== 0) return; e.style.opacity = 0; e.style.transition = 'opacity .5s'; setTimeout(function(){ e.style.opacity = 1; }, atraso + 30); }
  function eixos(){
    var g = b.grafico, gx = passos(g.x), gy = passos(g.y);
    for(var v = Math.ceil(g.x.min / gx) * gx; v <= g.x.max + 1e-9; v += gx){
      el('line', {x1: px(v), y1: Y0, x2: px(v), y2: Y1, class: 't-grade'}, svg);
      el('text', {x: px(v), y: Y0 + 18, 'text-anchor': 'middle', class: 't-tick'}, svg).textContent = num(v);
    }
    for(var w = Math.ceil(g.y.min / gy) * gy; w <= g.y.max + 1e-9; w += gy){
      el('line', {x1: X0, y1: py(w), x2: X1, y2: py(w), class: 't-grade'}, svg);
      el('text', {x: X0 - 8, y: py(w) + 4, 'text-anchor': 'end', class: 't-tick'}, svg).textContent = num(w);
    }
    el('line', {x1: X0, y1: Y0, x2: X1, y2: Y0, class: 't-eixo'}, svg);
    el('line', {x1: X0, y1: Y0, x2: X0, y2: Y1, class: 't-eixo'}, svg);
    el('text', {x: (X0 + X1) / 2, y: H - 14, 'text-anchor': 'middle', class: 't-rotEixo'}, svg).textContent = g.x.rotulo;
    el('text', {x: 18, y: (Y0 + Y1) / 2, 'text-anchor': 'middle', class: 't-rotEixo', transform: 'rotate(-90 18 ' + ((Y0 + Y1) / 2) + ')'}, svg).textContent = g.y.rotulo;
  }
  function caminho(s){
    var d = '', n = 160;
    for(var i = 0; i <= n; i++){ var x = s.de + (s.ate - s.de) * i / n, y = valor(s, x); if(!isFinite(y)) continue; d += (d ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(y).toFixed(1); }
    return d;
  }
  function desenharSerie(s, atraso){
    var gs = el('g', {'data-trserie': s.id}, gSer);
    if(s.marcadores){
      s.params.pontos.forEach(function(q, i){
        var c = el('circle', {cx: px(q[0]), cy: py(q[1]), r: 5.5, fill: '#fff', stroke: cor(s.cor), 'stroke-width': 2.2}, gs);
        if(atraso !== undefined) aparecer(c, atraso + i * 220);
      });
    } else {
      var p = el('path', {d: caminho(s), fill: 'none', stroke: cor(s.cor), 'stroke-width': destaque === s.id ? 4.5 : 3, 'stroke-linecap': 'round', 'stroke-dasharray': s.tracejado ? '9 7' : ''}, gs);
      if(atraso !== undefined){
        var L0 = p.getTotalLength();
        p.style.strokeDasharray = L0; p.style.strokeDashoffset = L0;
        setTimeout(function(){ p.style.transition = 'stroke-dashoffset 1.8s ease-in-out'; p.style.strokeDashoffset = 0; }, atraso + 30);
        setTimeout(function(){ p.style.transition = ''; p.style.strokeDasharray = s.tracejado ? '9 7' : ''; p.style.strokeDashoffset = ''; }, atraso + 1900);
        marcarFim(atraso + 1900);
      }
    }
    if(destaque && destaque !== s.id) gs.setAttribute('opacity', '0.28');
    // nome da curva perto do fim dela
    if(s.nome){
      var xf = s.marcadores ? s.params.pontos[s.params.pontos.length - 1][0] : s.ate, yf = valor(s, xf);
      if(isFinite(yf)) rotulo(px(xf) - 4, Math.max(Y1 + 14, Math.min(Y0 - 6, py(yf) - 8)), s.nome, s.cor, 'end', {fade: atraso !== undefined, atraso: (atraso || 0) + 1200});
    }
  }
  function marcarFim(ms){ animarAte = Math.max(animarAte, Date.now() + ms); }
  var marcadores = {};
  function ponta(c){
    if(marcadores[c]) return marcadores[c];
    var defs = svg.querySelector('defs') || el('defs', {}, svg), id = 'tr_pt_' + c;
    var m = el('marker', {id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'}, defs);
    el('path', {d: 'M0 0L10 5L0 10z', fill: cor(c)}, m);
    return (marcadores[c] = 'url(#' + id + ')');
  }
  // executa uma ação; anim = true anima (passo atual), false desenha o estado final (passos anteriores)
  function acao(a, anim){
    var at = anim ? a.atraso : undefined, g;
    switch(a.tipo){
      case 'limpar': gReg.innerHTML = ''; gSer.innerHTML = ''; gAnot.innerHTML = ''; gRot.innerHTML = ''; caixas = []; visiveis = {}; destaque = ''; break;
      case 'serie': if(!visiveis[a.serie]){ visiveis[a.serie] = 1; desenharSerie(serie(a.serie), at); } break;
      case 'destacar': destaque = a.serie; gSer.querySelectorAll('[data-trserie]').forEach(function(x){ x.setAttribute('opacity', x.getAttribute('data-trserie') === a.serie ? '1' : '0.28'); var p = x.querySelector('path'); if(p) p.setAttribute('stroke-width', x.getAttribute('data-trserie') === a.serie ? 4.5 : 3); }); break;
      case 'regiao':
        g = el('g', {}, gReg);
        el('rect', {x: px(a.de), y: Y1, width: Math.max(0, px(a.ate) - px(a.de)), height: Y0 - Y1, fill: cor(a.cor), opacity: 0.1}, g);
        el('line', {x1: px(a.ate), y1: Y1, x2: px(a.ate), y2: Y0, stroke: cor(a.cor), 'stroke-opacity': 0.35, 'stroke-dasharray': '4 4'}, g);
        if(at !== undefined) aparecer(g, at);
        rotulo((px(a.de) + px(a.ate)) / 2, Y1 + 18, a.rotulo, a.cor, 'middle', {fade: anim, atraso: a.atraso});
        break;
      case 'seta':
        var x1 = px(a.de[0]), y1 = py(a.de[1]), x2 = px(a.para[0]), y2 = py(a.para[1]);
        var ln = el('line', {x1: x1, y1: y1, x2: x2, y2: y2, stroke: cor(a.cor), 'stroke-width': 2.4, 'marker-end': ponta(a.cor)}, gAnot);
        if(anim){ var L1 = Math.hypot(x2 - x1, y2 - y1); ln.style.strokeDasharray = L1; ln.style.strokeDashoffset = L1; ln.setAttribute('marker-end', '');
          setTimeout(function(){ ln.style.transition = 'stroke-dashoffset .7s ease-out'; ln.style.strokeDashoffset = 0; }, a.atraso + 30);
          setTimeout(function(){ ln.setAttribute('marker-end', ponta(a.cor)); ln.style.strokeDasharray = ''; }, a.atraso + 720); marcarFim(a.atraso + 800); }
        // rótulo na origem da seta, do lado oposto ao que ela aponta
        var dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy) || 1;
        var anc = Math.abs(dx) < Math.abs(dy) * 0.5 ? 'middle' : dx > 0 ? 'end' : 'start';
        var lx = x1 - dx / n * 8, ly = y1 - dy / n * 8 + (Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? -4 : 14) : 5);
        rotulo(lx, ly, a.rotulo, a.cor, anc, {fade: anim, atraso: a.atraso});
        break;
      case 'ponto':
        var vy = a.serie ? valor(serie(a.serie), a.x) : a.y;
        var c = el('circle', {cx: px(a.x), cy: py(vy), r: 6.5, fill: cor(a.cor), stroke: '#fff', 'stroke-width': 2}, gAnot);
        if(at !== undefined) aparecer(c, at);
        rotulo(px(a.x) + (px(a.x) > (X0 + X1) / 2 ? -12 : 12), py(vy) - 10, a.rotulo, a.cor, px(a.x) > (X0 + X1) / 2 ? 'end' : 'start', {fade: anim, atraso: a.atraso});
        break;
      case 'ponto_movel':
        var s = serie(a.serie), gg = el('g', {}, gAnot);
        var guiaV = el('line', {stroke: cor(a.cor), 'stroke-dasharray': '3 4', 'stroke-opacity': .6}, gg), guiaH = el('line', {stroke: cor(a.cor), 'stroke-dasharray': '3 4', 'stroke-opacity': .6}, gg);
        var bola = el('circle', {r: 8, fill: cor(a.cor), stroke: '#fff', 'stroke-width': 2}, gg);
        // a leitura do ponto fica num lugar fixo do gráfico (desvia dos outros rótulos) e só o número muda
        var leitura = function(xv){ return (a.rotulo ? a.rotulo + ': ' : '') + num(xv) + ' → ' + num(valor(s, xv)); };
        var txt = rotulo(X0 + 10, Y1 + 46, leitura(a.ate), a.cor, 'start');
        var pos = function(xv){
          var yv = valor(s, xv), X = px(xv), Y = py(yv);
          bola.setAttribute('cx', X); bola.setAttribute('cy', Y);
          guiaV.setAttribute('x1', X); guiaV.setAttribute('x2', X); guiaV.setAttribute('y1', Y); guiaV.setAttribute('y2', Y0);
          guiaH.setAttribute('x1', X0); guiaH.setAttribute('x2', X); guiaH.setAttribute('y1', Y); guiaH.setAttribute('y2', Y);
          if(txt) txt.textContent = leitura(xv);
        };
        if(!anim){ pos(a.ate); break; }
        pos(a.de); gg.style.opacity = 0;
        var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(function(){
          gg.style.opacity = 1;
          var ini = performance.now(), dur = reduz ? 1 : a.duracao;
          var passo = function(agora){
            if(!gg.isConnected) return;
            var f = Math.min(1, (agora - ini) / dur), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
            pos(a.de + (a.ate - a.de) * e);
            if(f < 1) requestAnimationFrame(passo);
          };
          requestAnimationFrame(passo);
        }, a.atraso + 30);
        marcarFim(a.atraso + a.duracao + 100);
        break;
      case 'linha_v': case 'linha_h':
        var lv = a.tipo === 'linha_v';
        var l2 = el('line', lv ? {x1: px(a.x), y1: Y1, x2: px(a.x), y2: Y0} : {x1: X0, y1: py(a.y), x2: X1, y2: py(a.y)}, gAnot);
        l2.setAttribute('stroke', cor(a.cor)); l2.setAttribute('stroke-width', 2); l2.setAttribute('stroke-dasharray', '7 5');
        if(at !== undefined) aparecer(l2, at);
        if(lv) rotulo(px(a.x) + (px(a.x) > X1 - 200 ? -8 : 8), Y1 + 40, a.rotulo, a.cor, px(a.x) > X1 - 200 ? 'end' : 'start', {fade: anim, atraso: a.atraso});
        else rotulo(X1 - 6, py(a.y) - 8, a.rotulo, a.cor, 'end', {fade: anim, atraso: a.atraso});
        break;
      case 'distancia':
        var ya = valor(serie(a.serie_a), a.x), yb = valor(serie(a.serie_b), a.x), gd = el('g', {}, gAnot);
        el('line', {x1: px(a.x), y1: py(ya), x2: px(a.x), y2: py(yb), stroke: cor(a.cor), 'stroke-width': 2.4}, gd);
        [ya, yb].forEach(function(v){ el('line', {x1: px(a.x) - 7, y1: py(v), x2: px(a.x) + 7, y2: py(v), stroke: cor(a.cor), 'stroke-width': 2.4}, gd); });
        if(at !== undefined) aparecer(gd, at);
        rotulo(px(a.x) + 12, (py(ya) + py(yb)) / 2 + 5, a.rotulo, a.cor, 'start', {fade: anim, atraso: a.atraso});
        break;
      case 'texto':
        rotulo(px(a.x), py(a.y), a.texto, a.cor || 'azul', 'middle', {fade: anim, atraso: a.atraso});
        break;
    }
  }
  function desenhar(bloco, passo){
    desenharCena(bloco, passo, P.tocando);
    b = bloco; svg = $('svg'); svg.innerHTML = ''; geometria(!!bloco.cena); caixas = []; visiveis = {}; destaque = ''; marcadores = {}; animarAte = Date.now();
    if(!b.grafico){
      // sem gráfico: título e pontos do passo em letras grandes, quebrando as linhas
      var ps = b.passos[passo], cel = W < 600, max = cel ? 24 : 46, y = 46;
      var quebra = function(txt, n){ var out = [], cur = ''; String(txt).split(/\s+/).forEach(function(w){ if((cur + ' ' + w).trim().length > n){ if(cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if(cur) out.push(cur); return out; };
      quebra(ps.titulo || b.titulo, max).forEach(function(l){ var t = el('text', {x: 24, y: y, class: 't-rotEixo', style: 'font-size:' + (cel ? 28 : 32) + 'px', fill: '#17389C'}, svg); t.textContent = l; y += cel ? 34 : 40; });
      y += 10;
      (ps.pontos || []).forEach(function(pt){ quebra('• ' + pt, max + 4).forEach(function(l, k){ var t = el('text', {x: k ? 44 : 24, y: y, style: 'font-size:' + (cel ? 22 : 24) + 'px', fill: '#26344f'}, svg); t.textContent = l; y += cel ? 28 : 32; }); y += 6; });
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Math.max(H * .6, y + 10));
      G.fimAcoes = Date.now(); return;
    }
    eixos();
    var clip = el('clipPath', {id: 'tr_areaGraf'}, el('defs', {}, svg)); el('rect', {x: X0, y: Y1 - 2, width: X1 - X0 + 2, height: Y0 - Y1 + 2}, clip);
    gReg = el('g', {}, svg); gSer = el('g', {'clip-path': 'url(#tr_areaGraf)'}, svg); gAnot = el('g', {}, svg); gRot = el('g', {}, svg);
    b.grafico.series.forEach(function(s){ if(s.visivel){ visiveis[s.id] = 1; desenharSerie(s); } });
    // passos anteriores: estado final, sem animação; passo atual: animado
    for(var i = 0; i < passo; i++) b.passos[i].acoes.forEach(function(a){ acao(a, false); });
    var anim = P.tocando;
    b.passos[passo].acoes.forEach(function(a){ acao(a, anim); });
    G.fimAcoes = animarAte;
  }
  return {desenhar: desenhar, fimAcoes: 0};
})();

/* ===================== DÚVIDA POR VOZ (Live, token temporário vindo do servidor) ===================== */
var wsD = null, ctxMic = null, ctxSom = null, fonteMic = null, noMic = null, streamMic = null, tocarAte = 0, tocandoD = [], tD0 = 0, relogioD = null;
var tokenVoz = null, alcaRetomada = '', trocando = false, tentativasRetomar = 0, wsPendente = null, estavaTocando = false;
var CODIGO_WORKLET = 'class Captura extends AudioWorkletProcessor{process(e){var c=e[0][0];if(c)this.port.postMessage(c.slice(0));return true;}}registerProcessor("captura",Captura);';
function paraPCM16(f32, de, para){
  var razao = de / para, n = Math.floor(f32.length / razao), out = new Int16Array(n);
  for(var i = 0; i < n; i++){ var s = f32[Math.floor(i * razao)]; s = Math.max(-1, Math.min(1, s)); out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; }
  return out;
}
function b64DeBytes(u8){ var s = '', k = 0x8000; for(var i = 0; i < u8.length; i += k) s += String.fromCharCode.apply(null, u8.subarray(i, i + k)); return btoa(s); }
function bytesDeB64(b){ var s = atob(b), u = new Uint8Array(s.length); for(var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function estadoD(t, classe){ var e = $('estadoD'); if(e) e.innerHTML = '<span class="t-bola t-' + (classe || '') + '"></span>' + esc(t); }
function tocarPCM(b64){
  if(!ctxSom) return;
  var u = bytesDeB64(b64), n = u.length / 2, dv = new DataView(u.buffer), buf = ctxSom.createBuffer(1, n, 24000), ch = buf.getChannelData(0);
  for(var i = 0; i < n; i++) ch[i] = dv.getInt16(i * 2, true) / 32768;
  var src = ctxSom.createBufferSource(); src.buffer = buf; src.connect(ctxSom.destination);
  var ini = Math.max(ctxSom.currentTime, tocarAte); src.start(ini); tocarAte = ini + buf.duration;
  tocandoD.push(src); src.onended = function(){ tocandoD = tocandoD.filter(function(x){ return x !== src; }); if(!tocandoD.length && wsD) estadoD('ouvindo você…', 'on'); };
  estadoD('a IA está falando…', 'fala');
}
function pararFalaD(){ tocandoD.forEach(function(s){ try{ s.stop(); }catch(e){} }); tocandoD = []; tocarAte = 0; }
var ultimaFala = {ia: null, eu: null};
function escrever(quem, texto){
  if(!texto || !$('conversaD')) return;
  var box = ultimaFala[quem];
  if(!box){
    box = document.createElement('div'); box.className = 't-msg t-' + quem;
    box.innerHTML = '<div class="t-quem">' + (quem === 'ia' ? 'IA' : 'Você') + '</div><span></span>';
    $('conversaD').appendChild(box); ultimaFala[quem] = box; ultimaFala[quem === 'ia' ? 'eu' : 'ia'] = null;
  }
  box.querySelector('span').textContent += texto;
  $('conversaD').scrollTop = $('conversaD').scrollHeight;
}
function abrirDuvida(){
  if(wsD) return;
  if(T.previa){ $('duvidaBox').classList.remove('oculto'); $('duvidaBox').innerHTML = '<p class="aviso" style="margin:0">Salve a trilha para testar a dúvida por voz (a IA usa a versão guardada).</p>'; return; }
  estavaTocando = P.tocando; pausar();
  var b = blocoAtual();
  var box = $('duvidaBox'); box.classList.remove('oculto');
  box.innerHTML = '<b>✋ Dúvida sobre: ' + esc(b.passos[P.passo].titulo || b.titulo) + '</b>' +
    '<div class="t-estado" id="tr_estadoD"></div><div class="t-nivel" id="tr_nivelMic"><div></div></div>' +
    '<div class="aviso">Fale normalmente; pode interromper a IA. Se ela puxar um assunto que não estava na aula, ela avisa: "aprofundamento · não cai na prova".</div>' +
    '<div class="t-conversa" id="tr_conversaD"></div><div id="tr_msgD"></div>' +
    '<div class="botoes"><button class="mini" id="tr_btFimD">Encerrar e voltar para a aula</button></div>';
  $('btFimD').addEventListener('click', function(){ encerrarDuvida(); });
  ultimaFala = {ia: null, eu: null}; estadoD('preparando o microfone…');
  box.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  try{ ctxSom = new AudioContext({sampleRate: 24000}); }catch(e){ ctxSom = new AudioContext(); }
  ctxMic = new AudioContext();
  navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, channelCount: 1}}).then(function(s){
    streamMic = s; estadoD('abrindo a conversa…');
    return api('trilhaToken', {id: T.id, blocoId: b.id, passo: P.passo, modo: 'duvida'});
  }).then(function(t){
    tokenVoz = t; alcaRetomada = ''; trocando = false; tentativasRetomar = 0;
    try{ ctxSom.resume(); ctxMic.resume(); }catch(e){}
    conectarD(true);
  }).catch(function(e){
    if($('msgD')) $('msgD').innerHTML = '<div class="erro">' + esc(/Permission|NotAllowed/i.test(e.name || e.message) ? 'O navegador não liberou o microfone. Permita o microfone para este site e tente de novo.' : e.message) + '</div>';
    encerrarDuvida(true, true);
  });
}
var vigiaD = null, novasTentativasD = 0;
function conectarD(primeira){
  var t = tokenVoz, c = t.config;
  clearTimeout(vigiaD);
  var nova = new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=' + encodeURIComponent(t.token));
  nova.onopen = function(){
    nova.send(JSON.stringify({setup: {model: t.modelo, generationConfig: {responseModalities: c.responseModalities, speechConfig: c.speechConfig}, systemInstruction: c.systemInstruction,
      inputAudioTranscription: {}, outputAudioTranscription: {}, sessionResumption: alcaRetomada ? {handle: alcaRetomada} : {}, contextWindowCompression: c.contextWindowCompression || {slidingWindow: {}}}}));
  };
  nova.onmessage = function(ev){
    (typeof ev.data === 'string' ? Promise.resolve(ev.data) : ev.data.text()).then(function(txt){
      var m; try{ m = JSON.parse(txt); }catch(e){ return; }
      if(m.setupComplete){
        clearTimeout(vigiaD); novasTentativasD = 0;
        var velha = wsD; wsD = nova; wsPendente = null; trocando = false; tentativasRetomar = 0;
        if(primeira){
          ligarMicrofone(); estadoD('ouvindo você… pode falar', 'on'); tD0 = Date.now();
          relogioD = setInterval(function(){ if(tD0 && Date.now() - tD0 > tokenVoz.duracaoMin * 60000){ if($('msgD')) $('msgD').innerHTML = '<div class="convite">A conversa chegou ao tempo máximo.</div>'; encerrarDuvida(); } }, 5000);
          nova.send(JSON.stringify({clientContent: {turns: [{role: 'user', parts: [{text: 'Olá, apertei o botão de dúvida.'}]}], turnComplete: true}}));
        } else if(velha && velha !== nova){ velha.onclose = null; try{ velha.close(1000); }catch(e){} }
        return;
      }
      if(m.sessionResumptionUpdate && m.sessionResumptionUpdate.resumable && m.sessionResumptionUpdate.newHandle) alcaRetomada = m.sessionResumptionUpdate.newHandle;
      var sc = m.serverContent;
      if(sc){
        if(sc.interrupted) pararFalaD();
        if(sc.inputTranscription && sc.inputTranscription.text) escrever('eu', sc.inputTranscription.text);
        if(sc.outputTranscription && sc.outputTranscription.text) escrever('ia', sc.outputTranscription.text);
        (sc.modelTurn && sc.modelTurn.parts || []).forEach(function(p){ if(p.inlineData && /audio/.test(p.inlineData.mimeType || '')) tocarPCM(p.inlineData.data); });
      }
      if(m.goAway && nova === wsD && !trocando && alcaRetomada){ trocando = true; conectarD(false); }
    });
  };
  nova.onclose = function(ev){
    if(nova !== wsD) return;
    if(alcaRetomada && tentativasRetomar < 3){ tentativasRetomar++; trocando = true; conectarD(false); return; }
    if(ev.code !== 1000 && ev.code !== 1005 && $('msgD')) $('msgD').innerHTML = '<div class="erro">A conversa foi encerrada pelo Google' + (ev.reason ? ' (' + esc(ev.reason) + ')' : '') + '.</div>';
    encerrarDuvida(true, true);
  };
  if(primeira) wsD = nova; else wsPendente = nova;
  if(primeira) vigiaD = setTimeout(function(){
    if(wsD !== nova || tD0) return;   // já conectou ou já foi encerrada
    nova.onclose = null; try{ nova.close(1000); }catch(e){}
    if(novasTentativasD < 2){
      novasTentativasD++; estadoD('o Google não respondeu; tentando de novo…');
      api('trilhaToken', {id: T.id, blocoId: blocoAtual().id, passo: P.passo, modo: 'duvida'}).then(function(t2){ if(wsD !== nova) return; tokenVoz = t2; alcaRetomada = ''; conectarD(true); })
        .catch(function(e){ if($('msgD')) $('msgD').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; encerrarDuvida(true, true); });
    } else {
      novasTentativasD = 0;
      if($('msgD')) $('msgD').innerHTML = '<div class="erro">A conversa por voz não conectou agora (o Google não respondeu). Tente de novo em alguns minutos.</div>';
      encerrarDuvida(true, true);
    }
  }, 12000);
}
function ligarMicrofone(){
  var url = URL.createObjectURL(new Blob([CODIGO_WORKLET], {type: 'application/javascript'}));
  ctxMic.audioWorklet.addModule(url).then(function(){
    fonteMic = ctxMic.createMediaStreamSource(streamMic);
    noMic = new AudioWorkletNode(ctxMic, 'captura');
    var acumulado = [], tam = 0, alvo = Math.round(ctxMic.sampleRate * 0.1);
    noMic.port.onmessage = function(e){
      var f = e.data; acumulado.push(f); tam += f.length;
      var pico = 0; for(var i = 0; i < f.length; i += 16) pico = Math.max(pico, Math.abs(f[i]));
      var bar = $('nivelMic'); if(bar) bar.firstChild.style.width = Math.min(100, pico * 300) + '%';
      if(tam < alvo || !wsD || wsD.readyState !== 1) return;
      var junto = new Float32Array(tam), o = 0; acumulado.forEach(function(a){ junto.set(a, o); o += a.length; }); acumulado = []; tam = 0;
      wsD.send(JSON.stringify({realtimeInput: {audio: {data: b64DeBytes(new Uint8Array(paraPCM16(junto, ctxMic.sampleRate, 16000).buffer)), mimeType: 'audio/pcm;rate=16000'}}}));
    };
    fonteMic.connect(noMic);
  });
}
function encerrarDuvida(semFechar, manterCaixa){
  clearTimeout(vigiaD);
  var seg = tD0 ? Math.round((Date.now() - tD0) / 1000) : 0;
  var w = wsD; wsD = null;
  try{ if(w && !semFechar){ w.onclose = null; w.close(1000); } }catch(e){}
  try{ if(wsPendente){ wsPendente.onclose = null; wsPendente.close(1000); } }catch(e){}
  wsPendente = null; pararFalaD();
  try{ noMic && noMic.disconnect(); fonteMic && fonteMic.disconnect(); }catch(e){}
  try{ streamMic && streamMic.getTracks().forEach(function(t){ t.stop(); }); }catch(e){}
  try{ ctxMic && ctxMic.close(); ctxSom && ctxSom.close(); }catch(e){}
  ctxMic = ctxSom = null; streamMic = null; clearInterval(relogioD); tD0 = 0;
  if(seg > 3) U.duvida(seg);
  var box = $('duvidaBox');
  if(box && !manterCaixa){
    var conv = $('conversaD') ? $('conversaD').innerHTML : '';
    box.innerHTML = '<details><summary class="link">Conversa da dúvida (' + fmtTempo(seg) + ')</summary><div class="t-conversa">' + conv + '</div></details>';
    if(estavaTocando) tocar();
  } else if(box){ estadoD('desligado'); var bt = $('btFimD'); if(bt){ bt.textContent = 'Fechar'; bt.onclick = function(){ box.classList.add('oculto'); }; } }
}

/* ===================== NARRAÇÃO COM VOZ DA IA (só o professor grava; uma vez) ===================== */
var N = {ws: null, fila: [], atual: null, pcm: [], ouvido: '', timer: null, rodando: false, voz: 'Kore', tentativas: 0};
function desenharNarracao(){
  var box = $('admNarrCorpo'); if(!box) return;
  var itens = [];
  T.trilha.blocos.forEach(function(b){ b.passos.forEach(function(p, i){ itens.push({k: b.id + ':' + i, b: b, i: i}); }); });
  var ok = itens.filter(function(x){ return T.narracao[x.k] === 'ok'; }).length, velhas = itens.filter(function(x){ return T.narracao[x.k] === 'velha'; }).length;
  box.innerHTML = '<p class="aviso">A IA lê cada fala uma vez; o áudio fica guardado no seu Drive e depois toca para todos sem gastar cota.</p>' +
    (T.fila ? '<div class="ok" style="margin:6px 0">⏳ Gravando em segundo plano: faltam ' + T.fila.faltam + ' fala(s)' + (T.fila.proxima ? ' · próxima rodada ' + esc(T.fila.proxima) : '') + '. Pode fechar o site. <button class="mini secundario" id="tr_btNarrParar">Parar</button></div>' : '') +
    '<div class="t-estNarr">' + itens.map(function(x){ var s = T.narracao[x.k]; return '<span title="' + esc(x.b.titulo + ' · passo ' + (x.i + 1)) + '" style="background:' + (s === 'ok' ? '#1E8A4C' : s === 'velha' ? '#B8890A' : '#b9c2d3') + '">' + (x.i + 1) + '</span>'; }).join('') + '</div>' +
    '<p class="aviso">' + ok + ' de ' + itens.length + ' falas gravadas' + (velhas ? ' · ' + velhas + ' com o texto mudado desde a gravação (amarelo)' : '') + '.</p>' +
    '<div class="botoes"><label>Voz: <select id="tr_narrVoz">' + L.vozes.map(function(v){ return '<option' + (v === T.voz ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select></label>' +
    '<button class="mini" id="tr_btNarrFaltam"' + (ok === itens.length ? ' disabled' : '') + '>🎙 Gravar com a voz da conversa (as que faltam)</button>' +
    '<button class="mini secundario" id="tr_btNarrEste">Regravar o passo atual</button><button class="mini secundario" id="tr_btNarrTodas">Regravar todas</button></div>' +
    '<p class="aviso" style="margin:4px 0 0">É a mesma voz natural da dúvida por voz. Deixe esta aba aberta enquanto grava (uns 3 a 5 minutos por aula).</p>' +
    '<details style="margin-top:8px"><summary class="link">Voz de leitura em segundo plano (pode fechar o site, mas a voz é mais neutra)</summary><div class="botoes">' +
    '<button class="mini secundario" id="tr_btNarrFundo"' + (ok === itens.length ? ' disabled' : '') + '>🌙 Gravar as que faltam em segundo plano</button>' +
    '<button class="mini secundario" id="tr_btNarrFundoTodas">🌙 Regravar todas em segundo plano</button></div></details>' +
    '<div id="tr_narrProg"></div><div id="tr_narrLog" style="font-size:13px"></div>';
  var fundo = function(refazer){
    $('narrProg').innerHTML = '<p class="aviso">Colocando na fila…</p>';
    api('trilhaNarrarFundo', {ids: [T.id], voz: $('narrVoz').value, refazer: refazer}).then(function(r){
      T.fila = r.falas ? {faltam: r.falas, proxima: ''} : null; desenharNarracao();
      $('narrProg').innerHTML = r.falas ? '<div class="ok">✓ ' + r.falas + ' fala(s) na fila. Pode fechar o site: o servidor grava sozinho e te avisa quando terminar.</div>' : '<div class="ok">Já está tudo gravado.</div>';
    }).catch(function(e){ $('narrProg').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
  };
  $('btNarrFundo').addEventListener('click', function(){ fundo(false); });
  $('btNarrFundoTodas').addEventListener('click', function(){ if(confirm('Regravar todas as ' + itens.length + ' falas com a voz ' + $('narrVoz').value + ', em segundo plano?')) fundo(true); });
  if($('btNarrParar')) $('btNarrParar').addEventListener('click', function(){ api('trilhaNarrarParar', {id: T.id}).then(function(){ T.fila = null; desenharNarracao(); }); });
  $('btNarrFaltam').addEventListener('click', function(){ gravarNarracao(itens.filter(function(x){ return T.narracao[x.k] !== 'ok'; })); });
  $('btNarrEste').addEventListener('click', function(){ var b = blocoAtual(); gravarNarracao([{k: b.id + ':' + P.passo, b: b, i: P.passo}]); });
  $('btNarrTodas').addEventListener('click', function(){ if(confirm('Regravar todas as ' + itens.length + ' falas com a voz ' + $('narrVoz').value + '?')) gravarNarracao(itens); });
}
function wavDePCM(partes){
  var n = partes.reduce(function(s, p){ return s + p.length; }, 0), buf = new ArrayBuffer(44 + n), dv = new DataView(buf), u8 = new Uint8Array(buf);
  var esc4 = function(o, s){ for(var i = 0; i < 4; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  esc4(0, 'RIFF'); dv.setUint32(4, 36 + n, true); esc4(8, 'WAVE'); esc4(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 24000, true); dv.setUint32(28, 48000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); esc4(36, 'data'); dv.setUint32(40, n, true);
  var o = 44; partes.forEach(function(p){ u8.set(p, o); o += p.length; });
  return u8;
}
function parecido(a, b){
  var norm = function(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function(w){ return w.length > 3; }); };
  var pa = norm(a), pb = {}; norm(b).forEach(function(w){ pb[w] = 1; });
  if(!pa.length) return 1;
  return pa.filter(function(w){ return pb[w]; }).length / pa.length;
}
function logN(h){ var l = $('narrLog'); if(l) l.insertAdjacentHTML('afterbegin', '<div>' + h + '</div>'); }
function gravarNarracao(itens){
  if(N.rodando || !itens.length) return;
  pausar();
  N.fila = itens.slice(); N.rodando = true; N.voz = $('narrVoz').value; N.tentativas = 0; N.total = itens.length;
  document.querySelectorAll('#tr_admNarrCorpo button').forEach(function(b){ b.disabled = true; });
  $('narrProg').innerHTML = '<p class="aviso">Abrindo a voz…</p>';
  abrirNarrador();
}
function abrirNarrador(){
  api('trilhaToken', {id: T.id, modo: 'narrar', voz: N.voz}).then(function(t){
    var c = t.config, ws = new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=' + encodeURIComponent(t.token));
    N.ws = ws;
    ws.onopen = function(){ ws.send(JSON.stringify({setup: {model: t.modelo, generationConfig: {responseModalities: c.responseModalities, speechConfig: c.speechConfig}, systemInstruction: c.systemInstruction, outputAudioTranscription: {}}})); };
    ws.onmessage = function(ev){
      (typeof ev.data === 'string' ? Promise.resolve(ev.data) : ev.data.text()).then(function(txt){
        var m; try{ m = JSON.parse(txt); }catch(e){ return; }
        if(m.setupComplete){ proximaFala(); return; }
        var sc = m.serverContent; if(!sc || !N.atual) return;
        (sc.modelTurn && sc.modelTurn.parts || []).forEach(function(p){ if(p.inlineData && /audio/.test(p.inlineData.mimeType || '')) N.pcm.push(bytesDeB64(p.inlineData.data)); });
        if(sc.outputTranscription && sc.outputTranscription.text) N.ouvido += sc.outputTranscription.text;
        if(sc.turnComplete) terminouFala();
      });
    };
    ws.onclose = function(ev){
      if(N.ws !== ws) return;
      N.ws = null; clearTimeout(N.timer);
      if(N.atual){ N.fila.unshift(N.atual); N.atual = null; }
      if(N.rodando && N.fila.length && N.tentativas < 3){ N.tentativas++; logN('↻ A conexão caiu' + (ev.reason ? ' (' + esc(ev.reason) + ')' : '') + ': reabrindo…'); abrirNarrador(); return; }
      fimNarracao(N.fila.length ? 'Parou: ' + (ev.reason || 'a conexão caiu') + '. As que faltam continuam marcadas para gravar.' : '');
    };
  }).catch(function(e){ fimNarracao(e.message); });
}
function proximaFala(){
  if(!N.fila.length){ var w = N.ws; N.ws = null; try{ w && w.close(1000); }catch(e){} fimNarracao(''); return; }
  N.atual = N.fila.shift(); N.pcm = []; N.ouvido = '';
  var p = N.atual.b.passos[N.atual.i];
  $('narrProg').innerHTML = '<p class="aviso">🎙 Gravando ' + (N.total - N.fila.length) + ' de ' + N.total + ': ' + esc(N.atual.b.titulo) + ' · passo ' + (N.atual.i + 1) + '…</p><p class="convite" style="margin:6px 0 0">⚠ <b>Não feche esta aba</b> até terminar: a voz da conversa só grava com a plataforma aberta. Pode usar outras abas, mas não deixe o computador dormir.</p>';
  N.ws.send(JSON.stringify({clientContent: {turns: [{role: 'user', parts: [{text: p.fala}]}], turnComplete: true}}));
  clearTimeout(N.timer);
  N.timer = setTimeout(function(){ if(N.atual){ logN('⚠ Passo ' + (N.atual.i + 1) + ': a voz não terminou em 90 s; pulado.'); N.atual = null; proximaFala(); } }, 90000);
}
function terminouFala(){
  clearTimeout(N.timer);
  var it = N.atual; N.atual = null;
  var p = it.b.passos[it.i], sim = parecido(p.fala, N.ouvido), bytes = N.pcm.reduce(function(s, x){ return s + x.length; }, 0);
  if(bytes < 24000){ logN('⚠ ' + esc(it.b.titulo) + ' · passo ' + (it.i + 1) + ': a voz veio vazia; não guardei.'); proximaFala(); return; }
  var wav = wavDePCM(N.pcm);
  api('trilhaAudioSalvar', {id: T.id, chave: it.k, b64: b64DeBytes(wav), voz: N.voz}).then(function(){
    T.narracao[it.k] = 'ok'; delete P.cacheAud[it.k];
    logN((sim < 0.85 ? '⚠ ' : '✓ ') + esc(it.b.titulo) + ' · passo ' + (it.i + 1) + ' (' + Math.round(bytes / 48000) + ' s)' +
      (sim < 0.85 ? ' — a voz não leu igual ao texto (' + Math.round(sim * 100) + '% das palavras). Ouça e, se precisar, regrave. Ela disse: <i>' + esc(N.ouvido.trim()) + '</i>' : ''));
  }).catch(function(e){ logN('✗ passo ' + (it.i + 1) + ': ' + esc(e.message)); })
    .then(function(){ if(N.ws) proximaFala(); });
}
function fimNarracao(erro){
  N.rodando = false; clearTimeout(N.timer); T.voz = N.voz;
  var log = $('narrLog') ? $('narrLog').innerHTML : '';
  if(temNarracaoIA()){ try{ localStorage.setItem('trilha_voz', 'ia'); }catch(e){} if($('avisoNarr')) $('avisoNarr').remove(); }
  montarSelVoz(); desenharNarracao();
  if($('narrLog')) $('narrLog').innerHTML = log;
  $('narrProg').innerHTML = erro ? '<div class="erro">' + esc(erro) + '</div>' : '<div class="ok">Pronto. Escolha "🔊 voz da IA (gravada)" na barra e dê ▶.</div>';
}

/* ===================== REGISTRO DE USO (estatística para o professor) ===================== */
var U = (function(){
  var s = null, ultimoEnvio = 0, ativoAte = 0, tick = null;
  function novo(){
    return {sessao: 'S' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), segundos: 0, vistos: {}, duvidas: 0, duvida_seg: 0, checks: {}};
  }
  function mexeu(){ ativoAte = Date.now() + 120000; }
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(function(ev){ document.addEventListener(ev, mexeu, {passive: true}); });
  function iniciar(){
    if(s) enviar(true);
    if(!T || T.previa){ s = null; return; }
    s = novo(); s.trilha = T.id; mexeu();
    clearInterval(tick);
    tick = setInterval(function(){
      // conta o tempo só com a página visível e em uso (aula tocando, conversa aberta ou mexida nos últimos 2 min)
      if(s && document.visibilityState === 'visible' && (P.tocando || wsD || Date.now() < ativoAte)) s.segundos++;
      if(s && Date.now() - ultimoEnvio > 60000 && s.segundos > 5) enviar();
    }, 1000);
  }
  function dados(){
    var acertos = 0, ch = Object.keys(s.checks); ch.forEach(function(k){ if(s.checks[k].primeira) acertos++; });
    return {segundos: s.segundos, passos: Object.keys(s.vistos).length, total_passos: totalPassos(), duvidas: s.duvidas, duvida_seg: s.duvida_seg, acertos: acertos, checagens: ch.length,
      detalhes: {vistos: Object.keys(s.vistos), checagens: s.checks}};
  }
  function enviar(final){
    if(!s || s.segundos < 5) return;
    ultimoEnvio = Date.now();
    var corpo = JSON.stringify({acao: 'trilhaRegistrar', dados: {token: H.token(), id: s.trilha, sessao: s.sessao, dados: dados()}});
    if(final){ try{ fetch(H.backend, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: corpo, keepalive: true}); }catch(e){} return; }
    api('trilhaRegistrar', {id: s.trilha, sessao: s.sessao, dados: dados()}).catch(function(){});
  }
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') enviar(true); });
  window.addEventListener('pagehide', function(){ enviar(true); });
  return {
    iniciar: iniciar, enviar: enviar,
    visto: function(k){ if(s) s.vistos[k] = 1; },
    duvida: function(seg){ if(s){ s.duvidas++; s.duvida_seg += seg; enviar(); } },
    checagem: function(bloco, certo){ if(!s) return; var c = s.checks[bloco]; if(!c) s.checks[bloco] = {primeira: certo, tentativas: 1}; else c.tentativas++; enviar(); }
  };
})();

// a aula de exemplo (isotermas) entra sozinha na primeira vez, para você ver como fica
var EXEMPLO = "{\"formato\":\"aula-trilha/1\",\"titulo\":\"Isotermas de sorção\",\"tema\":\"Água em alimentos: isotermas de sorção, regiões da isoterma, histerese e Aw crítica\",\"fonte\":\"Aula de Água (slides 33–57) de Química e Bioquímica de Alimentos — Prof. Miguel Meirelles\",\"blocos\":[{\"id\":\"isotermas\",\"titulo\":\"Lendo uma isoterma de sorção\",\"contexto_ia\":\"A isoterma de sorção relaciona, a temperatura constante, a atividade de água (Aw, eixo x; no equilíbrio Aw = UR/100) com a umidade de equilíbrio do produto (eixo y, em g de água por 100 g de sólidos secos). É obtida experimentalmente: amostras ficam em câmaras com umidade relativa controlada (soluções salinas saturadas), na mesma temperatura, até o peso ficar constante; usam-se de 6 a 9 níveis de Aw e cada ponto leva de uma a três semanas. A curva de adsorção (produto seco ganhando água) tem formato de S (tipo II) e três regiões: Região I (Aw baixa, até ~0,25): água fortemente ligada aos constituintes, a monocamada de BET; pouca água muda muito a Aw. Região II (~0,25 a ~0,8): camadas de hidratação sobre a monocamada; a curva sobe devagar. Região III (acima de ~0,8): água livre, disponível para reações e micro-organismos; a curva dispara e o produto fica menos estável. Exemplo da aula: leite em pó em embalagem aberta tende a entrar em equilíbrio com a umidade do ar; a 30% de UR fica com ~5,6 g/100 g e a 70% de UR sobe para ~13 g/100 g. Histerese: a curva de dessorção (secando o produto úmido) fica acima da de adsorção; na mesma Aw o produto que veio secando segura mais água. Aw crítica: a indústria especifica uma Aw máxima de trabalho para o produto não aglomerar nem perder qualidade (o valor 0,37 usado no gráfico é ilustrativo); essa especificação orienta a escolha da embalagem (barreira à umidade). Modelos que descrevem a isoterma: BET (vale até Aw ~0,5, dá a monocamada) e GAB (vale em quase toda a faixa).\",\"grafico\":{\"x\":{\"rotulo\":\"Atividade de água (Aw)\",\"min\":0,\"max\":1,\"passo\":0.1},\"y\":{\"rotulo\":\"Umidade de equilíbrio (g/100 g ss)\",\"min\":0,\"max\":40,\"passo\":10},\"series\":[{\"id\":\"exp\",\"nome\":\"pontos medidos\",\"modelo\":\"pontos\",\"params\":{\"pontos\":[[0.11,3.4],[0.23,4.9],[0.33,5.7],[0.43,7.5],[0.53,8.5],[0.65,11.7],[0.75,14.4],[0.85,21.2]]},\"cor\":\"cinza\",\"marcadores\":true},{\"id\":\"ads\",\"nome\":\"adsorção\",\"modelo\":\"gab\",\"params\":{\"m0\":5,\"c\":12,\"k\":0.9},\"de\":0.02,\"ate\":0.95,\"cor\":\"azul\"},{\"id\":\"des\",\"nome\":\"dessorção\",\"modelo\":\"gab\",\"params\":{\"m0\":6.6,\"c\":14,\"k\":0.87},\"de\":0.02,\"ate\":0.95,\"cor\":\"laranja\",\"tracejado\":true}]},\"passos\":[{\"titulo\":\"Quanto de água o leite em pó pega do ar?\",\"fala\":\"Imagine um pacote de leite em pó aberto na cozinha. Ele vai puxar água do ar. Mas quanto? A resposta está num gráfico que você vai usar muito na engenharia de alimentos: a isoterma de sorção.\",\"pontos\":[\"A isoterma diz quanta água o alimento segura em equilíbrio com o ar\"],\"acoes\":[{\"tipo\":\"texto\",\"x\":0.5,\"y\":22,\"texto\":\"isoterma de sorção\",\"cor\":\"azul\"}]},{\"titulo\":\"Os dois eixos\",\"fala\":\"No eixo de baixo fica a atividade de água, que, no equilíbrio, é a umidade relativa do ar dividida por cem. No eixo da esquerda fica a umidade de equilíbrio: quantos gramas de água o produto segura em cada cem gramas de sólidos secos. E tudo isso numa temperatura fixa: por isso o nome isoterma.\",\"pontos\":[\"Eixo x: Aw = UR/100 no equilíbrio\",\"Eixo y: umidade de equilíbrio (g água / 100 g sólidos secos)\",\"Temperatura constante: isoterma\"],\"acoes\":[{\"tipo\":\"seta\",\"de\":[0.62,6],\"para\":[0.62,1],\"rotulo\":\"atividade de água\",\"cor\":\"roxo\"},{\"tipo\":\"seta\",\"de\":[0.15,30],\"para\":[0.03,30],\"rotulo\":\"umidade de equilíbrio\",\"cor\":\"roxo\",\"atraso\":1500}]},{\"titulo\":\"De onde vêm os pontos\",\"fala\":\"Cada ponto é uma amostra deixada numa câmara com umidade controlada, sempre na mesma temperatura, até o peso parar de mudar. Usam-se de seis a nove níveis de atividade de água, e cada ponto leva de uma a três semanas para ficar pronto.\",\"pontos\":[\"Câmaras com UR controlada, mesma temperatura, até peso constante\",\"6 a 9 níveis de Aw; 1 a 3 semanas por ponto\"],\"acoes\":[{\"tipo\":\"serie\",\"serie\":\"exp\"}]},{\"titulo\":\"A curva de adsorção\",\"fala\":\"Ligando os pontos, aparece a curva de adsorção: o produto seco ganhando água. Repare no formato de S. Cada parte desse S conta uma história diferente sobre como a água está no alimento.\",\"pontos\":[\"Adsorção: produto seco ganhando água\",\"Formato de S: três regiões\"],\"acoes\":[{\"tipo\":\"serie\",\"serie\":\"exp\"},{\"tipo\":\"serie\",\"serie\":\"ads\",\"atraso\":600}]},{\"titulo\":\"Região I · água ligada\",\"fala\":\"No começo, com atividade de água baixa, a água está presa aos constituintes do alimento: é a monocamada de BET. Repare que, aqui, um pouquinho de água já muda bastante a atividade de água.\",\"pontos\":[\"Região I: água fortemente ligada, a monocamada de BET\"],\"acoes\":[{\"tipo\":\"limpar\"},{\"tipo\":\"serie\",\"serie\":\"ads\"},{\"tipo\":\"regiao\",\"de\":0,\"ate\":0.25,\"rotulo\":\"I\",\"cor\":\"azul\"},{\"tipo\":\"seta\",\"de\":[0.22,14],\"para\":[0.12,3.7],\"rotulo\":\"monocamada de BET\",\"cor\":\"vermelho\",\"atraso\":800}]},{\"titulo\":\"Região II · camadas de hidratação\",\"fala\":\"No meio, a água forma camadas de hidratação por cima da monocamada. A curva sobe devagar: dá para mexer bastante na atividade de água ganhando pouca umidade.\",\"pontos\":[\"Região II: camadas de hidratação; a curva sobe devagar\"],\"acoes\":[{\"tipo\":\"regiao\",\"de\":0.25,\"ate\":0.8,\"rotulo\":\"II\",\"cor\":\"verde\"},{\"tipo\":\"seta\",\"de\":[0.42,20],\"para\":[0.5,8.6],\"rotulo\":\"sobe devagar\",\"cor\":\"vermelho\",\"atraso\":800}]},{\"titulo\":\"Região III · água livre\",\"fala\":\"No fim, a água está livre, e a curva dispara. É aqui que as reações químicas e os micro-organismos encontram água disponível. Quanto mais para a direita, menos estável fica o produto.\",\"pontos\":[\"Região III: água livre, disponível para reações e micro-organismos\",\"Mais à direita = menos estável\"],\"acoes\":[{\"tipo\":\"regiao\",\"de\":0.8,\"ate\":1,\"rotulo\":\"III\",\"cor\":\"vermelho\"},{\"tipo\":\"seta\",\"de\":[0.68,32],\"para\":[0.88,26],\"rotulo\":\"dispara\",\"cor\":\"vermelho\",\"atraso\":800}]},{\"titulo\":\"O leite em pó na cozinha\",\"fala\":\"Agora, o pacote aberto. Se o ar está com trinta por cento de umidade relativa, o pó fica com cerca de cinco vírgula seis gramas de água em cada cem. Se a cozinha vai para setenta por cento, ele puxa água até uns treze. Olhe o ponto andando pela curva.\",\"pontos\":[\"A Aw do alimento tende a se igualar à UR do ar\",\"UR 30% → ~5,6 g/100 g; UR 70% → ~13 g/100 g\"],\"acoes\":[{\"tipo\":\"ponto_movel\",\"serie\":\"ads\",\"de\":0.3,\"ate\":0.7,\"rotulo\":\"leite em pó\",\"cor\":\"vermelho\",\"duracao\":4000,\"atraso\":1500}]},{\"titulo\":\"Histerese\",\"fala\":\"Se, em vez de molhar o produto seco, eu secar o produto úmido, a curva não volta pelo mesmo caminho: ela fica acima. Na mesma atividade de água, o produto que veio secando segura mais água. Isso é a histerese.\",\"pontos\":[\"Dessorção (secando) fica acima da adsorção\",\"Na mesma Aw, quem veio secando segura mais água\"],\"acoes\":[{\"tipo\":\"limpar\"},{\"tipo\":\"serie\",\"serie\":\"ads\"},{\"tipo\":\"serie\",\"serie\":\"des\",\"atraso\":500},{\"tipo\":\"distancia\",\"serie_a\":\"ads\",\"serie_b\":\"des\",\"x\":0.5,\"rotulo\":\"histerese\",\"atraso\":2500}]},{\"titulo\":\"Aw crítica\",\"fala\":\"Para o leite em pó não aglomerar nem perder qualidade, a indústria trabalha abaixo de uma atividade de água crítica. Ela é a especificação de produção, e é por ela que se escolhe a embalagem certa, com a barreira à umidade adequada.\",\"pontos\":[\"Aw crítica: especificação de produção\",\"Orienta a escolha da embalagem (barreira à umidade)\"],\"acoes\":[{\"tipo\":\"limpar\"},{\"tipo\":\"serie\",\"serie\":\"ads\"},{\"tipo\":\"regiao\",\"de\":0,\"ate\":0.37,\"rotulo\":\"trabalhar aqui\",\"cor\":\"verde\"},{\"tipo\":\"linha_v\",\"x\":0.37,\"rotulo\":\"Aw crítica ≈ 0,37 (ilustrativo)\",\"cor\":\"vermelho\",\"atraso\":600}]}],\"checagem\":{\"tipo\":\"multipla\",\"pergunta\":\"Um leite em pó com Aw 0,25 fica com a embalagem furada numa cozinha a 70% de umidade relativa. O que acontece?\",\"alternativas\":[\"Nada muda: a embalagem só protege da luz.\",\"O pó ganha água até a Aw dele ficar perto de 0,70, porque a Aw do alimento tende a se igualar à umidade relativa do ambiente.\",\"O pó perde água para o ar, porque o ar está mais úmido.\"],\"correta\":1,\"explicacao\":\"Aw 0,25 é menor que 70% de UR, então o pó absorve água e caminha pela isoterma até perto de 0,70, passando bem da Aw crítica: ele aglomera e fica vulnerável.\"},\"pergunta_falada\":{\"pergunta\":\"Com as suas palavras: por que a curva de dessorção fica acima da curva de adsorção?\",\"esperado\":\"Na secagem, parte da água fica presa na estrutura (poros e capilares) e sai com mais dificuldade; por isso, na mesma Aw, o produto que veio secando segura mais água. O caminho (molhando ou secando) importa.\"}}]}";
function garantirExemplo(){
  var feito = false; try{ feito = localStorage.getItem('trilha_exemplo') === '1'; }catch(e){}
  if(L.trilhas.length || feito) return Promise.resolve(false);
  var d = L.disciplinas.filter(function(x){ return /bioqu/i.test(x.nome); })[0] || L.disciplinas[0];
  return api('trilhaEnviar', {texto: EXEMPLO, salvar: true, disciplinaId: d ? d.id : ''}).then(function(s){
    try{ localStorage.setItem('trilha_exemplo', '1'); }catch(e){}
    return api('trilhasListar').then(function(r){ L = r; return s.id; });
  });
}
inicio = function(){
  $('corpo').innerHTML = '<p class="aviso">Carregando…</p>';
  api('trilhasListar').then(function(r){ L = r; return garantirExemplo(); })
    .then(function(novo){ if(novo) abrirTrilha(novo); else desenharLista(); })
    .catch(function(e){ $('corpo').innerHTML = '<div class="erro">' + esc(e.message) + '</div>'; });
};
window.addEventListener('beforeunload', function(ev){ if(wsD) encerrarDuvida(); if(N.rodando){ ev.preventDefault(); ev.returnValue = 'A voz ainda está sendo gravada. Se sair agora, a gravação para.'; return ev.returnValue; } });
if('speechSynthesis' in window){ try{ speechSynthesis.getVoices(); }catch(e){} }
window.Trilha = {
  // abre a aba dentro do elemento (o painel da aba no aulas.html)
  abrir: function(el, helpers, opc){
    H = helpers;
    var modo = opc && opc.modo === 'aluno' ? 'aluno' : 'prof', mudou = modo !== MODO; MODO = modo;
    if(!document.getElementById('tr_estilo')){ var st = document.createElement('style'); st.id = 'tr_estilo'; st.textContent = ".t-app .t-tag{display:inline-block;font-size:11px;border-radius:999px;padding:2px 9px;background:#e7ecf6;color:var(--navy);text-transform:none;letter-spacing:0;vertical-align:middle;font-weight:bold}\n.t-app .t-passoNum{display:inline-block;background:var(--menu);color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;font-size:13px;margin-right:6px}\n.t-app .t-listaAulas{max-height:260px;overflow:auto;background:#fff;border:1px solid var(--linha);border-radius:8px;padding:6px 10px;margin-top:8px}\n.t-app .t-listaAulas label{display:flex;gap:8px;align-items:flex-start;margin:4px 0;cursor:pointer;font-size:14px}\n.t-app ul.t-erros{margin:6px 0;padding-left:20px;font-size:13.5px}\n.t-app textarea{width:100%;min-height:140px;font-family:Consolas,monospace;font-size:12.5px}\n.t-app .t-blocos{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}\n.t-app button.t-chip{border:1.5px solid var(--linha);background:#fff;color:var(--navy);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:normal}\n.t-app button.t-chip.t-atual{background:var(--menu);color:#fff;border-color:var(--menu)}\n.t-app .t-palco{background:#fff;border:1px solid var(--linha);border-radius:10px 10px 0 0;padding:10px 12px 4px}\n.t-app .t-titSlide{font-size:18px;font-weight:bold;color:var(--menu);min-height:24px}\n.t-app .t-ref{font-size:12px;color:var(--cinza)}\n.t-app .t-palco svg{width:100%;height:auto;display:block}\n.t-app .t-controles{position:sticky;top:0;z-index:5;background:#f5f8fe;border:1px solid var(--linha);border-top:0;border-radius:0 0 10px 10px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}\n.t-app .t-controles .t-barra{flex:1 1 120px;height:6px;background:#dfe6f3;border-radius:3px;overflow:hidden;min-width:80px}\n.t-app .t-controles .t-barra>div{height:100%;background:var(--azul,#2E62C6);width:0;transition:width .3s}\n.t-app .t-controles .t-info{font-size:12.5px;color:var(--cinza);white-space:nowrap}\n.t-app .t-controles select{padding:4px 6px;font-size:13px;width:auto}\n.t-app .t-texto{margin-top:14px;display:grid;grid-template-columns:1fr;gap:12px}\n@media(min-width:760px){ .t-app .t-texto{grid-template-columns:1.1fr 1fr} }\n.t-app .t-pontos li{margin:4px 0}\n.t-app .t-pontos li.t-ativo{font-weight:bold}\n.t-app .t-pontos li.t-novo{animation:tSurge .6s}\n@keyframes tSurge{from{background:#fff3b0}to{background:transparent}}\n.t-app .t-legenda{font-size:14.5px;color:#26344f}\n.t-app .t-duvidaBox{border:2px solid #C0392B;border-radius:10px;padding:12px 14px;margin-top:12px;background:#fff}\n.t-app .t-estado{font-size:14px;margin:4px 0}\n.t-app .t-bola{display:inline-block;width:10px;height:10px;border-radius:50%;background:#aab;margin-right:6px;vertical-align:middle}\n.t-app .t-bola.t-on{background:#1E8A4C}\n.t-app .t-bola.t-fala{background:#2E62C6}\n.t-app .t-nivel{height:5px;background:#eee;border-radius:3px;overflow:hidden;max-width:220px;margin:4px 0}\n.t-app .t-nivel>div{height:100%;background:#1E8A4C;width:0}\n.t-app .t-conversa{max-height:260px;overflow:auto;margin-top:8px}\n.t-app .t-msg{border-radius:10px;padding:7px 10px;margin:6px 0;font-size:14px}\n.t-app .t-msg.t-ia{background:#eef3fc}\n.t-app .t-msg.t-eu{background:#f2f2f2;margin-left:30px}\n.t-app .t-msg .t-quem{font-size:11.5px;color:var(--cinza);font-weight:bold}\n.t-app .t-checagem{border:1px solid var(--linha);border-radius:10px;padding:12px 14px;margin-top:14px;background:#fff}\n.t-app button.t-op{display:block;width:100%;text-align:left;background:#fff;color:var(--navy);border:1.5px solid var(--linha);margin:6px 0;padding:9px 11px;font-weight:normal}\n.t-app button.t-op.t-certa{background:#e8f5ec;border-color:#1E8A4C}\n.t-app button.t-op.t-errada{background:#fdecea;border-color:#C0392B}\n.t-app .t-admNarr{margin-top:14px}\n.t-app .t-estNarr span{display:inline-block;width:18px;height:18px;border-radius:4px;margin:2px;font-size:10px;text-align:center;line-height:18px;color:#fff}\n.t-app .t-eixo{stroke:#4a5873;stroke-width:1.4}\n.t-app .t-grade{stroke:#e8edf5;stroke-width:1}\n.t-app .t-tick{font-size:13.5px;fill:#4a5873}\n.t-app .t-rotEixo{font-size:15px;fill:#26344f;font-weight:bold}\n.t-app .t-rot{font-size:15px;font-weight:bold;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}\n/* celular */\n@media (max-width:620px){\n  .t-app .t-palco{padding:8px 4px 2px;margin:0 -12px}\n  .t-app .t-controles{margin:0 -12px}\n  .t-app .t-titSlide{font-size:16px}\n  .t-app .t-controles{gap:6px;padding:8px}\n  .t-app .t-controles button.mini{padding:10px 13px;font-size:15px}\n  .t-app .t-controles .t-barra{order:10;flex-basis:100%}\n  .t-app .t-controles select{font-size:14px;padding:7px 6px}\n  .t-app .t-controles button.vermelho{flex:1 1 100%;order:11}\n  .t-app .t-rot{font-size:17px}\n  .t-app .t-tick{font-size:15px}\n  .t-app .t-rotEixo{font-size:16px}\n  .t-app button.t-op{padding:12px}\n  .t-app .t-msg.t-eu{margin-left:14px}\n}\n/* aula em vídeo (YouTube) */\n.t-app .t-videoBox{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;margin-top:6px}\n.t-app .t-videoBox.t-vertical{aspect-ratio:9/16;width:min(100%, calc(72vh * 9 / 16));margin:6px auto 0}\n.t-app .t-videoBox iframe{position:absolute;inset:0;width:100%;height:100%;border:0}\n.t-app .t-notaProf{background:#fff6dc;border-left:4px solid #B8890A;border-radius:0 8px 8px 0;padding:8px 10px;margin:8px 0 2px;font-size:14px}\n/* cena animada (moléculas), lousa escura abaixo do gráfico */\n.t-app .t-cenaBox{background:#2a2a2a;border-radius:8px;margin-top:8px;overflow:hidden}\n.t-app .t-cenaBox svg{width:100%;height:auto;display:block}\n.t-app .t-cenaBox.t-claro{background:#fff;border:1px solid #d8dee8}\n/* enquadramento: o gráfico nunca passa da tela; com cena, no computador, gráfico e lousa lado a lado */\n.t-app .t-quadro > svg{max-height:62vh}\n@media (min-width:900px){\n  .t-app .t-quadro.t-comCena{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center}\n  .t-app .t-quadro.t-comCena .t-cenaBox{margin-top:0}\n  .t-app .t-quadro.t-comCena > svg{max-height:52vh}\n}\n@media (max-width:899px){\n  .t-app .t-quadro.t-comCena > svg{max-height:40vh}\n}\n"; document.head.appendChild(st); }
    if(RAIZ === el && !mudou && document.getElementById('tr_corpo') && el.contains(document.getElementById('tr_corpo'))) return;
    if(RAIZ && RAIZ !== el){ pararTudo(); RAIZ.innerHTML = ''; }   // já aberta: mantém onde estava
    RAIZ = el; el.classList.add('t-app');
    el.innerHTML = MODO === 'aluno' ?
      '<h2>🎓 Aulas em trilha <span class="t-tag">prévia · só você vê</span></h2><p class="aviso" style="margin-top:-6px">Estude no seu ritmo: a aula anda sozinha, com narração, e você pode tirar dúvidas por voz.</p><div id="tr_erroGeral" class="erro oculto"></div><div id="tr_corpo"></div>' :
      '<div class="caixa"><h2>🎓 Aula em trilha <span class="t-tag">beta · só você vê</span></h2>' +
      '<p class="aviso" style="margin-top:-6px">Aqui você monta as aulas em trilha. Os alunos só assistem e interagem (na visão de aluno: Aluno → Aulas em trilha).</p>' +
      '<div id="tr_erroGeral" class="erro oculto"></div><div id="tr_corpo"></div></div>';
    inicio();
  },
  // saiu da aba: para a narração e a conversa
  voltar: function(){ inicio(); },
  parar: function(){ if(T){ pausar(); if(wsD) encerrarDuvida(); U.enviar(true); } }
};
})();
