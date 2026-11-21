/* =====================================================================
   "💬 Avisar" — o mesmo botão em todas as páginas (Aulas, Prova por IA, Progressão, Entrevista, Avaliador…)
   Aluno ou professor manda: 🐞 erro, ❌ conteúdo errado ou 💡 sugestão. A tela em que ele estava vai junto.
   O servidor faz a triagem na hora (IA) e avisa o administrador (e, se for conteúdo, o professor da matéria);
   a revisão da madrugada investiga. Quem mandou recebe "recebido" e, se o aviso for aproveitado, a resposta.
   Também anota no servidor os erros que só o navegador vê (ex.: a voz derrubada pelo Google).
   Cada página pode completar o contexto com window.contextoAvisoPagina() (ex.: aula e passo abertos).
   O administrador não vê o botão (os avisos vão para ele).
   ===================================================================== */
(function () {
  var BACKEND = 'https://script.google.com/macros/s/AKfycbyK-YXssnq1iBhqVAPMl4BlccH7eI1-0U9EqqOKV7vgK0qJSe9rgo51XZKxK45V2gOj/exec';
  function tokenAtual() { try { return localStorage.getItem('ip_token') || sessionStorage.getItem('ip_token') || ''; } catch (e) { return ''; } }
  function chamar(acao, dados) {
    dados = dados || {}; dados.token = tokenAtual();
    return fetch(BACKEND, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ acao: acao, dados: dados }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.erro === 'SESSAO' ? 'Sua sessão expirou. Entre de novo.' : (j.erro || 'Não deu para enviar.')); return j.resultado; });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- erros que só o navegador vê ----------
  var enviados = 0;
  window.reportarErroTela = function (onde, msg, ctx) {
    window.ULTIMO_ERRO = { msg: String(onde) + ': ' + String(msg || '').slice(0, 180), em: new Date().toLocaleTimeString() };
    if (!tokenAtual() || enviados >= 8) return;   // no máximo 8 por página aberta
    enviados++;
    chamar('erroCliente', { onde: onde, mensagem: String(msg || ''), contexto: Object.assign({ pagina: location.pathname.split('/').pop() || 'index.html' }, ctx || {}) }).catch(function () {});
  };
  window.addEventListener('error', function (e) { if (e && e.message && !/Script error/i.test(e.message)) window.reportarErroTela('erro de programa na página', e.message + (e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : '')); });
  window.addEventListener('unhandledrejection', function (e) { var m = e && e.reason && (e.reason.message || String(e.reason)); if (m && !/sessão expirou|Failed to fetch|NetworkError|Load failed/i.test(m)) window.reportarErroTela('erro de programa na página', m); });
  // a última mensagem de erro que apareceu na tela (as páginas usam a classe "erro") vai junto no aviso
  try {
    new MutationObserver(function (lista) {
      lista.forEach(function (m) { (m.addedNodes || []).forEach(function (n) {
        if (n.nodeType !== 1) return;
        var el = n.classList && n.classList.contains('erro') ? n : (n.querySelector && n.querySelector('.erro'));
        if (el && el.textContent && el.textContent.trim().length > 3 && !el.closest('#avisoFundo')) window.ULTIMO_ERRO = { msg: el.textContent.trim().slice(0, 200), em: new Date().toLocaleTimeString() };
      }); });
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) { /* navegador antigo */ }

  // ---------- contexto: onde a pessoa estava ----------
  function contexto() {
    var c = { pagina: location.pathname.split('/').pop() || 'index.html', titulo: document.title, largura: window.innerWidth, celular: /Mobi|Android|iPhone/i.test(navigator.userAgent) };
    try { var abas = Array.prototype.slice.call(document.querySelectorAll('[aria-pressed="true"]')).map(function (b) { return b.textContent.trim().slice(0, 40); }).filter(Boolean).slice(0, 4); if (abas.length) c.abas = abas; } catch (e) {}
    try { if (typeof window.contextoAvisoPagina === 'function') Object.assign(c, window.contextoAvisoPagina() || {}); } catch (e) {}
    if (window.ULTIMO_ERRO) c.ultimoErro = window.ULTIMO_ERRO;
    return c;
  }

  // ---------- o botão e a janela ----------
  var TIPOS = [['erro', '🐞 Algo deu erro', 'travou, não carregou, a voz não funcionou…'], ['conteudo', '❌ Conteúdo errado', 'questão com gabarito errado, aula ou documento com informação errada…'], ['sugestao', '💡 Sugestão', 'uma ideia para melhorar']];
  function lerVistos() { try { return JSON.parse(localStorage.getItem('avisos_vistos') || '{}'); } catch (e) { return {}; } }
  function pintarBotao(b, temNovidade) { b.innerHTML = '💬 Avisar' + (temNovidade ? ' <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#c62828;margin-left:3px"></span>' : ''); }
  function criarBotao() {
    if (document.getElementById('btAvisoAluno')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'btAvisoAluno';
    b.title = 'Avisar um erro, um conteúdo errado ou mandar uma sugestão';
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;max-width:calc(100% - 24px);z-index:9998;border:1px solid #c9d3e3;border-radius:999px;padding:8px 13px;font-size:13.5px;background:#fff;color:#1f2a44;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:pointer;font-family:inherit';
    pintarBotao(b, false);
    document.body.appendChild(b);
    b.addEventListener('click', abrir);
    chamar('meusAvisos', {}).then(function (l) { var v = lerVistos(); pintarBotao(b, (l || []).some(function (a) { return a.resposta && !v[a.id]; })); }).catch(function () {});
  }
  function abrir() {
    if (document.getElementById('avisoFundo')) return;
    var ctx = contexto(), tipo = '';
    var fundo = document.createElement('div'); fundo.id = 'avisoFundo';
    fundo.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10000;display:flex;align-items:flex-end;justify-content:center;font-family:inherit';
    var onde = [ctx.materia, ctx.aula ? 'aula "' + ctx.aula.titulo + '", passo ' + ctx.aula.passo : '', ctx.questao ? 'questão sobre ' + ctx.questao.tema : ''].filter(Boolean).join(' · ') || ('a tela em que você está (' + ctx.titulo + ')');
    var bt = 'border:1px solid #c9d3e3;border-radius:10px;background:#fff;color:#1f2a44;cursor:pointer;font-family:inherit';
    fundo.innerHTML = '<div style="background:#fff;color:#1f2a44;width:100%;max-width:520px;max-height:92vh;overflow:auto;border-radius:14px 14px 0 0;padding:16px 16px 20px;box-sizing:border-box;font-size:15px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px">💬 Avisar ou sugerir</b><button type="button" id="avFechar" style="border:0;background:none;font-size:20px;cursor:pointer" aria-label="Fechar">✕</button></div>' +
      '<p style="margin:6px 0 10px;color:#4b5563">O que você quer mandar?</p><div style="display:grid;gap:8px">' +
      TIPOS.map(function (t) { return '<button type="button" data-avtipo="' + t[0] + '" style="' + bt + ';text-align:left;padding:10px 12px"><b>' + t[1] + '</b><br><span style="font-size:12.5px;color:#4b5563">' + t[2] + '</span></button>'; }).join('') + '</div>' +
      '<textarea id="avTexto" maxlength="1500" style="margin-top:10px;min-height:96px;width:100%;box-sizing:border-box;font-family:inherit;font-size:15px;padding:8px;border:1px solid #c9d3e3;border-radius:8px" placeholder="Conte o que aconteceu ou a sua ideia (uma frase já ajuda)"></textarea>' +
      '<p style="margin:6px 0 0;font-size:12.5px;color:#4b5563">Vai junto, para ajudar a achar o problema: ' + esc(onde) + (ctx.ultimoErro ? ' e o último erro que apareceu' : '') + '.</p>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:10px"><button type="button" id="avEnviar" disabled style="border:0;border-radius:10px;background:#17389C;color:#fff;padding:9px 18px;font-size:15px;cursor:pointer;font-family:inherit">Enviar</button>' +
      '<button type="button" id="avMeus" style="border:0;background:none;color:#17389C;text-decoration:underline;cursor:pointer;font-size:14px;font-family:inherit">Meus avisos</button></div><div id="avMsg"></div><div id="avLista"></div></div>';
    document.body.appendChild(fundo);
    // a janela usa a largura VISÍVEL da tela (algumas páginas são mais largas que o celular e esticariam a janela)
    try { var vis = document.documentElement.clientWidth || window.innerWidth, card = fundo.firstElementChild, w = Math.min(520, vis);
      fundo.style.justifyContent = 'flex-start'; card.style.maxWidth = w + 'px'; card.style.marginLeft = Math.max(0, (vis - w) / 2) + 'px'; } catch (e) {}
    var $ = function (id) { return document.getElementById(id); }, fechar = function () { fundo.remove(); };
    fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });
    $('avFechar').addEventListener('click', fechar);
    var pode = function () { $('avEnviar').disabled = !tipo || $('avTexto').value.trim().length < 5; $('avEnviar').style.opacity = $('avEnviar').disabled ? .5 : 1; };
    pode();
    fundo.querySelectorAll('[data-avtipo]').forEach(function (b) { b.addEventListener('click', function () { tipo = b.dataset.avtipo; fundo.querySelectorAll('[data-avtipo]').forEach(function (x) { x.style.outline = x === b ? '2px solid #17389C' : 'none'; }); pode(); $('avTexto').focus(); }); });
    $('avTexto').addEventListener('input', pode);
    $('avEnviar').addEventListener('click', function () {
      var b = this; b.disabled = true; b.textContent = 'Enviando…';
      chamar('avisoEnviar', { tipo: tipo, texto: $('avTexto').value, contexto: ctx }).then(function (r) {
        $('avMsg').innerHTML = '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#e8f5ec;color:#1e6b3a">' + esc(r.mensagem) + '</div>';
        $('avTexto').value = ''; b.textContent = 'Enviar'; window.ULTIMO_ERRO = null; pode();
      }).catch(function (e) { b.disabled = false; b.textContent = 'Enviar'; $('avMsg').innerHTML = '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#fdecea;color:#b3261e">' + esc(e.message) + '</div>'; });
    });
    $('avMeus').addEventListener('click', function () {
      var box = $('avLista'); box.innerHTML = '<p style="color:#4b5563">Carregando…</p>';
      chamar('meusAvisos', {}).then(function (l) {
        var v = lerVistos();
        box.innerHTML = l.length ? l.map(function (a) { if (a.resposta) v[a.id] = 1;
          return '<div style="border-top:1px solid #e5e7eb;padding:8px 0;font-size:14px"><span style="color:#6b7280;font-size:12.5px">' + esc(a.em) + '</span><br>' + esc(a.texto) +
            (a.resposta ? '<div style="margin-top:6px;padding:6px 9px;border-radius:8px;background:#e8f5ec;color:#1e6b3a">↩ ' + esc(a.resposta) + '</div>' : '<div style="color:#6b7280;font-size:12.5px">recebido</div>') + '</div>'; }).join('') : '<p style="color:#4b5563">Você ainda não mandou avisos.</p>';
        try { localStorage.setItem('avisos_vistos', JSON.stringify(v)); } catch (e) {}
        var bb = document.getElementById('btAvisoAluno'); if (bb) pintarBotao(bb, false);
      }).catch(function (e) { box.innerHTML = '<p style="color:#b3261e">' + esc(e.message) + '</p>'; });
    });
  }
  // mostra o botão para quem está logado (menos o administrador, que é quem recebe os avisos)
  var tentativas = 0;
  function iniciar() {
    if (!document.body) { setTimeout(iniciar, 300); return; }
    if (!tokenAtual()) { if (++tentativas < 40) setTimeout(iniciar, 1500); return; }   // espera o login da página
    chamar('sessao', {}).then(function (s) { if (s && s.logado !== false && !s.admin) criarBotao(); }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
