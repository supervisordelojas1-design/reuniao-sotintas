/* ═══════════════════════════════════════════════════════════════
   Só Tintas App — acesso ao SERVIDOR DE DADOS (PDI, Níveis, Ranking, Mentor)

   Os dados não ficam mais nas páginas: cada painel pede ao servidor,
   que confere o CRACHÁ e devolve só o recorte da pessoa.
   O crachá nasce no login do app (nome + PIN) e vale 7 dias. Quem já
   estava logado confirma o PIN uma vez, numa janelinha.

   Uso nos painéis:  STDados.chamar('niveis').then(function(r){ ... })
   ═══════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var URL_DADOS = 'https://script.google.com/macros/s/AKfycbznIM0I8T-wkPiOvRbO-uhJifdyQUXToIwYd8PtEf855I5pFxb5nz5kn1eDm8HEy2JyEA/exec';
  var LS_SESSAO = 'sotintas_sessao_v1', LS_CRACHA = 'st_cracha_v1';

  function ler(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function sessao() { return ler(LS_SESSAO); }
  function post(corpo) {
    return fetch(URL_DADOS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corpo) })
      .then(function (r) { return r.json(); });
  }
  function guardar(r) { try { localStorage.setItem(LS_CRACHA, JSON.stringify({ nome: r.nome, tk: r.tk, ex: r.ex, perfil: r.perfil, lojas: r.lojas })); } catch (e) {} }
  function esquecer() { try { localStorage.removeItem(LS_CRACHA); } catch (e) {} }
  /* crachá válido e da MESMA pessoa logada no app */
  function crachaGuardado() {
    var c = ler(LS_CRACHA), s = sessao();
    if (!c || !c.tk || !s || !s.nome) return null;
    if (norm(c.nome) !== norm(s.nome) || !(c.ex > Date.now() + 60000)) return null;
    return c;
  }

  /* chamado pelo login do app, com o PIN que a pessoa acabou de digitar */
  function entrar(nome, pin) {
    return post({ acao: 'entrar', nome: nome, pin: pin }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.erro) || 'Não consegui confirmar o PIN.');
      guardar(r); return r;
    });
  }

  /* janelinha para confirmar o PIN (sessões antigas ou crachá vencido) */
  var pedindo = null;
  function pedirPin() {
    if (pedindo) return pedindo;
    pedindo = new Promise(function (ok, nao) {
      var s = sessao();
      var escuro = document.documentElement.getAttribute('data-theme') === 'dark';
      var cor = escuro ? { bg: '#1a2336', ink: '#eef2fb', mut: '#9aa5bb', lin: '#2c3850', campo: '#222d44' } : { bg: '#ffffff', ink: '#16233d', mut: '#5a677f', lin: '#e4e9f3', campo: '#f5f7fb' };
      var ov = document.createElement('div');
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'stdTit');
      ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(6,10,20,.66);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Public Sans",system-ui,sans-serif';
      ov.innerHTML = '<form style="width:100%;max-width:360px;background:' + cor.bg + ';color:' + cor.ink + ';border:1px solid ' + cor.lin + ';border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px">' +
        '<b id="stdTit" style="font-size:17px">Confirme seu PIN</b>' +
        '<span style="font-size:13px;color:' + cor.mut + '">Por segurança, os dados agora só abrem com o seu crachá. Digite o PIN do app uma vez; ele vale por 7 dias neste aparelho.</span>' +
        '<label style="font-size:12px;font-weight:700;color:' + cor.mut + '">' + String((s && s.nome) || '').replace(/</g, '&lt;') +
        '<input id="stdPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8" style="display:block;width:100%;margin-top:6px;padding:11px 12px;font-size:18px;letter-spacing:4px;border-radius:9px;border:1px solid ' + cor.lin + ';background:' + cor.campo + ';color:' + cor.ink + '"></label>' +
        '<span id="stdMsg" role="status" style="font-size:12.5px;color:#d9363e;min-height:16px"></span>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" id="stdCancel" style="padding:9px 14px;border-radius:9px;border:1px solid ' + cor.lin + ';background:transparent;color:' + cor.ink + ';font-weight:700;cursor:pointer">Cancelar</button>' +
        '<button type="submit" id="stdOk" style="padding:9px 16px;border-radius:9px;border:0;background:#1C3F8F;color:#fff;font-weight:700;cursor:pointer">Confirmar</button></div></form>';
      document.body.appendChild(ov);
      var pin = ov.querySelector('#stdPin'), msg = ov.querySelector('#stdMsg'), bt = ov.querySelector('#stdOk');
      setTimeout(function () { pin.focus(); }, 50);
      function fim() { ov.remove(); pedindo = null; }
      ov.querySelector('#stdCancel').onclick = function () { fim(); nao(new Error('PIN não confirmado.')); };
      ov.querySelector('form').onsubmit = function (e) {
        e.preventDefault();
        var p = pin.value.trim(); if (!p) { msg.textContent = 'Digite o PIN.'; return; }
        bt.disabled = true; bt.textContent = 'Conferindo…'; msg.textContent = '';
        entrar(s.nome, p).then(function (r) { fim(); ok(r.tk); })
          .catch(function (err) { bt.disabled = false; bt.textContent = 'Confirmar'; msg.textContent = err.message || 'PIN não confere.'; pin.select(); });
      };
    });
    return pedindo;
  }

  function cracha() {
    var c = crachaGuardado(); if (c) return Promise.resolve(c.tk);
    var s = sessao(); if (!s || !s.nome) return Promise.reject(new Error('Entre no Só Tintas App primeiro.'));
    return pedirPin();
  }

  /* pede dados ao servidor; se o crachá venceu ou não vale, pede o PIN e tenta de novo */
  function chamar(acao, extra) {
    function vai(tk) { var b = { acao: acao, tk: tk }; for (var k in (extra || {})) b[k] = extra[k]; return post(b); }
    return cracha().then(vai).then(function (r) {
      if (r && !r.ok && r.cracha) { esquecer(); return cracha().then(vai); }
      return r;
    });
  }

  function perfil() { var c = crachaGuardado(); return c ? c.perfil : null; }

  g.STDados = { URL: URL_DADOS, chamar: chamar, entrar: entrar, cracha: cracha, esquecer: esquecer, perfil: perfil, crachaGuardado: crachaGuardado };
})(window);
