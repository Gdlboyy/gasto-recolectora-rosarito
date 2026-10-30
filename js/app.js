(function () {
  'use strict';

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  function $(id) { return document.getElementById(id); }

  function parseFecha(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function fechaCorta(s) {
    var d = parseFecha(s);
    return d.getDate() + ' ' + MESES[d.getMonth()];
  }

  function fechaLarga(s) {
    var d = parseFecha(s);
    return d.getDate() + ' de ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
  }

  function dinero(n) {
    return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function entero(n) {
    return n.toLocaleString('es-MX');
  }

  function el(tag, attrs, text) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }

  function diasEntre(a, b) {
    return Math.round((parseFecha(b) - parseFecha(a)) / 86400000);
  }

  function render(data) {
    var dias = data.dias.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
    var gasto = dias.reduce(function (s, d) { return s + d.gasto; }, 0);
    var conv = dias.reduce(function (s, d) { return s + d.conversaciones; }, 0);

    // KPIs
    $('kGasto').textContent = dinero(gasto);
    $('kConv').textContent = entero(conv);
    $('kCosto').textContent = conv ? dinero(gasto / conv) : '—';
    $('kAlcance').textContent = entero(data.totales.alcance);

    // Campaña
    var c = data.campana;
    $('cNombre').textContent = c.nombre;
    $('cPeriodo').textContent = fechaCorta(c.inicio) + ' – ' + fechaCorta(c.fin);
    $('cPresupuesto').textContent = '$' + entero(c.presupuestoDiario) + ' al día';
    $('cObjetivo').textContent = c.objetivo;
    $('cZona').textContent = c.zona;

    var total = diasEntre(c.inicio, c.fin) + 1;
    var corridos = Math.min(total, Math.max(0, diasEntre(c.inicio, data.actualizado) + 1));
    var activa = data.actualizado <= c.fin;
    if (!activa) {
      $('cEstado').textContent = 'TERMINADA';
      $('cEstado').classList.add('off');
    }
    $('cDias').textContent = 'Día ' + corridos + ' de ' + total +
      (activa ? ' · termina el ' + fechaLarga(c.fin) : ' · terminó el ' + fechaLarga(c.fin));
    requestAnimationFrame(function () {
      $('cBar').style.width = (corridos / total * 100) + '%';
    });

    renderChart(dias, data.actualizado);
    var ancho = $('chart').clientWidth, t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if ($('chart').clientWidth !== ancho) {
          ancho = $('chart').clientWidth;
          renderChart(dias, data.actualizado);
        }
      }, 150);
    });
    renderAds(data.anuncios);
    renderTabla(dias, gasto, conv);

    $('fFuente').textContent = data.fuente;
    $('fActualizado').textContent = fechaLarga(data.actualizado);
  }

  function renderChart(dias, hoy) {
    // El ancho del SVG sigue al contenedor para que el texto no se encoja en celular.
    var W = Math.max(320, Math.round($('chart').clientWidth) || 720);
    var H = 300, padL = 4, padR = 4, padB = 44;
    var convTop = 22, convH = 56;          // franja de conversaciones
    var padT = convTop + convH + 24;       // las barras empiezan debajo
    var n = dias.length;
    var maxG = Math.max.apply(null, dias.map(function (d) { return d.gasto; })) || 1;
    var maxC = Math.max.apply(null, dias.map(function (d) { return d.conversaciones; })) || 1;
    var colW = (W - padL - padR) / n;
    var barW = Math.min(56, colW * 0.56);
    var plotH = H - padT - padB;

    $('chart').textContent = '';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet' });
    var defs = el('defs', {});
    var grad = el('linearGradient', { id: 'todayFill', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': '#1F9D5B' }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': '#1F9D5B', 'stop-opacity': '.35' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    svg.appendChild(el('line', { class: 'grid', x1: padL, x2: W - padR, y1: convTop + convH + 10, y2: convTop + convH + 10 }));
    svg.appendChild(el('line', { class: 'grid', x1: padL, x2: W - padR, y1: padT + plotH, y2: padT + plotH }));

    var pts = [];
    dias.forEach(function (d, i) {
      var cx = padL + colW * i + colW / 2;
      var h = d.gasto / maxG * plotH;
      var y = padT + plotH - h;
      var g = el('g', { class: 'col' });
      var t = el('title', {}, fechaCorta(d.fecha) + ': $' + dinero(d.gasto) + ' · ' + d.conversaciones + ' conversaciones');
      g.appendChild(t);
      g.appendChild(el('rect', {
        class: 'bar' + (d.fecha === hoy ? ' today' : ''),
        x: cx - barW / 2, y: y, width: barW, height: Math.max(h, 2), rx: 6
      }));
      g.appendChild(el('text', { class: 'val', x: cx, y: padT + plotH - 8, 'text-anchor': 'middle' }, '$' + Math.round(d.gasto)));
      var dd = parseFecha(d.fecha);
      g.appendChild(el('text', { class: 'lab', x: cx, y: H - 24, 'text-anchor': 'middle' }, DIAS[dd.getDay()]));
      g.appendChild(el('text', { class: 'lab', x: cx, y: H - 8, 'text-anchor': 'middle' }, fechaCorta(d.fecha)));
      svg.appendChild(g);
      pts.push([cx, convTop + convH * (1 - d.conversaciones / maxC), d.conversaciones]);
    });

    svg.appendChild(el('polyline', { class: 'line', points: pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') }));
    pts.forEach(function (p) {
      svg.appendChild(el('circle', { class: 'dot', cx: p[0], cy: p[1], r: 5 }));
      svg.appendChild(el('text', { class: 'cval', x: p[0], y: p[1] - 11, 'text-anchor': 'middle' }, p[2]));
    });

    $('chart').appendChild(svg);
  }

  function renderAds(anuncios) {
    var wrap = $('ads');
    anuncios.forEach(function (a) {
      var card = document.createElement('div');
      card.className = 'ad' + (a.gasto === 0 ? ' pending' : '');
      var costo = a.conversaciones ? '$' + dinero(a.gasto / a.conversaciones) : '—';
      card.innerHTML =
        '<div class="ad-head"><span class="ad-name"></span><span class="ad-type"></span></div>' +
        '<div class="ad-stats">' +
          '<div><b>$' + dinero(a.gasto) + '</b><span>invertido</span></div>' +
          '<div><b>' + entero(a.conversaciones) + '</b><span>conversaciones</span></div>' +
          '<div><b>' + costo + '</b><span>por conversación</span></div>' +
        '</div>';
      card.querySelector('.ad-name').textContent = a.nombre;
      card.querySelector('.ad-type').textContent = a.tipo + ' · desde ' + fechaCorta(a.inicio);
      if (a.nota) {
        var p = document.createElement('p');
        p.className = 'ad-note';
        p.textContent = a.nota;
        card.appendChild(p);
      }
      wrap.appendChild(card);
    });
  }

  function renderTabla(dias, gasto, conv) {
    var body = $('tblBody');
    var impr = 0;
    dias.slice().reverse().forEach(function (d) {
      impr += d.impresiones;
      var tr = document.createElement('tr');
      [
        fechaCorta(d.fecha),
        '$' + dinero(d.gasto),
        entero(d.conversaciones),
        d.conversaciones ? '$' + dinero(d.gasto / d.conversaciones) : '—',
        entero(d.impresiones)
      ].forEach(function (v) {
        var td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    var foot = document.createElement('tfoot');
    foot.innerHTML = '<tr><td>Total</td><td>$' + dinero(gasto) + '</td><td>' + entero(conv) +
      '</td><td>' + (conv ? '$' + dinero(gasto / conv) : '—') + '</td><td>' + entero(impr) + '</td></tr>';
    body.parentNode.appendChild(foot);

    var btn = $('tblToggle');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      $('tblWrap').hidden = open;
    });
  }

  fetch('data/gastos.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () {
      $('cNombre').textContent = 'No se pudieron cargar los datos.';
    });
})();
