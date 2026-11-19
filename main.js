// Portafolio — grajalessd (Jerónimo Grajales)
(function () {
  var html = document.documentElement;
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var esComputador = window.matchMedia('(min-width: 1024px)');
  var NUMERO = '573196150221';
  var MENSAJE_BASE = 'Hola Jerónimo, vi tu portafolio y quiero contarte una idea.';

  function enlaceWa(texto) { return 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(texto || MENSAJE_BASE); }
  function limitar(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function suave(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ---------- Congelar el fondo con el menú abierto (también en iPhone) ----------
  var bloqueado = false, guardado = 0, lenis = null;
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

  // ---------- 1. WhatsApp con mensajes ya escritos ----------
  document.querySelectorAll('.js-wa').forEach(function (a) { a.href = enlaceWa(a.dataset.mensaje); });

  // ---------- 2. Scroll suave (solo computador) ----------
  if (punteroFino && !quieto && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    var rafLenis = function (t) { lenis.raf(t); requestAnimationFrame(rafLenis); };
    requestAnimationFrame(rafLenis);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var destino = id.length > 1 && document.querySelector(id);
        if (!destino) return;
        e.preventDefault();
        lenis.scrollTo(destino, { offset: id === '#inicio' ? 0 : -70, duration: 1.4 });
      });
    });
  }

  // ---------- 3. Titulares: separar en letras para que suban una por una ----------
  function partirEnLetras(el) {
    var texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    var n = 0, frag = document.createDocumentFragment();
    texto.split(/\s+/).forEach(function (palabra, i) {
      if (i) frag.appendChild(document.createTextNode(' '));
      var w = document.createElement('span');
      w.className = 't-palabra'; w.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(palabra, function (letra) {
        var l = document.createElement('span');
        l.className = 't-letra'; l.style.setProperty('--n', n++);
        l.textContent = letra;
        w.appendChild(l);
      });
      frag.appendChild(w);
    });
    el.textContent = '';
    el.appendChild(frag);
  }
  if (!quieto) document.querySelectorAll('.titulo').forEach(partirEnLetras);

  // ---------- 4. Aparecer suavemente al bajar ----------
  var aparecen = document.querySelectorAll('.revelar');
  if (quieto || !('IntersectionObserver' in window)) {
    aparecen.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    aparecen.forEach(function (el) {
      var hermanos = Array.prototype.filter.call(el.parentElement.children, function (h) { return h.classList.contains('revelar'); });
      var i = hermanos.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
      obs.observe(el);
    });
  }

  // ---------- 5. Portada: el pincel de realidad (WebGL) ----------
  var portada = document.querySelector('.portada');
  (function pincel() {
    if (!portada) return;
    var caja = portada.querySelector('.portada__foto');
    var foto = caja.querySelector('img');
    var lienzo = caja.querySelector('.portada__lienzo');
    var conIntro = html.classList.contains('con-intro');

    // Sin efecto: el titular simplemente se llena
    function sinEfecto() {
      portada.classList.add('preparada', 'entro', 'llena');
    }
    if (quieto) { sinEfecto(); return; }

    portada.classList.add('preparada');
    var gl = lienzo.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false });
    if (!gl) { arrancarTitular(); return; }

    var vert = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
    var frag = [
      'precision mediump float;',
      'uniform sampler2D uImg; uniform sampler2D uRastro;',
      'uniform vec2 uRes; uniform vec2 uImgRes; uniform vec2 uFoco;',
      'uniform float uTiempo; uniform float uReal; uniform float uVel; uniform float uDpr;',
      'varying vec2 v;',
      'float hash(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }',
      'float ruido(vec2 q){ vec2 i = floor(q), f = fract(q); f = f*f*(3.-2.*f);',
      '  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }',
      'vec2 escala(){ float ra = uRes.x/uRes.y, ri = uImgRes.x/uImgRes.y; return ra > ri ? vec2(1., ri/ra) : vec2(ra/ri, 1.); }',
      'float lum(vec2 u){ return dot(texture2D(uImg, u).rgb, vec3(.299,.587,.114)); }',
      'void main(){',
      '  vec2 t = vec2(v.x, 1. - v.y);',
      '  vec2 s = escala();',
      '  vec2 u = (1. - s) * uFoco + t * s;',
      // Foto real, con un leve corrimiento de color cuando se baja rápido
      '  float d = uVel * .004;',
      '  vec3 real = vec3(texture2D(uImg, u + vec2(d, 0.)).r, texture2D(uImg, u).g, texture2D(uImg, u - vec2(d, 0.)).b);',
      // Boceto: bordes (Sobel) + sombreado en líneas + cuadrícula
      '  vec2 px = s / uRes * 1.7 * uDpr;',
      '  float tl = lum(u + px*vec2(-1.,-1.)), tc = lum(u + px*vec2(0.,-1.)), tr = lum(u + px*vec2(1.,-1.));',
      '  float ml = lum(u + px*vec2(-1.,0.)), mr = lum(u + px*vec2(1.,0.)), L = lum(u);',
      '  float bl = lum(u + px*vec2(-1.,1.)), bc = lum(u + px*vec2(0.,1.)), br = lum(u + px*vec2(1.,1.));',
      '  float gx = -tl - 2.*ml - bl + tr + 2.*mr + br;',
      '  float gy = -tl - 2.*tc - tr + bl + 2.*bc + br;',
      '  float borde = length(vec2(gx, gy));',
      '  float trazo = smoothstep(.09, .34, borde);',
      '  float h = fract((gl_FragCoord.x + gl_FragCoord.y) / (6. * uDpr));',
      '  float sombra = step(h, .14) * smoothstep(.42, .2, L) * smoothstep(.1, .18, L) * .55;',
      '  vec2 g = fract(gl_FragCoord.xy / (28. * uDpr));',
      '  float rejilla = (step(g.x, 1. / (28. * uDpr)) + step(g.y, 1. / (28. * uDpr))) * .06;',
      '  vec3 noche = vec3(.059,.059,.055), crema = vec3(.953,.933,.894), lima = vec3(.831,.969,.353);',
      '  vec3 tinta = mix(crema, lima, smoothstep(.5, .9, borde) * .55);',
      '  vec3 boceto = noche + tinta * (trazo * .85 + sombra) + crema * rejilla;',
      // La realidad avanza de abajo hacia arriba con un borde orgánico
      '  float n = ruido(t * vec2(3.2, 4.) + vec2(uTiempo * .05, 0.));',
      '  float campo = (1. - t.y) * .62 + n * .38;',
      '  float frente = uReal * 1.5 - .25;',
      '  float m = smoothstep(campo - .035, campo + .035, frente);',
      // El mouse o el dedo raspan la realidad y dejan ver el boceto
      '  float r = texture2D(uRastro, t).r;',
      '  float rr = r + (ruido(t * 14. + uTiempo * .2) - .5) * .16 * step(.02, r);',
      '  float raspa = smoothstep(.23, .26, rr);',
      '  float bordeRaspa = smoothstep(.19, .225, rr) - smoothstep(.235, .27, rr);',
      '  m *= 1. - raspa;',
      '  vec3 col = mix(boceto, real, m);',
      '  float costura = m * (1. - m) * 4.;',
      '  col = mix(col, lima, clamp(pow(costura, 6.) * .75 + bordeRaspa * .85, 0., 1.));',
      '  gl_FragColor = vec4(col, 1.);',
      '}'
    ].join('\n');

    function compilar(tipo, src) {
      var sh = gl.createShader(tipo); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    }
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compilar(gl.VERTEX_SHADER, vert));
      gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { arrancarTitular(); return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    function textura(unidad) {
      var tx = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unidad);
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tx;
    }
    var texFoto = textura(0), texRastro = textura(1);
    var U = {};
    ['uImg', 'uRastro', 'uRes', 'uImgRes', 'uFoco', 'uTiempo', 'uReal', 'uVel', 'uDpr'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1i(U.uImg, 0);
    gl.uniform1i(U.uRastro, 1);

    // Rastro del pincel: un lienzo pequeño que se va borrando solo
    var rastro = document.createElement('canvas');
    var rctx = rastro.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var ancho = 0, alto = 0;

    function medir() {
      ancho = caja.offsetWidth; alto = caja.offsetHeight;
      lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr);
      rastro.width = 220; rastro.height = Math.max(40, Math.round(220 * alto / Math.max(ancho, 1)));
      rctx.fillStyle = '#000'; rctx.fillRect(0, 0, rastro.width, rastro.height);
      gl.viewport(0, 0, lienzo.width, lienzo.height);
      gl.uniform2f(U.uRes, lienzo.width, lienzo.height);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform2f(U.uFoco, .5, esComputador.matches ? .24 : .22);
    }

    // Pinceladas: se dibujan como trazos continuos entre puntos
    var ultimo = null, pintado = false;
    function pintar(x, y, fuerza) {
      var rx = x / ancho * rastro.width, ry = y / alto * rastro.height;
      var radio = rastro.width * (esComputador.matches ? .11 : .16);
      var pasos = ultimo ? Math.max(1, Math.ceil(Math.hypot(rx - ultimo[0], ry - ultimo[1]) / (radio * .25))) : 1;
      for (var i = 1; i <= pasos; i++) {
        var px = ultimo ? ultimo[0] + (rx - ultimo[0]) * i / pasos : rx;
        var py = ultimo ? ultimo[1] + (ry - ultimo[1]) * i / pasos : ry;
        var gr = rctx.createRadialGradient(px, py, 0, px, py, radio);
        gr.addColorStop(0, 'rgba(255,255,255,' + (.5 * fuerza) + ')');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        rctx.fillStyle = gr;
        rctx.beginPath(); rctx.arc(px, py, radio, 0, Math.PI * 2); rctx.fill();
      }
      ultimo = [rx, ry];
      pintado = true;
    }
    function soltarPincel() { ultimo = null; }

    function puntoDesde(e) {
      var r = caja.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    var primeraVez = true;
    function alInteractuar() {
      if (primeraVez) { primeraVez = false; portada.classList.remove('mostrar-pista'); }
    }
    // Mouse: en computador la foto ocupa toda la altura de la portada
    portada.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !listo) return;
      var p = puntoDesde(e);
      if (p[0] < 0 || p[1] < 0 || p[0] > ancho || p[1] > alto) { soltarPincel(); return; }
      pintar(p[0], p[1], 1); alInteractuar();
    });
    portada.addEventListener('pointerleave', soltarPincel);
    // Dedo: pinta mientras se arrastra (también mientras baja la página)
    caja.addEventListener('touchstart', function (e) { if (!listo) return; var p = puntoDesde(e.touches[0]); ultimo = null; pintar(p[0], p[1], 1.2); alInteractuar(); }, { passive: true });
    caja.addEventListener('touchmove', function (e) { if (!listo) return; var p = puntoDesde(e.touches[0]); pintar(p[0], p[1], 1.2); }, { passive: true });
    caja.addEventListener('touchend', soltarPincel);

    // Estado de la animación
    var real = 0, listo = false, visible = true, inicio = performance.now(), velocidad = 0, yAnterior = window.scrollY;
    var demo = null;

    function dibujar(ahora) {
      if (!visible || document.hidden) { requestAnimationFrame(dibujar); return; }
      // el rastro se borra poco a poco: la realidad "sana" sola
      rctx.globalCompositeOperation = 'source-over';
      rctx.fillStyle = 'rgba(0,0,0,0.02)';
      rctx.fillRect(0, 0, rastro.width, rastro.height);

      // pincelada de demostración (para que se entienda sin tocar)
      if (demo) {
        var t = (ahora - demo.inicio) / demo.dura;
        if (t >= 1) { demo = null; soltarPincel(); portada.classList.add('mostrar-pista'); setTimeout(function () { portada.classList.remove('mostrar-pista'); }, 6500); }
        else {
          var a = suave(t);
          var cx = ancho * .5 + Math.cos(a * Math.PI * 2.2) * ancho * .16;
          var cy = alto * (.2 + a * .5) + Math.sin(a * Math.PI * 3) * alto * .04;
          pintar(cx, cy, .9);
        }
      }

      var y = window.scrollY;
      velocidad += ((y - yAnterior) - velocidad) * .2;
      yAnterior = y;

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texRastro);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rastro);
      gl.uniform1f(U.uTiempo, (ahora - inicio) / 1000);
      gl.uniform1f(U.uReal, real);
      gl.uniform1f(U.uVel, limitar(velocidad, -40, 40));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(dibujar);
    }

    function revelar(demora, dura) {
      portada.classList.add('boceto-visible');
      setTimeout(function () {
        var t0 = performance.now();
        (function paso(ahora) {
          var t = limitar((ahora - t0) / dura, 0, 1);
          real = suave(t);
          if (t > .35) portada.classList.remove('boceto-visible');
          if (t > .55) portada.classList.add('llena');
          if (t < 1) requestAnimationFrame(paso);
          else { listo = true; demo = { inicio: performance.now() + 500, dura: 2600 }; demo.inicio = performance.now(); }
        })(performance.now());
      }, demora);
    }

    function empezar(img) {
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texFoto);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } catch (e) { arrancarTitular(); return; }   // p. ej. al abrir el archivo sin servidor
      gl.uniform2f(U.uImgRes, img.naturalWidth, img.naturalHeight);
      medir();
      portada.classList.add('gl');
      requestAnimationFrame(dibujar);

      var arranque = function (demora) {
        portada.classList.add('entro');
        revelar(demora, 2300);
      };
      if (conIntro) {
        var revisar = setInterval(function () {
          if (html.classList.contains('intro-arranca')) { clearInterval(revisar); setTimeout(function () { arranque(900); }, 1450); }
        }, 50);
      } else {
        arranque(500);
      }
    }

    function arrancarTitular() {
      // Sin WebGL: el titular se dibuja y se llena igual
      var esperar = conIntro ? 2300 : 300;
      setTimeout(function () { portada.classList.add('entro'); }, esperar);
      setTimeout(function () { portada.classList.add('llena'); }, esperar + 900);
    }

    // Carga la misma foto que eligió el navegador (según el tamaño de pantalla)
    var cargar = function () {
      var img = new Image();
      img.onload = function () { empezar(img); };
      img.onerror = arrancarTitular;
      img.src = foto.currentSrc || foto.src;
    };
    if (foto.complete && foto.naturalWidth) cargar(); else foto.addEventListener('load', cargar, { once: true });

    // Pausar cuando la portada no se ve
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(portada);
    }
    var redimensionar = null;
    window.addEventListener('resize', function () { clearTimeout(redimensionar); redimensionar = setTimeout(function () { if (portada.classList.contains('gl')) medir(); }, 150); });
  })();

  // ---------- 5b. Logo gigante en "metal líquido" (WebGL) ----------
  // Se dibuja el texto en un lienzo, se calcula su relieve y un shader lo pinta como cromo
  // con luces crema, lima y coral. Se llena como un líquido y se deforma donde lo tocan.
  function marcaLiquida(cont, alArrancar) {
    var lienzo = cont.querySelector('canvas');
    var gl = lienzo.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl || quieto) return;

    var vert = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
    var frag = [
      'precision mediump float;',
      'uniform sampler2D uMask; uniform sampler2D uAlto;',
      'uniform vec2 uRes; uniform vec2 uRaton; uniform float uTiempo; uniform float uLleno; uniform float uFuerza;',
      'varying vec2 v;',
      'float hash(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }',
      'float ruido(vec2 q){ vec2 i = floor(q), f = fract(q); f = f*f*(3.-2.*f);',
      '  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }',
      'float relieve(vec2 p){ vec4 a = texture2D(uAlto, p); vec4 m = texture2D(uMask, p); return (a.r + a.g) * .88 + (m.r + m.g) * .12; }',
      'void main(){',
      '  vec2 uv = vec2(v.x, 1. - v.y);',
      '  float asp = uRes.x / uRes.y;',
      // el líquido fluye despacio
      '  vec2 q = uv * vec2(asp * .55, 1.) * 2.4;',
      '  vec2 flujo = vec2(ruido(q + vec2(uTiempo * .22, 0.)), ruido(q + vec2(5.2, uTiempo * .17))) - .5;',
      // ondas donde está el mouse o el dedo
      '  vec2 dm = (uv - uRaton) * vec2(asp, 1.);',
      '  float r = length(dm);',
      '  float cerca = exp(-r * r * 6.) * uFuerza;',
      '  float onda = sin(r * 26. - uTiempo * 7.) * cerca;',
      '  vec2 u = uv + flujo * .005 + (dm / max(r, .001)) * onda * .006 / vec2(asp, 1.);',
      '  vec4 mk = texture2D(uMask, u);',
      '  float alfa = smoothstep(.3, .7, mk.r + mk.g);',
      '  float punto = smoothstep(.3, .7, mk.g);',
      // relieve -> normal
      '  vec2 px = 5. / uRes;',
      '  float hl = relieve(u - vec2(px.x, 0.)), hr = relieve(u + vec2(px.x, 0.));',
      '  float hd = relieve(u + vec2(0., px.y)), hu = relieve(u - vec2(0., px.y));',
      '  vec3 N = normalize(vec3((hl - hr) * 3.4, (hd - hu) * 3.4, 1.));',
      '  N = normalize(N + vec3(flujo * .5 + dm * cerca * 1.6 + onda * .25, 0.));',
      '  vec3 R = reflect(vec3(0., 0., -1.), N);',
      // estudio de luces que se mueve con el mouse y el tiempo
      '  vec2 e = R.xy + vec2((uRaton.x - .5) * .7 + sin(uTiempo * .35) * .25, (.5 - uRaton.y) * .4);',
      '  vec3 crema = vec3(.953,.933,.894), lima = vec3(.831,.969,.353), coral = vec3(1.,.478,.349);',
      '  vec3 c = mix(vec3(.03,.03,.028), vec3(.30,.30,.28), smoothstep(-.9, .9, e.y));',
      '  c += crema * pow(clamp(1. - abs(e.y - .38) * 4.5, 0., 1.), 2.) * 1.15;',
      '  c += crema * pow(clamp(1. - abs(e.x + .5) * 6., 0., 1.), 3.) * .65;',
      '  c += lima * pow(clamp(1. - abs(e.y + .42) * 3.6, 0., 1.), 2.) * 1.05;',
      '  c += coral * pow(clamp(1. - length(e - vec2(.62, .05)) * 2.8, 0., 1.), 2.) * .75;',
      '  float fres = pow(1. - clamp(N.z, 0., 1.), 1.5);',
      '  c = mix(c, lima, fres * .4);',
      '  c *= vec3(.96, 1., .9);',
      '  c = mix(c, c * vec3(.8, 1.05, .35) + lima * .3, punto);',
      // se llena como un líquido de abajo hacia arriba
      '  float desde = 1. - uv.y;',
      '  float sup = uLleno * 1.3 - .15 + (sin(uv.x * 16. + uTiempo * 3.2) * .03 + sin(uv.x * 6. - uTiempo * 2.1) * .03) * (1. - uLleno);',
      '  float lleno = 1. - smoothstep(sup - .02, sup + .02, desde);',
      '  float borde = (1. - smoothstep(0., .04, abs(desde - sup))) * (1. - uLleno) * alfa;',
      '  alfa *= lleno;',
      '  c += lima * borde * 1.4;',
      '  gl_FragColor = vec4(c * alfa + lima * borde * .6, max(alfa, borde * .8));',
      '}'
    ].join('\n');

    function compilar(tipo, src) {
      var sh = gl.createShader(tipo); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    }
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compilar(gl.VERTEX_SHADER, vert));
      gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    function textura(unidad) {
      var tx = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unidad);
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tx;
    }
    var texMask = textura(0), texAlto = textura(1);
    var U = {};
    ['uMask', 'uAlto', 'uRes', 'uRaton', 'uTiempo', 'uLleno', 'uFuerza'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1i(U.uMask, 0); gl.uniform1i(U.uAlto, 1);

    var mascara = document.createElement('canvas'), alto = document.createElement('canvas'), chico = document.createElement('canvas');

    function fuente(ctx, fs) {
      ctx.font = '800 ' + fs + 'px Archivo, sans-serif';
      if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
      if ('letterSpacing' in ctx) ctx.letterSpacing = (-0.05 * fs).toFixed(2) + 'px';
    }
    function dibujar() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = Math.round(cont.getBoundingClientRect().width * dpr);
      if (W < 10) return false;
      var m = mascara.getContext('2d');
      fuente(m, 100);
      var palabra = m.measureText('grajalessd'), todo = m.measureText('grajalessd.');
      var escala = W * .985 / todo.width, fs = 100 * escala;
      var sube = Math.max(todo.actualBoundingBoxAscent || 76, 60) * escala;
      var baja = Math.max(todo.actualBoundingBoxDescent || 22, 10) * escala;
      var aire = fs * .07;
      var H = Math.ceil(sube + baja + aire * 2);
      mascara.width = W; mascara.height = H;
      m = mascara.getContext('2d'); fuente(m, fs);
      m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
      var x0 = (W - todo.width * escala) / 2, base = aire + sube;
      m.fillStyle = '#ff0000'; m.fillText('grajalessd', x0, base);
      m.fillStyle = '#00ff00'; m.fillText('.', x0 + palabra.width * escala, base);
      // dónde queda el punto (en fracciones del lienzo): de ahí crece el lima al bajar
      var pm = m.measureText('.'), px0 = x0 + palabra.width * escala;
      var pl = pm.actualBoundingBoxLeft || 0, pr = pm.actualBoundingBoxRight || fs * .25;
      var pa = pm.actualBoundingBoxAscent || fs * .2, pd = pm.actualBoundingBoxDescent || 0;
      cont._punto = { x: (px0 - pl) / W, y: (base - pa) / H, w: (pl + pr) / W, h: (pa + pd) / H };
      // relieve: el mismo texto muy desenfocado (bajar y subir de tamaño en varios pasos = desenfoque suave)
      alto.width = W; alto.height = H;
      var pasos = [3, 9, 22], lienzos = [mascara];
      pasos.forEach(function (d, i) {
        var c = document.createElement('canvas');
        c.width = Math.max(4, Math.round(W / d)); c.height = Math.max(3, Math.round(H / d));
        var cx = c.getContext('2d'); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
        cx.drawImage(lienzos[i], 0, 0, c.width, c.height);
        lienzos.push(c);
      });
      for (var k = lienzos.length - 1; k > 1; k--) {
        var dst = lienzos[k - 1], dx = dst.getContext('2d');
        dx.imageSmoothingEnabled = true; dx.imageSmoothingQuality = 'high';
        dx.globalAlpha = .6; dx.drawImage(lienzos[k], 0, 0, dst.width, dst.height); dx.globalAlpha = 1;
      }
      var a = alto.getContext('2d'); a.imageSmoothingEnabled = true; a.imageSmoothingQuality = 'high';
      a.drawImage(lienzos[1], 0, 0, W, H);

      lienzo.width = W; lienzo.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.uRes, W, H);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texMask);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mascara);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texAlto);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, alto);
      cont.style.setProperty('--ar', (W / H).toFixed(4));
      cont.classList.add('gl');
      return true;
    }

    // Mouse / dedo
    var raton = [.5, .5], objetivo = [.5, .5], fuerza = 0, fuerzaObj = 0, tocando = false;
    function apuntar(x, y, dentroDe) {
      var r = cont.getBoundingClientRect();
      objetivo = [(x - r.left) / r.width, (y - r.top) / r.height];
      var margen = dentroDe || 0;
      fuerzaObj = (x > r.left - margen && x < r.right + margen && y > r.top - margen && y < r.bottom + margen) ? 1 : 0;
    }
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') apuntar(e.clientX, e.clientY, 60); }, { passive: true });
    cont.addEventListener('touchstart', function (e) { tocando = true; apuntar(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    cont.addEventListener('touchmove', function (e) { apuntar(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    cont.addEventListener('touchend', function () { tocando = false; fuerzaObj = 0; });

    var lleno = 0, visible = false, corriendo = false, t0 = performance.now(), llenando = null;
    function cuadro(ahora) {
      if (!visible) { corriendo = false; return; }
      var t = (ahora - t0) / 1000;
      // cuando nadie lo toca, la luz pasea sola
      if (fuerzaObj === 0 && !tocando) { objetivo = [.5 + Math.sin(t * .4) * .45, .5 + Math.cos(t * .55) * .3]; }
      raton[0] += (objetivo[0] - raton[0]) * .08; raton[1] += (objetivo[1] - raton[1]) * .08;
      fuerza += (fuerzaObj - fuerza) * .06;
      if (llenando) { var p = limitar((ahora - llenando) / 1700, 0, 1); lleno = suave(p); if (p >= 1) llenando = null; }
      gl.uniform1f(U.uTiempo, t);
      gl.uniform2f(U.uRaton, raton[0], raton[1]);
      gl.uniform1f(U.uFuerza, fuerza);
      gl.uniform1f(U.uLleno, lleno);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(cuadro);
    }
    function correr() { if (!corriendo && visible) { corriendo = true; requestAnimationFrame(cuadro); } }

    var listo = function () {
      if (!dibujar()) return;
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; correr(); }).observe(cont);
      alArrancar(function () { llenando = performance.now(); });
      var espera = null;
      window.addEventListener('resize', function () { clearTimeout(espera); espera = setTimeout(dibujar, 200); });
    };
    try { document.fonts.load('800 100px Archivo').then(listo, listo); } catch (e) { listo(); }
  }

  var marcaArriba = document.querySelector('.portada .marca-liquida');
  if (marcaArriba) marcaLiquida(marcaArriba, function (llenar) {
    if (html.classList.contains('con-intro')) {
      var revisar = setInterval(function () {
        if (html.classList.contains('intro-arranca')) { clearInterval(revisar); setTimeout(llenar, 1550); }
      }, 50);
    } else { setTimeout(llenar, 150); }
  });
  var marcaPie = document.querySelector('.marca-liquida--pie');
  if (marcaPie) marcaLiquida(marcaPie, function (llenar) {
    var obsPie = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { obsPie.disconnect(); setTimeout(llenar, 200); }
    }, { threshold: .4 });
    obsPie.observe(marcaPie);
  });

  // ---------- 5c. "Sobre mí": polaroids sueltas ----------
  var pila = document.querySelector('.pila');
  if (pila) {
    var fotos = Array.prototype.slice.call(pila.querySelectorAll('.polaroid--suelta'));
    var capa = fotos.length;
    fotos.forEach(function (f, i) { f.style.zIndex = i + 1; f._x = 0; f._y = 0; f._r = 0; });

    if ('IntersectionObserver' in window && !quieto) {
      var obsPila = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { pila.classList.add('visible'); obsPila.disconnect(); setTimeout(function () { pila.classList.add('lista'); }, 1300); }
      }, { threshold: .25 });
      obsPila.observe(pila);
    } else { pila.classList.add('visible', 'lista'); }

    function ubicar(f) {
      f.style.setProperty('--dx', f._x.toFixed(1) + 'px');
      f.style.setProperty('--dy', f._y.toFixed(1) + 'px');
      f.style.setProperty('--dr', f._r.toFixed(2) + 'deg');
    }
    function arriba() { return fotos.reduce(function (a, b) { return +a.style.zIndex > +b.style.zIndex ? a : b; }); }

    var activa = null, ini = null, vel = [0, 0], ultimo = null, movio = false;
    pila.addEventListener('pointerdown', function (e) {
      var f = e.target.closest('.polaroid--suelta');
      if (!f) return;
      movio = false;
      if (e.pointerType !== 'mouse') { ini = [e.clientX, e.clientY]; return; }   // en celular: tocar baraja
      e.preventDefault();
      activa = f; f.style.zIndex = ++capa;
      f.classList.add('arrastrando');
      f.setPointerCapture(e.pointerId);
      ini = [e.clientX - f._x, e.clientY - f._y];
      ultimo = [e.clientX, e.clientY, performance.now()]; vel = [0, 0];
    });
    pila.addEventListener('pointermove', function (e) {
      if (!activa) return;
      movio = true;
      var ahora = performance.now(), dt = Math.max(ahora - ultimo[2], 1);
      vel = [(e.clientX - ultimo[0]) / dt * 16, (e.clientY - ultimo[1]) / dt * 16];
      ultimo = [e.clientX, e.clientY, ahora];
      activa._x = e.clientX - ini[0]; activa._y = e.clientY - ini[1];
      activa._r = limitar(vel[0] * .6, -14, 14);
      ubicar(activa);
    });
    function soltarFoto(e) {
      if (activa) {
        var f = activa; activa = null;
        f.classList.remove('arrastrando');
        // se desliza un poco con la inercia del lanzamiento y se queda dentro de la pila
        var r = pila.getBoundingClientRect(), mx = r.width * .42, my = r.height * .36;
        var vx = vel[0], vy = vel[1];
        (function inercia() {
          vx *= .9; vy *= .9;
          f._x = limitar(f._x + vx, -mx, mx); f._y = limitar(f._y + vy, -my, my);
          f._r *= .9;
          ubicar(f);
          if (Math.abs(vx) + Math.abs(vy) > .3) requestAnimationFrame(inercia);
        })();
        return;
      }
      // toque en celular: la foto de encima sale volando y vuelve al fondo
      if (ini && e && e.pointerType !== 'mouse' && Math.hypot(e.clientX - ini[0], e.clientY - ini[1]) < 10) {
        var f2 = arriba();
        f2._x = pila.clientWidth * .7; f2._r = 18; ubicar(f2);
        setTimeout(function () {
          fotos.forEach(function (o) { o.style.zIndex = +o.style.zIndex + 1; });
          f2.style.zIndex = 1;
          f2._x = 0; f2._r = 0; ubicar(f2);
        }, 380);
      }
      ini = null;
    }
    pila.addEventListener('pointerup', soltarFoto);
    pila.addEventListener('pointercancel', function () { if (activa) { activa.classList.remove('arrastrando'); activa = null; } ini = null; });
  }

  // ---------- 5d. Paso por el punto del logo ----------
  // La portada se queda quieta, el punto lima de "grajalessd." crece hasta llenar la pantalla,
  // aparece "Mira lo que ya es realidad." y el lima sube como un telón hacia los proyectos.
  var pin = document.querySelector('.portada-pin');
  var salto = document.querySelector('.salto');
  var saltoCuadro = salto && salto.querySelector('.salto__cuadro');
  var saltoLleno = salto && salto.querySelector('.salto__lleno');
  var marcaSalto = document.querySelector('.portada .marca-liquida');
  var lienzoMarca = marcaSalto && marcaSalto.querySelector('.marca-liquida__lienzo');
  var textoMarca = marcaSalto && marcaSalto.querySelector('.marca-liquida__texto');
  var cuerpoPortada = document.querySelector('.portada__cuerpo');
  var saltoActivo = false;

  function evaluarSalto() {
    if (!pin || !salto || quieto) return;
    html.classList.add('con-salto');
    // solo si la portada cabe en una pantalla (para poder quedarse quieta)
    saltoActivo = portada.scrollHeight <= window.innerHeight + 4;
    if (!saltoActivo) {
      html.classList.remove('con-salto');
      salto.classList.remove('activo', 'lleno');
      [lienzoMarca, textoMarca, cuerpoPortada].forEach(function (el) { if (el) { el.style.transform = ''; el.style.opacity = ''; } });
    }
  }
  function puntoEnPantalla() {
    var r = marcaSalto.getBoundingClientRect();
    var pt = marcaSalto._punto;
    if (!pt || !marcaSalto.classList.contains('gl')) {
      var i = textoMarca && textoMarca.querySelector('i');
      if (!i) return null;
      var ri = i.getBoundingClientRect();
      // el punto ocupa la parte baja de la caja del carácter
      return { x: ri.left + ri.width * .15, y: ri.top + ri.height * .55, w: ri.width * .7, h: ri.height * .2, ox: 50, oy: 50 };
    }
    return { x: r.left + pt.x * r.width, y: r.top + pt.y * r.height, w: pt.w * r.width, h: pt.h * r.height,
             ox: (pt.x + pt.w / 2) * 100, oy: (pt.y + pt.h / 2) * 100 };
  }
  function moverSalto(y) {
    if (!saltoActivo) return false;
    var vh = window.innerHeight;
    var L = Math.max(1, pin.offsetHeight - vh);
    var p = (y - pin.offsetTop) / L;
    var t = limitar((p - .1) / .5, 0, 1);
    var a = t * t * t;
    var y1 = pin.offsetTop + L + vh * .12, y2 = pin.offsetTop + L + vh * .9;
    var subir = suave(limitar((y - y1) / (y2 - y1), 0, 1));
    var activo = p > .1 && subir < 1;
    salto.classList.toggle('activo', activo);

    var d = puntoEnPantalla();
    if (d) {
      var escalaMax = Math.hypot(window.innerWidth, vh) * 1.15 / Math.max(2, Math.min(d.w, d.h));
      saltoCuadro.style.setProperty('--px', d.x.toFixed(1) + 'px');
      saltoCuadro.style.setProperty('--py', d.y.toFixed(1) + 'px');
      saltoCuadro.style.setProperty('--pw', d.w.toFixed(1) + 'px');
      saltoCuadro.style.setProperty('--ph', d.h.toFixed(1) + 'px');
      saltoCuadro.style.setProperty('--ps', (1 + a * (escalaMax - 1)).toFixed(3));
      [lienzoMarca, textoMarca].forEach(function (el) {
        if (!el) return;
        el.style.transformOrigin = d.ox.toFixed(2) + '% ' + d.oy.toFixed(2) + '%';
        el.style.transform = 'scale(' + (1 + a * .6).toFixed(4) + ')';
      });
    }
    if (cuerpoPortada) {
      cuerpoPortada.style.opacity = (1 - limitar(t * 1.8, 0, 1)).toFixed(3);
      cuerpoPortada.style.transform = 'translateY(' + (-t * 50).toFixed(1) + 'px) scale(' + (1 - t * .05).toFixed(4) + ')';
    }
    var lleno = t >= 1;
    salto.classList.toggle('lleno', lleno);
    html.classList.toggle('salto-lleno', activo && p > .45 && subir < .35);
    saltoCuadro.style.opacity = lleno ? 0 : 1;
    saltoLleno.style.setProperty('--lift', subir.toFixed(4));
    saltoLleno.style.setProperty('--to', suave(limitar((p - .62) / .18, 0, 1)).toFixed(3));
    return activo;
  }
  evaluarSalto();
  window.addEventListener('load', evaluarSalto);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(evaluarSalto);

  // ---------- 6. Proyectos: carrete horizontal ----------
  var reel = document.querySelector('.reel');
  var pista = reel && reel.querySelector('.reel__pista');
  var carrete = reel && reel.querySelector('.reel__carrete');
  var barra = reel && reel.querySelector('.reel__barra');
  var recorrido = 0;

  function medirReel() {
    if (!reel) return;
    if (esComputador.matches) {
      recorrido = Math.max(0, pista.scrollWidth - window.innerWidth);
      reel.style.setProperty('--reel-alto', (recorrido + window.innerHeight) + 'px');
    } else {
      recorrido = 0;
      reel.style.removeProperty('--reel-alto');
      pista.style.removeProperty('--rx');
    }
  }
  function moverReel() {
    if (!reel) return;
    if (esComputador.matches) {
      var r = reel.getBoundingClientRect();
      var p = recorrido > 0 ? limitar(-r.top / recorrido, 0, 1) : 0;
      pista.style.setProperty('--rx', (-p * recorrido).toFixed(1) + 'px');
      barra.style.setProperty('--rp', (.08 + p * .92).toFixed(3));
      // el celular de cada proyecto flota un poco distinto al computador
      reel.querySelectorAll('.caso').forEach(function (c) {
        var rc = c.getBoundingClientRect();
        var centro = (rc.left + rc.width / 2) / window.innerWidth - .5;
        var cel = c.querySelector('.celular');
        if (cel && !quieto) cel.style.setProperty('--py', (centro * 60).toFixed(1) + 'px');
      });
    } else {
      var max = carrete.scrollWidth - carrete.clientWidth;
      barra.style.setProperty('--rp', max > 0 ? (.12 + carrete.scrollLeft / max * .88).toFixed(3) : 1);
    }
  }
  if (reel) {
    medirReel();
    window.addEventListener('load', function () { medirReel(); moverReel(); });
    carrete.addEventListener('scroll', moverReel, { passive: true });
    esComputador.addEventListener('change', function () { medirReel(); moverReel(); });
    // Con teclado: si el foco cae en un proyecto, la página baja hasta que se vea
    pista.addEventListener('focusin', function (e) {
      if (!esComputador.matches || recorrido <= 0) return;
      var panel = e.target.closest('.caso, .proximo');
      if (!panel) return;
      var destino = limitar(panel.offsetLeft + carrete.offsetLeft - window.innerWidth * .06, 0, recorrido);
      var y = reel.getBoundingClientRect().top + window.scrollY + destino;
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    });
  }

  // ---------- 7. Pestañas: cambian la pantalla del computador y del celular ----------
  document.querySelectorAll('.caso').forEach(function (caso) {
    var pc = caso.querySelector('.js-pc');
    var movil = caso.querySelector('.js-movil');
    var pestanas = caso.querySelectorAll('.pestana');
    var nombre = caso.querySelector('.caso__nombre').textContent;
    var precargado = false;
    function precargar() {
      if (precargado) return;
      precargado = true;
      pestanas.forEach(function (b) { new Image().src = b.dataset.pc; new Image().src = b.dataset.movil; });
    }
    caso.addEventListener('pointerenter', precargar);
    caso.addEventListener('focusin', precargar);
    caso.addEventListener('touchstart', precargar, { passive: true });

    pestanas.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('aria-pressed') === 'true') return;
        precargar();
        pestanas.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        [[pc, btn.dataset.pc, 'computador'], [movil, btn.dataset.movil, 'celular']].forEach(function (par) {
          var img = par[0];
          if (!img) return;
          img.classList.add('cambiando');
          setTimeout(function () {
            img.onload = function () { img.classList.remove('cambiando'); };
            img.src = par[1];
            img.alt = nombre + ' en ' + par[2] + ': ' + btn.dataset.nombre;
            if (img.complete) img.classList.remove('cambiando');
          }, quieto ? 0 : 320);
        });
      });
    });
  });

  // ---------- 8. Pliegos (servicios y preguntas) que se despliegan suave ----------
  document.querySelectorAll('.pliego__boton').forEach(function (btn) {
    var pliego = btn.closest('.pliego');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    panel.setAttribute('inert', '');
    btn.addEventListener('click', function () {
      var abrir = btn.getAttribute('aria-expanded') !== 'true';
      if (abrir) {
        pliego.parentElement.querySelectorAll('.pliego.abierto').forEach(function (otro) {
          if (otro === pliego) return;
          otro.classList.remove('abierto');
          var b = otro.querySelector('.pliego__boton');
          b.setAttribute('aria-expanded', 'false');
          document.getElementById(b.getAttribute('aria-controls')).setAttribute('inert', '');
        });
      }
      btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      pliego.classList.toggle('abierto', abrir);
      if (abrir) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
      if (lenis) setTimeout(function () { lenis.resize(); }, 850);
    });
  });

  // ---------- 9. "Y también…": ideas que cambian solas ----------
  var palabra = document.querySelector('.js-imagina');
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
      }, 480);
    }, 2600);
  } else if (palabra) {
    palabra.textContent = 'lo que imagines';
  }

  // ---------- 10. Contacto: el mensaje se arma solo ----------
  var armador = document.querySelector('.armador');
  if (armador) {
    var casillas = armador.querySelectorAll('input[type="checkbox"]');
    var negocio = armador.querySelector('input[name="negocio"]');
    var burbuja = armador.querySelector('.js-burbuja');
    var enviar = armador.querySelector('.js-enviar');
    var componer = function () {
      var elegidos = Array.prototype.filter.call(casillas, function (c) { return c.checked; }).map(function (c) { return c.value; });
      var nombre = negocio.value.trim();
      var texto;
      if (!elegidos.length) {
        texto = MENSAJE_BASE;
      } else {
        var lista = elegidos.length === 1 ? elegidos[0] : elegidos.slice(0, -1).join(', ') + ' y ' + elegidos[elegidos.length - 1];
        texto = 'Hola Jerónimo, vi tu portafolio. Me interesa ' + lista + '.';
      }
      if (nombre) texto += ' Mi negocio se llama ' + nombre + '.';
      if (burbuja.textContent !== texto) {
        burbuja.classList.add('cambiando-texto');
        burbuja.textContent = texto;
        requestAnimationFrame(function () { burbuja.classList.remove('cambiando-texto'); });
      }
      enviar.href = enlaceWa(texto);
    };
    casillas.forEach(function (c) { c.addEventListener('change', componer); });
    negocio.addEventListener('input', componer);
    armador.addEventListener('submit', function (e) { e.preventDefault(); componer(); window.open(enviar.href, '_blank', 'noopener'); });
    componer();
  }

  // ---------- 11. Todo lo que reacciona al scroll (en un solo cuadro) ----------
  var encabezado = document.querySelector('.encabezado');
  var progreso = document.querySelector('.progreso');
  var waFlotante = document.querySelector('.wa-flotante');
  var contacto = document.getElementById('contacto');
  var zonasConToques = document.querySelectorAll('.pliegos, .reel__carrete');
  var riel = document.querySelector('.riel');
  var rielValor = riel && riel.querySelector('.riel__valor');
  var sobre = document.querySelector('.sobre');
  var sobreFoto = document.querySelector('.sobre__foto img');
  var pasos = document.querySelector('.pasos');
  var itemsPasos = pasos ? pasos.querySelectorAll('.paso') : [];
  var ultimoY = window.scrollY, pendiente = false;

  // Franjas: siempre se mueven; al bajar aceleran y al subir cambian de sentido
  var franjas = Array.prototype.map.call(document.querySelectorAll('.franja__pista'), function (p) {
    return { el: p, x: 0, sentido: p.closest('.franja--quien') ? -1 : 1 };
  });
  var sentidoScroll = 1, impulso = 0, ultimoCuadro = null, franjasVisibles = true;
  function moverFranjas(ahora) {
    if (ultimoCuadro === null) ultimoCuadro = ahora;
    var dt = Math.min((ahora - ultimoCuadro) / 1000, 0.05);
    ultimoCuadro = ahora;
    impulso *= 0.94;
    if (franjasVisibles) {
      var v = 45 * (1 + impulso);
      franjas.forEach(function (f) {
        var mitad = f.el.scrollWidth / 2;
        if (!mitad) return;
        f.x -= f.sentido * sentidoScroll * v * dt;
        if (f.x <= -mitad) f.x += mitad;
        if (f.x > 0) f.x -= mitad;
        f.el.style.transform = 'translate3d(' + f.x.toFixed(2) + 'px,0,0)';
      });
    }
    requestAnimationFrame(moverFranjas);
  }
  if (!quieto && franjas.length) {
    franjas.forEach(function (f) { f.el.style.animation = 'none'; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { franjasVisibles = e[0].isIntersecting; }).observe(document.querySelector('.franjas'));
    }
    requestAnimationFrame(moverFranjas);
  }

  function alScroll() {
    pendiente = false;
    if (bloqueado) return;
    var y = window.scrollY, vh = window.innerHeight;
    var alto = document.documentElement.scrollHeight - vh;
    progreso.style.setProperty('--p', alto > 0 ? (y / alto).toFixed(4) : 0);
    encabezado.classList.toggle('con-fondo', y > 20);

    if (waFlotante) {
      var enContacto = contacto && contacto.getBoundingClientRect().top < vh * 0.9;
      var tapa = false;
      zonasConToques.forEach(function (z) {
        var rz = z.getBoundingClientRect();
        if (rz.top < vh - 20 && rz.bottom > vh - 110) tapa = true;
      });
      waFlotante.classList.toggle('mostrar', y > portada.offsetHeight * 0.7 && !enContacto && !tapa);
    }

    moverReel();
    var enSalto = moverSalto(y);
    if (riel) {
      riel.style.setProperty('--p', alto > 0 ? (y / alto).toFixed(4) : 0);
      rielValor.textContent = Math.round(alto > 0 ? y / alto * 100 : 0) + '%';
      html.classList.toggle('riel-visible', !enSalto && y > (pin ? pin.offsetHeight : vh) - vh * .2);
    }

    if (!quieto) {
      if (sobre && sobreFoto) {
        var rs = sobre.getBoundingClientRect();
        var p = limitar((vh - rs.top) / (vh + rs.height), 0, 1);
        if (p > 0 && p < 1) sobreFoto.style.setProperty('--zs', (1.08 - p * 0.08).toFixed(4));
      }
      var delta = y - ultimoY;
      if (delta !== 0) {
        sentidoScroll = delta > 0 ? 1 : -1;
        impulso = Math.min(impulso + Math.abs(delta) / 25, 4);
      }
    }
    ultimoY = y;

    if (pasos) {
      var rp = pasos.getBoundingClientRect();
      var av = quieto ? 1 : limitar((vh * 0.75 - rp.top) / (rp.height * 0.8), 0, 1);
      pasos.style.setProperty('--avance', av.toFixed(3));
      itemsPasos.forEach(function (it, i) {
        it.classList.toggle('activo', av >= i / (itemsPasos.length - 1) - 0.02);
      });
    }
  }
  function pedirCuadro() { if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); } }
  window.addEventListener('scroll', pedirCuadro, { passive: true });
  window.addEventListener('resize', function () { medirReel(); evaluarSalto(); pedirCuadro(); });
  alScroll();

  // ---------- 12. Cursor propio + botón magnético (solo computador) ----------
  if (punteroFino && !quieto) {
    html.classList.add('cursor-propio');
    var cursor = document.querySelector('.cursor');
    var cursorTexto = cursor.querySelector('.cursor__texto');
    var mx = -100, my = -100, ax = -100, ay = -100;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      cursor.style.setProperty('--cx', mx + 'px'); cursor.style.setProperty('--cy', my + 'px');
      cursor.classList.remove('oculto');
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.add('oculto'); });
    (function seguir() {
      ax += (mx - ax) * .18; ay += (my - ay) * .18;
      cursor.style.setProperty('--ax', ax.toFixed(1) + 'px'); cursor.style.setProperty('--ay', ay.toFixed(1) + 'px');
      requestAnimationFrame(seguir);
    })();
    document.addEventListener('pointerover', function (e) {
      var conTexto = e.target.closest('[data-cursor]');
      var enlace = e.target.closest('a, button, label, input, [role="slider"]');
      if (conTexto) {
        cursorTexto.textContent = conTexto.dataset.cursor;
        cursor.classList.add('con-texto'); cursor.classList.remove('sobre-enlace');
      } else {
        cursor.classList.remove('con-texto');
        cursor.classList.toggle('sobre-enlace', !!enlace);
      }
    });
    document.querySelectorAll('.js-magnetico').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = 'translate(' + (dx * 0.06).toFixed(1) + 'px,' + (dy * 0.25).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  // ---------- 13. Menú de pantalla completa (celular) ----------
  var botonMenu = document.querySelector('.menu-boton');
  var menuMovil = document.getElementById('menu-movil');
  if (botonMenu && menuMovil) {
    var abrirMenu = function (abrir) {
      botonMenu.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
      menuMovil.classList.toggle('abierto', abrir);
      if (abrir) { menuMovil.removeAttribute('inert'); bloquearScroll(); } else { menuMovil.setAttribute('inert', ''); liberarScroll(); }
      encabezado.classList.toggle('menu-abierto', abrir);
      html.classList.toggle('menu-abierto-html', abrir);
    };
    botonMenu.addEventListener('click', function () { abrirMenu(botonMenu.getAttribute('aria-expanded') !== 'true'); });
    menuMovil.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { abrirMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuMovil.classList.contains('abierto')) { abrirMenu(false); botonMenu.focus(); }
    });
    esComputador.addEventListener('change', function (m) { if (m.matches) abrirMenu(false); });
  }

  // ---------- 14. Marca en el menú la sección en la que estás ----------
  if ('IntersectionObserver' in window) {
    var enlacesMenu = document.querySelectorAll('.menu a, .menu-movil__lista a');
    var marcar = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = '#' + e.target.id;
        enlacesMenu.forEach(function (a) { a.classList.toggle('activa', a.getAttribute('href') === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'proyectos', 'servicios', 'proceso', 'sobre-mi', 'preguntas', 'contacto'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) marcar.observe(s);
    });
  }

  // ---------- 15. Año actual en el pie ----------
  document.getElementById('anio').textContent = new Date().getFullYear();
})();
