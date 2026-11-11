/* Meta do dia aos gerentes — dados que só existem no Painel de Metas.
   Rodar na aba https://supervisordelojas1-design.github.io/reuniao-sotintas/painel.html (logado, mês em andamento),
   depois de o Painel ter sido atualizado com os arquivos do dia. Cole o arquivo inteiro na ferramenta de JavaScript.
     1. responde 'disparado' e percorre as 30 lojas (perfil "Gerente — loja"), lendo a meta/litragem Eucatex
        da loja e de cada vendedor (≈2 min)
     2. confira:  JSON.stringify([window.__EXTRA_OK, window.__EXTRA_ERRO, Object.keys((window.__EXTRA||{}).euc||{}).length])
     3. quando __EXTRA_OK = true, baixa "meta_dia_extra_AAAAMMDD.json" na pasta Downloads:
        { euc: {cod:{loja:[meta,litros], vend:{nome:[meta,litros]}}}, ger: {cod:{loja,gerente,email}},
          orc: {cod:[[vendedor, cliente, valor, dias, número]]}, crm: {número:[situação, previsão, próximo contato, data do último registro]} }
        (orc e crm alimentam o bloco "Orçamentos para retornar hoje"; se o CRM não responder, vem crm_erro e o e-mail sai sem o bloco)
   Só lê a tela, o cadastro EQUIPE, o pacote do Painel e os registros do CRM; não altera nada. */
(function () {
  window.__EXTRA_OK = false; window.__EXTRA_ERRO = null; window.__EXTRA = { euc: {}, ger: {} };
  (async function () {
    try {
      var X = window.__EXTRA, espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
      var num = function (s) { return Number(String(s).replace(/\./g, '').replace(',', '.')); };
      var sp = document.getElementById('selPerfil'); if (!sp) throw new Error('seletor de perfil não encontrado (Painel logado?)');
      var lojas = [].slice.call(sp.options).map(function (o) { return o.value; }).filter(function (v) { return v.indexOf('loja:') === 0; });
      for (var i = 0; i < lojas.length; i++) {
        sp.value = lojas[i]; sp.dispatchEvent(new Event('change', { bubbles: true })); await espera(2500);
        var rs = document.querySelectorAll('.row.exp'); for (var k = 0; k < rs.length; k++) { rs[k].click(); await espera(300); }
        var t = document.body.innerText, a = t.indexOf('Meta de litragem Eucatex');
        var ml = a >= 0 ? t.slice(a).match(/meta ([\d.]+) L · vendido ([\d.]+) L/) : null;
        var b = t.search(/Vendedores\n\d+ com meta/), s = b >= 0 ? t.slice(b) : '', V = {}, cur = null, m;
        var re = /\n\d+\n([^\n]+?)V\d[^\n]*\n|meta ([\d.]+) L · vendido ([\d.]+) L/g;
        while ((m = re.exec(s))) { if (m[1]) cur = m[1].trim(); else if (cur) { V[cur] = [num(m[2]), num(m[3])]; cur = null; } }
        X.euc[lojas[i].slice(5)] = { loja: ml ? [num(ml[1]), num(ml[2])] : null, vend: V };
      }
      sp.value = 'geral'; sp.dispatchEvent(new Event('change', { bubbles: true }));
      var j = await fetch('https://script.google.com/macros/s/AKfycbxC916U8rNw_-HFTW7vtFZz4AC_B1bHcTLE3bvMDWji6E5lAqkXgC0EIgQFtjHYTp8I/exec?acao=equipe').then(function (r) { return r.json(); });
      for (var g in j.gerentes) { var G = j.gerentes[g], cod = String(parseInt(G.loja, 10)).padStart(3, '0'), p = j.equipe[G.gerente] || {};
        X.ger[cod] = { loja: G.loja, gerente: G.gerente, email: p.email || null }; }
      /* orçamentos em aberto (pacote do Painel) e situação de cada um no CRM de Vendas */
      try {
        var ck = window.STDados && STDados.crachaGuardado && STDados.crachaGuardado(true);
        if (!ck || !ck.tk) throw new Error('sem crachá do app nesta aba');
        var pk = await fetch('https://script.google.com/macros/s/AKfycbzVe8joykFt0rWX9CjFgpeOaABckMFttVwV8u4e-yJh8qXPr6JTmlAzfgNjiAPAHGEwLg/exec', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipo: 'dados', u: 'cracha', p: ck.tk }) }).then(function (r) { return r.json(); });
        var O = ((pk && pk.dados) || pk || {}).O; if (!O) throw new Error('pacote do Painel sem orçamentos');
        var agora = new Date(), base = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12), orc = {}, cods = [];
        var dt = function (x) { var t = String(x || ''), m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t); if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12); var d = new Date(t); return isNaN(d.getTime()) ? null : d; };
        Object.keys(O).forEach(function (c) { var cod = ('00' + String(c).replace(/\D/g, '')).slice(-3); cods.push(cod);
          orc[cod] = (O[c] || []).filter(function (r) { return r && r[6]; }).map(function (r) { var d = dt(r[2]); return [String(r[0] || ''), String(r[3] || ''), Number(r[5]) || 0, d ? Math.max(0, Math.round((base - d) / 86400000)) : null, String(r[6])]; }); });
        var lr = await STDados.chamar('crmListar', { lojas: cods }, true);
        if (!lr || !lr.ok) throw new Error((lr && lr.erro) || 'o servidor do CRM não respondeu');
        var ult = {};
        (lr.regs || []).forEach(function (r) { if ((r.tipo || 'orc') !== 'orc' || r.status === 'contato') return; var a = ult[r.doc]; if (!a || String(r.em) > String(a.em)) ult[r.doc] = r; });
        X.crm = {}; Object.keys(ult).forEach(function (k) { var r = ult[k]; X.crm[k] = [r.status, r.prev || '', r.prox || '', String(r.em).slice(0, 10)]; });
        X.orc = orc;
      } catch (e) { X.crm_erro = (e && e.message) || String(e); }
      var hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(/-/g, '');
      var el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([JSON.stringify(X)], { type: 'application/json' }));
      el.download = 'meta_dia_extra_' + hoje + '.json'; document.body.appendChild(el); el.click();
      window.__EXTRA_OK = true;
    } catch (e) { window.__EXTRA_ERRO = (e && e.message) || String(e); }
  })();
  return 'disparado';
})();
