// Portafolio — Grajalessd (Jerónimo Grajales)
(function () {
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raiz = document.documentElement;

  // 1. Mensaje prellenado de WhatsApp en todos los botones
  var mensaje = 'Hola Jerónimo, vi tu portafolio y quiero contarte una idea.';
  var enlaceWa = 'https://wa.me/573196150221?text=' + encodeURIComponent(mensaje);
  document.querySelectorAll('.js-whatsapp').forEach(function (a) { a.href = enlaceWa; });

  // 2. Aparecer suavemente al hacer scroll
  var elementos = document.querySelectorAll('.revelar');
  function alAparecer(el) { el.classList.add('visible'); }
  if (sinMovimiento || !('IntersectionObserver' in window)) {
    elementos.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { alAparecer(e.target); observador.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    elementos.forEach(function (el) {
      var hermanos = Array.prototype.filter.call(el.parentElement.children, function (h) { return h.classList.contains('revelar'); });
      var i = hermanos.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 80, 400) + 'ms';
      observador.observe(el);
    });
  }

  // 3. Pestañas del proyecto: cambian la captura del computador Y del celular
  document.querySelectorAll('.proyecto').forEach(function (proyecto) {
    var pc = proyecto.querySelector('.js-pc');
    var movil = proyecto.querySelector('.js-movil');
    var pestanas = proyecto.querySelectorAll('.pestana');

    pestanas.forEach(function (b) { new Image().src = b.dataset.pc; new Image().src = b.dataset.movil; });

    pestanas.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('aria-pressed') === 'true') return;
        pestanas.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');

        [[pc, btn.dataset.pc, 'computador'], [movil, btn.dataset.movil, 'celular']].forEach(function (par) {
          var img = par[0];
          if (!img) return;
          img.classList.add('cambiando');
          setTimeout(function () {
            img.src = par[1];
            img.alt = 'Burger Ribs en ' + par[2] + ': ' + btn.dataset.nombre;
            img.removeAttribute('width'); img.removeAttribute('height');
            if (img.complete) img.classList.remove('cambiando');
            else img.onload = function () { img.classList.remove('cambiando'); };
          }, sinMovimiento ? 0 : 220);
        });
      });
    });
  });

  // 5. Todo lo que reacciona al scroll (en un solo cuadro de animación)
  var encabezado = document.querySelector('.encabezado');
  var portada = document.querySelector('.portada');
  var media = document.querySelector('.portada__media');
  var vitrinas = document.querySelectorAll('.proyecto__vitrina');
  var sobre = document.querySelector('.sobre');
  var sobreFoto = document.querySelector('.sobre__media img');
  var pasos = document.querySelector('.pasos');
  var itemsPasos = pasos ? pasos.querySelectorAll('.paso') : [];
  var ultimoY = window.scrollY;
  var pendiente = false;

  // Franjas: se mueven siempre. Al bajar aceleran; al subir cambian de sentido.
  var franjas = Array.prototype.map.call(document.querySelectorAll('.franja__pista'), function (p) {
    return { el: p, x: 0, sentido: p.closest('.franja--quien') ? -1 : 1 };
  });
  var sentidoScroll = 1;   // 1 bajando, -1 subiendo
  var impulso = 0;         // velocidad extra que se va calmando
  var ultimoCuadro = null;

  function moverFranjas(ahora) {
    if (ultimoCuadro === null) ultimoCuadro = ahora;
    var dt = Math.min((ahora - ultimoCuadro) / 1000, 0.05);
    ultimoCuadro = ahora;
    impulso *= 0.94;
    var velocidad = 45 * (1 + impulso);   // píxeles por segundo
    franjas.forEach(function (f) {
      var mitad = f.el.scrollWidth / 2;
      if (!mitad) return;
      f.x -= f.sentido * sentidoScroll * velocidad * dt;
      if (f.x <= -mitad) f.x += mitad;      // da la vuelta sin saltos
      if (f.x > 0) f.x -= mitad;
      f.el.style.transform = 'translate3d(' + f.x.toFixed(2) + 'px,0,0)';
    });
    requestAnimationFrame(moverFranjas);
  }
  if (!sinMovimiento && franjas.length) {
    franjas.forEach(function (f) { f.el.style.animation = 'none'; });
    requestAnimationFrame(moverFranjas);
  }

  function limitar(n) { return Math.max(0, Math.min(1, n)); }

  function alScroll() {
    pendiente = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    var alto = document.documentElement.scrollHeight - vh;

    // barra de progreso y encabezado
    raiz.style.setProperty('--p', alto > 0 ? (y / alto).toFixed(4) : 0);
    document.querySelector('.progreso').style.setProperty('--p', alto > 0 ? (y / alto).toFixed(4) : 0);
    encabezado.classList.toggle('con-fondo', y > 20);

    if (!sinMovimiento) {
      // foto de portada: se aleja y se desvanece al bajar
      var h = portada.offsetHeight;
      var t = limitar(y / h);
      media.style.setProperty('--py', (t * 90).toFixed(1) + 'px');
      media.style.setProperty('--ps', (1 + t * 0.08).toFixed(3));
      media.style.setProperty('--po', (1 - t * 0.85).toFixed(3));

      // vitrina del proyecto: se endereza al entrar en pantalla
      vitrinas.forEach(function (v) {
        var r = v.getBoundingClientRect();
        var avance = limitar((vh - r.top) / (vh * 0.75));
        v.style.setProperty('--t', (1 - avance).toFixed(3));
      });

      // sobre mí: la foto se acerca despacio y el "hola." gigante se desliza
      if (sobre) {
        var rs = sobre.getBoundingClientRect();
        var paso = limitar((vh - rs.top) / (vh + rs.height));   // 0 al entrar, 1 al salir
        if (paso > 0 && paso < 1) {
          sobreFoto.style.setProperty('--zs', (1.07 - paso * 0.07).toFixed(4));
        }
      }

      // franjas: el scroll les da impulso y define el sentido
      var delta = y - ultimoY;
      if (delta !== 0) {
        sentidoScroll = delta > 0 ? 1 : -1;
        impulso = Math.min(impulso + Math.abs(delta) / 25, 4);
      }
    }
    ultimoY = y;

    // línea de progreso de los pasos
    if (pasos) {
      var rp = pasos.getBoundingClientRect();
      var av = sinMovimiento ? 1 : limitar((vh * 0.72 - rp.top) / (rp.height * 0.85));
      pasos.style.setProperty('--avance', av.toFixed(3));
      itemsPasos.forEach(function (p, i) {
        p.classList.toggle('activo', av >= i / (itemsPasos.length - 1) - 0.02);
      });
    }
  }

  function pedirCuadro() {
    if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); }
  }
  window.addEventListener('scroll', pedirCuadro, { passive: true });
  window.addEventListener('resize', pedirCuadro);
  alScroll();

  // 6. Efectos con el mouse (solo computador)
  if (punteroFino && !sinMovimiento) {
    var fondo = document.querySelector('.portada__fondo');
    portada.addEventListener('pointermove', function (e) {
      var r = portada.getBoundingClientRect();
      fondo.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      fondo.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });

    document.querySelectorAll('.tarjeta').forEach(function (t) {
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect();
        t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        t.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    // botón magnético: se acerca un poco al cursor
    document.querySelectorAll('.js-magnetico').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  // 7. Menú de pantalla completa (celular)
  var botonMenu = document.querySelector('.menu-boton');
  var menuMovil = document.getElementById('menu-movil');
  if (botonMenu && menuMovil) {
    var abrirMenu = function (abrir) {
      botonMenu.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
      menuMovil.classList.toggle('abierto', abrir);
      if (abrir) { menuMovil.removeAttribute('inert'); } else { menuMovil.setAttribute('inert', ''); }
      raiz.style.overflow = abrir ? 'hidden' : '';         // la página no se mueve detrás del menú
      encabezado.classList.toggle('menu-abierto', abrir);
    };
    botonMenu.addEventListener('click', function () {
      abrirMenu(botonMenu.getAttribute('aria-expanded') !== 'true');
    });
    // al tocar una sección, se cierra el menú y baja hasta ella
    menuMovil.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { abrirMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuMovil.classList.contains('abierto')) { abrirMenu(false); botonMenu.focus(); }
    });
    // si la pantalla se agranda (computador), el menú se cierra solo
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) abrirMenu(false); });
  }

  // 8. Marca en el menú la sección en la que estás
  if ('IntersectionObserver' in window) {
    var enlacesMenu = document.querySelectorAll('.menu a, .menu-movil__lista a');
    var marcarActiva = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = '#' + e.target.id;
        enlacesMenu.forEach(function (a) { a.classList.toggle('activa', a.getAttribute('href') === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['proyectos', 'sobre-mi', 'por-que', 'como-trabajamos', 'contacto', 'inicio'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) marcarActiva.observe(s);
    });
  }

  // 9. Año actual en el pie
  document.getElementById('anio').textContent = new Date().getFullYear();
})();
