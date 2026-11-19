// Portafolio GRAJA — Jerónimo Grajales (versión 4)
(function () {
  var html = document.documentElement;
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NUMERO = '573196150221';
  var MENSAJE_BASE = 'Hola Jerónimo, vi tu portafolio y quiero contarte una idea.';
  var COLORES = { noche: '#0F0F0E', crema: '#F3EEE4', lima: '#D4F75A', coral: '#FF7A59' };

  function enlaceWa(texto) { return 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(texto || MENSAJE_BASE); }
  function limitar(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  // ---------- 1. WhatsApp con mensajes ya escritos ----------
  $$('.js-wa').forEach(function (a) { a.href = enlaceWa(a.dataset.mensaje); });

  // ---------- 2. Scroll suave (solo computador) ----------
  var lenis = null;
  if (punteroFino && !quieto && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    (function rafLenis(t) { lenis.raf(t); requestAnimationFrame(rafLenis); })(0);
    // Quieto mientras está la pantalla de carga
    if (html.classList.contains('con-intro') && !html.classList.contains('libre')) {
      lenis.stop();
      window.addEventListener('pagina-libre', function () { lenis.scrollTo(0, { immediate: true }); lenis.start(); });
    }
  }
  function irA(destino) {
    if (!destino) return;
    if (lenis) lenis.scrollTo(destino, { offset: 0, duration: 1.6 });
    else destino.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth' });
  }

  // Congelar el fondo con el menú abierto (también en iPhone)
  var bloqueado = false, guardado = 0;
  function bloquearScroll() {
    if (bloqueado) return;
    guardado = window.scrollY; bloqueado = true;
    if (lenis) lenis.stop();
    var s = document.body.style;
    s.position = 'fixed'; s.top = -guardado + 'px'; s.left = '0'; s.right = '0'; s.width = '100%';
  }
  function liberarScroll() {
    if (!bloqueado) return;
    var s = document.body.style;
    s.position = ''; s.top = ''; s.left = ''; s.right = ''; s.width = '';
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, guardado);
    html.style.scrollBehavior = '';
    bloqueado = false;
    if (lenis) lenis.start();
  }

  // ---------- 3. Menú de celular ----------
  var menuBoton = $('.menu-boton'), menuMovil = $('#menu-movil');
  function cerrarMenu() {
    if (!menuMovil.classList.contains('abierto')) return;
    menuMovil.classList.remove('abierto');
    menuMovil.setAttribute('inert', '');
    menuBoton.setAttribute('aria-expanded', 'false');
    menuBoton.setAttribute('aria-label', 'Abrir menú');
    liberarScroll();
  }
  menuBoton.addEventListener('click', function () {
    if (menuMovil.classList.contains('abierto')) { cerrarMenu(); return; }
    menuMovil.classList.add('abierto');
    menuMovil.removeAttribute('inert');
    menuBoton.setAttribute('aria-expanded', 'true');
    menuBoton.setAttribute('aria-label', 'Cerrar menú');
    bloquearScroll();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  // Enlaces internos: con el scroll suave
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      var estabaAbierto = menuMovil.classList.contains('abierto');
      cerrarMenu();
      setTimeout(function () { irA(destino); }, estabaAbierto ? 60 : 0);
    });
  });

  // ---------- 4. Partir títulos en letras ----------
  function partir(el) {
    var i = 0;
    var palabras = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    palabras.forEach(function (p, n) {
      var caja = document.createElement('span');
      caja.className = 'palabra';
      caja.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(p, function (ch) {
        var l = document.createElement('span');
        l.className = 'letra';
        l.style.setProperty('--i', i++);
        l.textContent = ch;
        caja.appendChild(l);
      });
      el.appendChild(caja);
      if (n < palabras.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  $$('.dividir, .paso__nombre').forEach(partir);

  // ---------- 5. Aparecer al entrar en pantalla ----------
  var vistos = $$('.revelar, .dividir, .pila');
  if ('IntersectionObserver' in window && !quieto) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    vistos.forEach(function (el) { io.observe(el); });
  } else {
    vistos.forEach(function (el) { el.classList.add('visto'); });
  }

  // ---------- 6. La página cambia de color al bajar ----------
  var meta = $('meta[name="theme-color"]');
  if ('IntersectionObserver' in window) {
    var ioTema = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var tema = e.target.dataset.tema;
        if (html.dataset.tema !== tema) {
          html.dataset.tema = tema;
          if (meta) meta.setAttribute('content', COLORES[tema] || COLORES.noche);
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    $$('[data-tema]').forEach(function (s) { if (s !== html) ioTema.observe(s); });
  }

  // ---------- 7. Entrada de la portada (después de la pantalla de carga) ----------
  var alListo = [];
  function marcarListo() {
    if (html.classList.contains('listo')) return;
    html.classList.add('listo');
    alListo.forEach(function (f) { f(); });
  }
  if (!html.classList.contains('con-intro') || html.classList.contains('intro-lista')) {
    requestAnimationFrame(marcarListo);
  } else {
    window.addEventListener('intro-lista', function () { setTimeout(marcarListo, 250); });
    setTimeout(marcarListo, 6000);
  }

  // ---------- 8. GRAJA hecha de píxeles ----------
  (function heroe() {
    var lienzo = $('.heroe__lienzo'), seccion = $('.heroe');
    if (!lienzo || !lienzo.getContext) return;
    var ctx = lienzo.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, n = 0, paso = 5, lado = 4;
    var hx, hy, x, y, vx, vy, dx, dy, tipo, t0;
    var raton = { x: -9999, y: -9999, dentro: false };
    var corriendo = false, visible = true, ultimoAncho = 0, inicio = 0, armado = false;
    var R = 110, fuerza = 7;

    function construir() {
      var r = lienzo.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      if (!W || !H) return;
      ultimoAncho = window.innerWidth;
      lienzo.width = W * dpr; lienzo.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var angosto = W < 700;
      paso = angosto ? 3 : (W > 1700 ? 6 : 5);
      lado = angosto ? 2.2 : paso - 1.2;
      R = angosto ? 52 : 80;
      fuerza = angosto ? 6 : 7;

      var off = document.createElement('canvas');
      off.width = W; off.height = H;
      var o = off.getContext('2d', { willReadFrequently: true });
      var estirar = angosto ? 'condensed' : 'expanded';
      function fuente(t) { o.font = (angosto ? 'condensed ' : 'expanded ') + '900 ' + t + 'px Archivo, sans-serif'; if ('fontStretch' in o) o.fontStretch = estirar; }
      fuente(100);
      var m = o.measureText('GRAJA');
      var asc = m.actualBoundingBoxAscent || 72;
      var margen = Math.max(16, Math.min(56, window.innerWidth * 0.04));
      // GRAJA ocupa casi todo el ancho en computador (~86 %, con aire a los lados) y en celular
      var t = (Math.min(W - margen * 2, window.innerWidth * (angosto ? 0.9 : 0.86))) / (m.width / 100 + 0.22);
      t = Math.min(t, (H * 0.86) / (asc / 100));
      fuente(t);
      var ancho = o.measureText('GRAJA').width;
      var alto = asc * t / 100;
      var total = ancho + t * 0.22;
      var x0 = (W - total) / 2, base = (H + alto) / 2;
      o.fillStyle = '#fff';
      o.fillText('GRAJA', x0, base);
      o.fillStyle = '#f00';
      o.beginPath(); o.arc(x0 + ancho + t * 0.13, base - t * 0.08, t * 0.08, 0, Math.PI * 2); o.fill();

      // La nota "pasa el cursor" queda justo debajo de la última A
      var nota = $(".heroe__nota"), marcaEl = lienzo.parentNode;
      if (nota) {
        var corrimiento = lienzo.getBoundingClientRect().left - marcaEl.getBoundingClientRect().left;
        var anchoGraj = o.measureText("GRAJ").width;
        var centroA = x0 + anchoGraj + (ancho - anchoGraj) / 2 + corrimiento;
        marcaEl.style.setProperty("--nx", Math.round(centroA + 8) + "px");
        marcaEl.style.setProperty("--ny", Math.round(base + Math.max(10, t * 0.06)) + "px");
      }

      var datos = o.getImageData(0, 0, W, H).data;
      var lx = [], ly = [], lt = [];
      for (var yy = 0; yy < H; yy += paso) {
        for (var xx = 0; xx < W; xx += paso) {
          var k = (yy * W + xx) * 4;
          if (datos[k + 3] > 128) { lx.push(xx); ly.push(yy); lt.push(datos[k + 1] < 128 ? 1 : 0); }
        }
      }
      var viejo = n;
      n = lx.length;
      hx = new Float32Array(lx); hy = new Float32Array(ly); tipo = new Uint8Array(lt);
      var nx = new Float32Array(n), ny = new Float32Array(n);
      vx = new Float32Array(n); vy = new Float32Array(n);
      dx = new Float32Array(n); dy = new Float32Array(n); t0 = new Float32Array(n);
      for (var i = 0; i < n; i++) {
        dx[i] = (Math.random() - 0.5) * 2;
        dy[i] = -Math.random() * 1.4 - 0.2;
        if (!armado && !quieto) {
          // nacen como polvo y se arman de izquierda a derecha
          var ang = Math.random() * Math.PI * 2, dist = (0.4 + Math.random()) * Math.max(W, H) * 0.6;
          nx[i] = hx[i] + Math.cos(ang) * dist;
          ny[i] = hy[i] + Math.sin(ang) * dist * 0.6;
          t0[i] = (hx[i] / W) * 700 + Math.random() * 500;
        } else if (viejo && x && i < viejo) {
          nx[i] = x[i]; ny[i] = y[i];
        } else { nx[i] = hx[i]; ny[i] = hy[i]; }
      }
      x = nx; y = ny;
      despertar();
    }

    function progresoScroll() {
      var h = seccion.offsetHeight || 1;
      return limitar(window.scrollY / (h * 0.85), 0, 1);
    }

    function cuadro(ahora) {
      if (!inicio) inicio = ahora;
      var transcurrido = armado ? 1e9 : ahora - inicio;
      var p = quieto ? 0 : progresoScroll();
      var p2 = p * p;
      var energia = 0;
      var mx = raton.x, my = raton.y, R2 = R * R;

      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1 - p * 0.85;
      ctx.beginPath();
      var caminoLima = new Path2D();
      for (var i = 0; i < n; i++) {
        if (transcurrido > t0[i]) {
          var tx = hx[i] + dx[i] * p2 * W * 0.5;
          var ty = hy[i] + dy[i] * p2 * H * 1.6;
          var ax = (tx - x[i]) * 0.055, ay = (ty - y[i]) * 0.055;
          if (raton.dentro) {
            var ddx = x[i] - mx, ddy = y[i] - my, d2 = ddx * ddx + ddy * ddy;
            if (d2 < R2 && d2 > 0.01) {
              var d = Math.sqrt(d2), f = (1 - d / R) * fuerza;
              ax += ddx / d * f; ay += ddy / d * f;
            }
          }
          vx[i] = (vx[i] + ax) * 0.84;
          vy[i] = (vy[i] + ay) * 0.84;
          x[i] += vx[i]; y[i] += vy[i];
          energia += Math.abs(vx[i]) + Math.abs(vy[i]);
        } else {
          energia += 1;
        }
        var lejos = Math.abs(x[i] - hx[i]) + Math.abs(y[i] - hy[i]);
        if (tipo[i] || (lejos > 6 && p < 0.05)) caminoLima.rect(x[i], y[i], lado, lado);
        else ctx.rect(x[i], y[i], lado, lado);
      }
      ctx.fillStyle = COLORES.crema; ctx.fill();
      ctx.fillStyle = COLORES.lima; ctx.fill(caminoLima);
      ctx.globalAlpha = 1;

      if (!armado && transcurrido > 1400) armado = true;
      if (quieto || (armado && !raton.dentro && energia < n * 0.02 && Math.abs(p - ultimoP) < 0.0005) || !visible) {
        corriendo = false;
      } else {
        requestAnimationFrame(cuadro);
      }
      ultimoP = p;
    }
    var ultimoP = 0;

    function despertar() {
      if (corriendo || !n) return;
      if (!html.classList.contains('listo')) return;
      corriendo = true;
      requestAnimationFrame(cuadro);
    }

    function moverRaton(cx, cy) {
      var r = lienzo.getBoundingClientRect();
      raton.x = cx - r.left; raton.y = cy - r.top;
      raton.dentro = raton.x > -R && raton.x < r.width + R && raton.y > -R && raton.y < r.height + R;
      despertar();
    }
    seccion.addEventListener('pointermove', function (e) { moverRaton(e.clientX, e.clientY); });
    seccion.addEventListener('pointerleave', function () { raton.dentro = false; });
    seccion.addEventListener('touchstart', function (e) { var t = e.touches[0]; moverRaton(t.clientX, t.clientY); }, { passive: true });
    seccion.addEventListener('touchmove', function (e) { var t = e.touches[0]; moverRaton(t.clientX, t.clientY); }, { passive: true });
    seccion.addEventListener('touchend', function () { setTimeout(function () { raton.dentro = false; }, 120); }, { passive: true });
    window.addEventListener('scroll', function () { if (visible) despertar(); }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) despertar(); }).observe(seccion);
    }
    var espera;
    window.addEventListener('resize', function () {
      if (window.innerWidth === ultimoAncho) return; // en el celular solo cambió la barra del navegador
      clearTimeout(espera);
      espera = setTimeout(function () { armado = true; construir(); }, 220);
    });

    html.classList.add('con-lienzo');
    function preparar() {
      var listo = function () { construir(); };
      try { document.fonts.load('900 100px Archivo').then(listo, listo); } catch (e) { listo(); }
    }
    preparar();
    alListo.push(function () { inicio = 0; despertar(); });

    // Aura de color que sigue al mouse
    if (punteroFino && !quieto) {
      var auras = $$('.heroe__aura span');
      auras.forEach(function (a) { a.style.transition = 'transform 1.6s cubic-bezier(.2,.8,.2,1)'; });
      seccion.addEventListener('pointermove', function (e) {
        var cx = (e.clientX / window.innerWidth - 0.5), cy = (e.clientY / window.innerHeight - 0.5);
        auras[0].style.setProperty('--ax', cx * 30 + 'vw'); auras[0].style.setProperty('--ay', cy * 30 + 'vh');
        auras[1].style.setProperty('--ax', -cx * 22 + 'vw'); auras[1].style.setProperty('--ay', -cy * 22 + 'vh');
      });
    }
  })();

  // ---------- 9. Manifiesto: palabra por palabra ----------
  var manifiesto = $('.js-palabras'), fichas = [];
  if (manifiesto) {
    (function envolver(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (h) {
        if (h.nodeType === 3) {
          var partes = h.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          partes.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = p;
            frag.appendChild(s); fichas.push(s);
          });
          h.parentNode.replaceChild(frag, h);
        } else if (h.classList && h.classList.contains('incrustada')) {
          fichas.push(h);
        } else if (h.nodeType === 1) {
          envolver(h);
        }
      });
    })(manifiesto);
    if (quieto) fichas.forEach(function (f) { f.classList.add('encendida'); });
  }
  var encendidas = -1;
  function actualizarManifiesto(vh) {
    if (!fichas.length || quieto) return;
    var r = manifiesto.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return;
    var p = (vh * 0.82 - r.top) / (r.height + vh * 0.2);
    var cuantas = Math.round(limitar(p, 0, 1) * fichas.length);
    if (cuantas === encendidas) return;
    encendidas = cuantas;
    fichas.forEach(function (f, i) { f.classList.toggle('encendida', i < cuantas); });
  }

  // ---------- 10. Franjas que no paran (y aceleran con el scroll) ----------
  (function franjas() {
    var pistas = $$('.franja__pista');
    if (!pistas.length || quieto) return;
    var estado = pistas.map(function (p, i) { return { el: p, x: 0, dir: i === 0 ? -1 : 1, copias: i === 0 ? 2 : 3, unidad: 0 }; });
    function medir() { estado.forEach(function (s) { s.unidad = s.el.scrollWidth / s.copias; }); }
    medir();
    window.addEventListener('resize', medir);
    var visible = false, corriendo = false, ultimoY = window.scrollY, ultimoT = 0, extra = 0;
    function cuadro(t) {
      var dt = ultimoT ? Math.min(t - ultimoT, 50) : 16;
      ultimoT = t;
      var y = window.scrollY, vel = y - ultimoY; ultimoY = y;
      extra += (Math.abs(vel) * 0.35 - extra) * 0.1;
      estado.forEach(function (s) {
        if (!s.unidad) return;
        s.x += s.dir * (0.05 * dt + extra);
        if (s.dir < 0 && s.x <= -s.unidad) s.x += s.unidad;
        if (s.dir > 0 && s.x >= 0) s.x -= s.unidad;
        s.el.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,0,0)';
      });
      if (visible) requestAnimationFrame(cuadro); else { corriendo = false; ultimoT = 0; }
    }
    estado[1].x = -estado[1].unidad;
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !corriendo) { corriendo = true; ultimoY = window.scrollY; requestAnimationFrame(cuadro); }
    }).observe($('.franjas'));
  })();

  // ---------- 11. Proyectos: tarjetas apiladas + pestañas ----------
  var casos = $$('.caso');
  function medirCasos() {
    var vh = window.innerHeight, base = (window.innerWidth < 700 ? 64 : 72) + 10;
    casos.forEach(function (c, i) {
      var alto = c.offsetHeight;
      var arriba = base + i * 14;
      if (alto > vh - arriba - 12) arriba = vh - alto - 12; // tarjeta más alta que la pantalla: se pega por abajo
      c.style.setProperty('--top', Math.round(arriba) + 'px');
      c._arriba = arriba;
    });
  }
  function actualizarCasos(vh) {
    if (quieto) return;
    for (var i = 0; i < casos.length - 1; i++) {
      var sig = casos[i + 1].getBoundingClientRect().top;
      var t = limitar(1 - (sig - casos[i + 1]._arriba) / (vh * 0.9), 0, 1);
      var interior = casos[i].firstElementChild;
      interior.style.setProperty('--s', (1 - t * 0.06).toFixed(4));
      interior.style.setProperty('--o', (t * 0.5).toFixed(3));
    }
  }

  function cambiarImagen(img, src, alt) {
    if (!img || img.getAttribute('src') === src) return;
    img.classList.add('cambiando');
    var nueva = new Image();
    var listo = false;
    var poner = function () {
      if (listo) return; listo = true;
      setTimeout(function () {
        img.src = src; img.alt = alt;
        requestAnimationFrame(function () { requestAnimationFrame(function () { img.classList.remove('cambiando'); }); });
      }, 260);
    };
    nueva.onload = nueva.onerror = poner;
    nueva.src = src;
  }
  $$('.caso').forEach(function (caso) {
    var nombre = ($('.caso__nombre', caso) || {}).textContent;
    var botones = $$('.pestana', caso);
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        botones.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        cambiarImagen($('.js-pc', caso), b.dataset.pc, nombre + ' en computador: ' + b.dataset.nombre);
        cambiarImagen($('.js-movil', caso), b.dataset.movil, nombre + ' en celular: ' + b.dataset.nombre);
      });
    });
  });
  // Precargar las demás pantallas cuando el navegador esté libre
  window.addEventListener('load', function () {
    var precargar = function () { $$('.pestana').forEach(function (b) { new Image().src = b.dataset.pc; new Image().src = b.dataset.movil; }); };
    if ('requestIdleCallback' in window) requestIdleCallback(precargar, { timeout: 4000 }); else setTimeout(precargar, 3000);
  });

  // ---------- 12. Listas que se despliegan ----------
  $$('.pliego__boton').forEach(function (b) {
    var panel = document.getElementById(b.getAttribute('aria-controls'));
    b.addEventListener('click', function () {
      var abrir = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      panel.classList.toggle('abierto', abrir);
      setTimeout(function () { if (lenis) lenis.resize(); medirCasos(); }, 750);
    });
    // El relleno lima entra y sale por el lado donde está el mouse
    var lado = function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--desde', (e.clientY - r.top < r.height / 2) ? '0%' : '100%');
    };
    b.addEventListener('pointerenter', lado);
    b.addEventListener('pointerleave', lado);
  });

  // ---------- 13. "Y también…": ideas que cambian solas ----------
  var palabra = $('.js-imagina');
  if (palabra && !quieto) {
    var ideas = ['una tienda en línea', 'reservas en línea', 'un chatbot', 'un catálogo digital', 'tu menú con QR', 'piezas para redes', 'lo que imagines'];
    var indice = 0;
    setInterval(function () {
      if (document.hidden) return;
      palabra.classList.add('sale');
      setTimeout(function () {
        indice = (indice + 1) % ideas.length;
        palabra.textContent = ideas[indice];
        palabra.classList.remove('sale');
        palabra.classList.add('entra');
        void palabra.offsetWidth;
        palabra.classList.remove('entra');
      }, 500);
    }, 2600);
  } else if (palabra) {
    palabra.textContent = 'lo que imagines';
  }

  // ---------- 14. Proceso: la pantalla se queda quieta y los pasos cambian ----------
  var proceso = $('.proceso'), pasos = $$('.paso'), marcas = $$('.proceso__marca'), riel = $('.proceso__riel');
  var pasoActual = -1;
  if (!quieto) html.classList.add('con-pin');
  function actualizarProceso(vh) {
    if (quieto || !proceso) return;
    var r = proceso.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    var p = limitar(-r.top / (r.height - vh), 0, 1);
    riel.style.setProperty('--avance', p.toFixed(4));
    var idx = Math.min(pasos.length - 1, Math.floor(p * pasos.length * 0.999));
    if (idx === pasoActual) return;
    pasoActual = idx;
    pasos.forEach(function (s, i) {
      s.classList.toggle('es-actual', i === idx);
      s.classList.toggle('ya', i < idx);
    });
    marcas.forEach(function (m, i) { m.classList.toggle('activa', i <= idx); });
  }

  // ---------- 15. Polaroids que se lanzan (computador) o se barajan (celular) ----------
  (function polaroids() {
    var pila = $('.pila');
    if (!pila) return;
    var fotos = $$('.polaroid', pila);
    var orden = fotos.slice();
    function apilar() { orden.forEach(function (f, i) { f.style.zIndex = i + 1; }); }
    apilar();

    if (punteroFino) {
      fotos.forEach(function (f) {
        var arrastre = null;
        f.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          f.setPointerCapture(e.pointerId);
          orden.splice(orden.indexOf(f), 1); orden.push(f); apilar();
          pila.classList.add('suelta');
          var dxp = parseFloat(f.style.getPropertyValue('--dx')) || 0;
          var dyp = parseFloat(f.style.getPropertyValue('--dy')) || 0;
          arrastre = { x0: e.clientX - dxp, y0: e.clientY - dyp, ux: e.clientX, uy: e.clientY, vx: 0, vy: 0, dx: dxp, dy: dyp };
          f.classList.add('agarrada');
        });
        f.addEventListener('pointermove', function (e) {
          if (!arrastre) return;
          arrastre.vx = e.clientX - arrastre.ux; arrastre.vy = e.clientY - arrastre.uy;
          arrastre.ux = e.clientX; arrastre.uy = e.clientY;
          arrastre.dx = e.clientX - arrastre.x0; arrastre.dy = e.clientY - arrastre.y0;
          f.style.setProperty('--dx', arrastre.dx + 'px');
          f.style.setProperty('--dy', arrastre.dy + 'px');
          f.style.setProperty('--dr', limitar(arrastre.vx * 0.6, -14, 14) + 'deg');
        });
        var soltar = function () {
          if (!arrastre) return;
          var r = pila.getBoundingClientRect();
          var fx = limitar(arrastre.dx + arrastre.vx * 9, -r.width * 0.42, r.width * 0.42);
          var fy = limitar(arrastre.dy + arrastre.vy * 9, -r.height * 0.32, r.height * 0.32);
          f.classList.remove('agarrada');
          f.style.setProperty('--dx', fx + 'px');
          f.style.setProperty('--dy', fy + 'px');
          f.style.setProperty('--dr', limitar(arrastre.vx * 1.2, -18, 18) + 'deg');
          arrastre = null;
        };
        f.addEventListener('pointerup', soltar);
        f.addEventListener('pointercancel', soltar);
      });
    } else {
      // Celular: tocar manda la foto de arriba al fondo
      var ocupado = false;
      pila.addEventListener('click', function () {
        if (ocupado) return;
        ocupado = true;
        pila.classList.add('suelta');
        var arriba = orden[orden.length - 1];
        arriba.style.setProperty('--dx', (pila.offsetWidth * 0.75) + 'px');
        arriba.style.setProperty('--dr', '16deg');
        setTimeout(function () {
          orden.pop(); orden.unshift(arriba); apilar();
          arriba.style.setProperty('--dx', '0px');
          arriba.style.setProperty('--dr', '0deg');
          setTimeout(function () { ocupado = false; }, 500);
        }, 420);
      });
    }
  })();

  // ---------- 16. Contacto: el mensaje se arma solo ----------
  var armador = $('.armador');
  if (armador) {
    var casillas = $$('input[type="checkbox"]', armador);
    var negocio = $('input[name="negocio"]', armador);
    var burbuja = $('.js-burbuja', armador);
    var enviar = $('.js-enviar', armador);
    var caja = burbuja.parentNode, turno = 0;
    // El texto se desvanece, la burbuja cambia de alto con suavidad y el texto nuevo aparece
    var cambiarMensaje = function (texto) {
      var mio = ++turno;
      caja.style.height = caja.offsetHeight + "px";
      burbuja.classList.add("cambiando-texto");
      setTimeout(function () {
        if (mio !== turno) return;
        var antes = caja.offsetHeight;
        burbuja.textContent = texto;
        caja.style.height = "auto";
        var despues = caja.offsetHeight;
        caja.style.height = antes + "px";
        void caja.offsetHeight;
        caja.style.height = despues + "px";
        burbuja.classList.remove("cambiando-texto");
        setTimeout(function () { if (mio === turno) caja.style.height = ""; }, 520);
      }, 220);
    };
    var componer = function () {
      var elegidos = casillas.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      var nombre = negocio.value.trim();
      var texto;
      if (!elegidos.length) {
        texto = MENSAJE_BASE;
      } else {
        var lista = elegidos.length === 1 ? elegidos[0] : elegidos.slice(0, -1).join(', ') + ' y ' + elegidos[elegidos.length - 1];
        texto = 'Hola Jerónimo, vi tu portafolio. Me interesa ' + lista + '.';
      }
      if (nombre) texto += ' Mi negocio se llama ' + nombre + '.';
      if (burbuja.textContent !== texto) cambiarMensaje(texto);
      enviar.href = enlaceWa(texto);
    };
    casillas.forEach(function (c) { c.addEventListener('change', componer); });
    negocio.addEventListener('input', componer);
    armador.addEventListener('submit', function (e) { e.preventDefault(); componer(); window.open(enviar.href, '_blank', 'noopener'); });
    componer();
  }

  // ---------- 17. GRAJA del pie: las letras respiran con el mouse ----------
  (function pie() {
    var letras = $$('.pie__grande span');
    if (!letras.length || quieto) return;
    var visible = false, corriendo = false, px = -1, estado = letras.map(function () { return { w: 900, a: 125 }; });
    function cuadro(t) {
      var cerca = punteroFino && px >= 0;
      letras.forEach(function (l, i) {
        var r = l.getBoundingClientRect(), centro = r.left + r.width / 2;
        var k;
        if (cerca) k = Math.max(0, 1 - Math.abs(px - centro) / (window.innerWidth * 0.28));
        else k = (Math.sin(t / 700 - i * 0.9) + 1) / 2 * 0.85; // en el celular respiran solas
        var w = 900 - k * 620, a = 125 - k * 55;
        estado[i].w += (w - estado[i].w) * 0.12;
        estado[i].a += (a - estado[i].a) * 0.12;
        l.style.setProperty('--w', estado[i].w.toFixed(1));
        l.style.setProperty('--a', estado[i].a.toFixed(1));
      });
      if (visible) requestAnimationFrame(cuadro); else corriendo = false;
    }
    var grande = $('.pie__grande');
    if (punteroFino) {
      grande.addEventListener('pointermove', function (e) { px = e.clientX; });
      grande.addEventListener('pointerleave', function () { px = -1; });
    }
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !corriendo) { corriendo = true; requestAnimationFrame(cuadro); }
    }).observe(grande);
  })();

  // ---------- 18. Cursor propio y botones magnéticos (computador) ----------
  if (punteroFino && !quieto) {
    html.classList.add('cursor-propio');
    var cursor = $('.cursor'), aro = $('.cursor__aro'), texto = $('.cursor__texto');
    var cx = innerWidth / 2, cy = innerHeight / 2, ax = cx, ay = cy, movido = false, cursorCorre = false;
    function cursorCuadro() {
      ax += (cx - ax) * 0.18; ay += (cy - ay) * 0.18;
      cursor.style.setProperty('--px', cx + 'px'); cursor.style.setProperty('--py', cy + 'px');
      cursor.style.setProperty('--ax', ax.toFixed(1) + 'px'); cursor.style.setProperty('--ay', ay.toFixed(1) + 'px');
      if (Math.abs(cx - ax) + Math.abs(cy - ay) > 0.3) requestAnimationFrame(cursorCuadro); else cursorCorre = false;
    }
    window.addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY;
      if (!movido) { movido = true; ax = cx; ay = cy; cursor.style.opacity = "1"; }
      if (!cursorCorre) { cursorCorre = true; requestAnimationFrame(cursorCuadro); }
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target : e.target.parentElement;
      var conTexto = t && t.closest('[data-cursor]');
      var enlace = t && t.closest('a, button, label, input');
      if (conTexto) {
        texto.textContent = conTexto.dataset.cursor;
        cursor.classList.add('con-texto'); cursor.classList.remove('sobre-enlace');
      } else if (enlace) {
        cursor.classList.remove('con-texto'); cursor.classList.add('sobre-enlace');
      } else {
        cursor.classList.remove('con-texto', 'sobre-enlace');
      }
    });
    document.addEventListener('pointerleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('pointerenter', function () { cursor.style.opacity = '1'; });

    $$('.js-magnetico').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (mx * 0.28).toFixed(1) + 'px,' + (my * 0.35).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  // ---------- 19. Todo lo que reacciona al scroll (en un solo cuadro) ----------
  var progreso = $('.progreso'), waFlotante = $('.wa-flotante'), contacto = $('#contacto');
  var pendiente = false;
  function alBajar() {
    pendiente = false;
    var vh = window.innerHeight, y = window.scrollY;
    var total = document.documentElement.scrollHeight - vh;
    progreso.style.transform = 'scaleX(' + (total > 0 ? y / total : 0).toFixed(4) + ')';
    var rc = contacto.getBoundingClientRect();
    waFlotante.classList.toggle('visible', y > vh * 0.8 && rc.top > vh * 0.7 && !bloqueado);
    actualizarManifiesto(vh);
    actualizarCasos(vh);
    actualizarProceso(vh);
  }
  function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(alBajar); } }
  window.addEventListener('scroll', pedir, { passive: true });
  var anchoAntes = window.innerWidth;
  window.addEventListener('resize', function () {
    if (!punteroFino && window.innerWidth === anchoAntes) { pedir(); return; }
    anchoAntes = window.innerWidth;
    medirCasos(); pedir();
  });
  window.addEventListener('load', function () { medirCasos(); pedir(); });
  medirCasos();
  pedir();
})();
