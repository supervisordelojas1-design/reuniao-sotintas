/* ═══════════ Hora oficial do app: sempre horário de Brasília (America/Sao_Paulo) ═══════════
   O celular pode estar em outro fuso ou com o relógio configurado errado de fuso; o app mostra
   e calcula "hoje", "agora" e saudações pela hora de Brasília.
   STHora.data(ms?)  → Date cujos getHours()/getDate()… são os de Brasília (use só para exibir)
   STHora.hm(ms?)    → "23:45"
   STHora.dataBr(ms?)→ "21/10/2026"
   STHora.iso(ms?)   → "2026-10-21" (dia de Brasília)                                         */
(function (g) {
  'use strict';
  var TZ = 'America/Sao_Paulo', fmt = null;
  try { fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch (e) { fmt = null; }
  function data(ms) {
    var d = ms == null ? new Date() : new Date(ms);
    if (isNaN(d)) return d;
    if (fmt && fmt.formatToParts) {
      try {
        var p = {}; fmt.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
        return new Date(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      } catch (e) {}
    }
    /* sem Intl: Brasília é UTC−3 (sem horário de verão desde 2019) */
    return new Date(d.getTime() + (d.getTimezoneOffset() - 180) * 60000);
  }
  var z = function (n) { return (n < 10 ? '0' : '') + n; };
  function hm(ms) { var d = data(ms); return z(d.getHours()) + ':' + z(d.getMinutes()); }
  function dataBr(ms) { var d = data(ms); return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function iso(ms) { var d = data(ms); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  /* liga um elemento a um relógio que se atualiza sozinho */
  function relogio(el, comSeg) {
    if (!el) return;
    var t = function () { var d = data(); el.textContent = z(d.getHours()) + ':' + z(d.getMinutes()) + (comSeg ? ':' + z(d.getSeconds()) : ''); };
    t(); return setInterval(t, comSeg ? 1000 : 5000);
  }
  g.STHora = { data: data, hm: hm, dataBr: dataBr, iso: iso, relogio: relogio, fuso: TZ };
})(window);
