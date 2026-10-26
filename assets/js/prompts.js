/* ============================================================
   PÁGINAS DE PROMPT — comportamento
   1. Botão copiar (clipboard + fallback execCommand)
   2. Gradiente de "há mais texto" some ao chegar no fim da rolagem
   Sem regex sobre o texto do prompt: o que sai é textContent puro.
   ============================================================ */
(function () {
  'use strict';

  var RETORNO_MS = 2000;

  function copiaFallback(texto) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function ligaBotao(btn) {
    var alvo = document.getElementById(btn.getAttribute('data-alvo'));
    if (!alvo) return;

    var rotuloPadrao = btn.textContent;
    var timer = null;

    /* último recurso: deixa o prompt já selecionado, pra um Ctrl+C resolver */
    function selecionaAlvo() {
      try {
        var sel = window.getSelection();
        var faixa = document.createRange();
        faixa.selectNodeContents(alvo);
        sel.removeAllRanges();
        sel.addRange(faixa);
      } catch (e) { /* sem seleção, o texto continua visível e copiável à mão */ }
    }

    function confirma(ok) {
      if (!ok) selecionaAlvo();
      btn.textContent = ok ? 'COPIADO ✓' : 'SELECIONE E COPIE';
      btn.setAttribute('data-estado', ok ? 'ok' : 'erro');
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        btn.textContent = rotuloPadrao;
        btn.removeAttribute('data-estado');
      }, RETORNO_MS);
    }

    btn.addEventListener('click', function () {
      /* textContent, não innerText: preserva as quebras exatas e ignora
         a marcação dos cabeçalhos (<span class="ph">) sem tratar string */
      var texto = alvo.textContent;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(
          function () { confirma(true); },
          function () { confirma(copiaFallback(texto)); }
        );
      } else {
        confirma(copiaFallback(texto));
      }
    });
  }

  /* o gradiente de "há mais texto" é CSS puro (background-attachment: local),
     então não há nada de JS a ligar nele */

  function inicia() {
    var botoes = document.querySelectorAll('[data-alvo]');
    for (var i = 0; i < botoes.length; i++) ligaBotao(botoes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }
})();
