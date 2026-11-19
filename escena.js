// Portafolio — grajalessd: "la idea" en 3D.
// Un objeto acompaña todo el recorrido: arriba es un boceto de alambre y, a medida que
// se baja por la página, se vuelve metal líquido lima. Cambia de forma, gira y se
// acomoda en los espacios libres de cada sección. Al llegar al contacto ya es "realidad".
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lienzo = document.querySelector('.escena');
const riel = document.querySelector('.riel');

(function () {
  if (!lienzo || quieto) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  const esCel = () => innerWidth < 1024;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, esCel() ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, .1, 50);
  camara.position.set(0, 0, 9);

  // Ruido simplex 3D (Ashima Arts, licencia MIT)
  const ruido = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }`;

  // La forma: una esfera que el ruido deforma (más "líquida" a medida que se baja)
  const vert = ruido + `
  uniform float uTiempo; uniform float uAmp; uniform float uFrec;
  varying vec3 vNormal; varying vec3 vPos; varying vec3 vVista;
  vec3 deformar(vec3 p){
    float n = snoise(p * uFrec + vec3(uTiempo * .18, uTiempo * .12, 0.));
    float n2 = snoise(p * uFrec * 2.3 - vec3(0., uTiempo * .2, uTiempo * .1)) * .35;
    return p + normalize(p) * (n + n2) * uAmp;
  }
  void main(){
    vec3 p = deformar(position);
    // normal aproximada con dos vecinos sobre la superficie
    vec3 t = normalize(cross(normal, abs(normal.y) < .99 ? vec3(0.,1.,0.) : vec3(1.,0.,0.)));
    vec3 b = normalize(cross(normal, t));
    vec3 pt = deformar(position + t * .01), pb = deformar(position + b * .01);
    vec3 n = normalize(cross(pt - p, pb - p));
    if (dot(n, normal) < 0.) n = -n;
    vPos = position;
    vNormal = normalize(normalMatrix * n);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    vVista = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

  const fragSolido = ruido + `
  uniform float uReal; uniform float uTiempo; uniform vec2 uLuz;
  varying vec3 vNormal; varying vec3 vPos; varying vec3 vVista;
  void main(){
    float d = snoise(vPos * 1.6 + vec3(0., uTiempo * .05, 0.)) * .5 + .5;
    float umbral = uReal * 1.25 - .1;
    if (d > umbral) discard;
    vec3 N = normalize(vNormal);
    vec3 R = reflect(-vVista, N);
    vec2 e = R.xy + uLuz * .5;
    vec3 crema = vec3(.953,.933,.894), lima = vec3(.831,.969,.353), coral = vec3(1.,.478,.349);
    vec3 c = mix(vec3(.02,.02,.02), vec3(.26,.27,.24), smoothstep(-.9, .9, e.y));
    c += crema * pow(clamp(1. - abs(e.y - .45) * 4., 0., 1.), 2.) * 1.1;
    c += lima * pow(clamp(1. - abs(e.y + .4) * 3., 0., 1.), 2.) * 1.2;
    c += coral * pow(clamp(1. - length(e - vec2(.6, .1)) * 2.4, 0., 1.), 2.) * .6;
    c += crema * pow(clamp(1. - abs(e.x + .55) * 5., 0., 1.), 3.) * .5;
    float fres = pow(1. - clamp(dot(N, vVista), 0., 1.), 2.);
    c = mix(c, lima, fres * .55);
    c *= vec3(.95, 1., .82);
    // costura lima donde el boceto se está volviendo realidad
    float costura = 1. - smoothstep(0., .05, umbral - d);
    c = mix(c, lima * 1.3, costura);
    gl_FragColor = vec4(c, 1.);
  }`;

  const fragBoceto = ruido + `
  uniform float uReal; uniform float uTiempo;
  varying vec3 vNormal; varying vec3 vPos; varying vec3 vVista;
  void main(){
    float d = snoise(vPos * 1.6 + vec3(0., uTiempo * .05, 0.)) * .5 + .5;
    float umbral = uReal * 1.25 - .1;
    if (d < umbral - .02) discard;
    float borde = pow(1. - abs(dot(normalize(vNormal), vVista)), 1.2);
    vec3 crema = vec3(.953,.933,.894), lima = vec3(.831,.969,.353);
    vec3 c = mix(crema, lima, smoothstep(umbral + .25, umbral, d));
    gl_FragColor = vec4(c, .35 + borde * .5);
  }`;

  const comunes = { uTiempo: { value: 0 }, uAmp: { value: .12 }, uFrec: { value: .9 }, uReal: { value: 0 }, uLuz: { value: new THREE.Vector2() } };
  const geo = new THREE.IcosahedronGeometry(1, esCel() ? 36 : 56);
  const solido = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: comunes, vertexShader: vert, fragmentShader: fragSolido }));
  const alambre = new THREE.Mesh(new THREE.IcosahedronGeometry(1.004, esCel() ? 12 : 16), new THREE.ShaderMaterial({
    uniforms: comunes, vertexShader: vert, fragmentShader: fragBoceto, wireframe: true, transparent: true, depthWrite: false
  }));
  const idea = new THREE.Group();
  idea.add(solido); idea.add(alambre);
  escena.add(idea);

  // Dónde se ubica en cada sección: x / y en fracción de pantalla (-1 a 1), tamaño, opacidad
  // y cuánto de "realidad" tiene. Se interpola mientras se baja.
  const paradas = [
    { sel: '#inicio',     x: .78, y: -1.25, s: .7,  real: 0,   amp: .1,  frec: .8 },
    { sel: '.franjas',    x: .62, y: -.1,   s: .85, real: .05, amp: .14, frec: .9 },
    { sel: '#proyectos',  x: .74, y: .6,    s: .5, real: .18, amp: .18, frec: 1.1 },
    { sel: '#servicios',  x: .98, y: .1,    s: .9,  real: .38, amp: .22, frec: 1.3 },
    { sel: '#proceso',    x: -.75, y: .1,   s: .7,  real: .55, amp: .26, frec: 1.5 },
    { sel: '#sobre-mi',   x: .7,  y: -.35,  s: .75, real: .68, amp: .2,  frec: 1.2 },
    { sel: '#preguntas',  x: -.64, y: -.38, s: .7,  real: .82, amp: .24, frec: 1.0 },
    { sel: '#contacto',   x: .87, y: .2,    s: .72, real: 1.02, amp: .3, frec: .85 }
  ];
  const celular = { x: .82, s: .6 };
  let marcas = [];
  function medir() {
    const vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    marcas = paradas.map(p => {
      const el = document.querySelector(p.sel);
      const top = el ? el.getBoundingClientRect().top + scrollY : 0;
      return Object.assign({}, p, { y0: Math.max(0, Math.min(max, top - vh * .35)) });
    });
    marcas[0].y0 = 0;
    renderer.setSize(innerWidth, innerHeight, false);
    camara.aspect = innerWidth / innerHeight;
    camara.updateProjectionMatrix();
  }
  const suave = t => t * t * (3 - 2 * t);
  function estadoEn(y) {
    if (y <= marcas[0].y0) return marcas[0];
    for (let i = 0; i < marcas.length - 1; i++) {
      const a = marcas[i], b = marcas[i + 1];
      if (y <= b.y0) {
        const t = suave(Math.min(1, Math.max(0, (y - a.y0) / Math.max(1, b.y0 - a.y0))));
        const mezcla = {};
        ['x', 'y', 's', 'real', 'amp', 'frec'].forEach(k => mezcla[k] = a[k] + (b[k] - a[k]) * t);
        return mezcla;
      }
    }
    return marcas[marcas.length - 1];
  }

  // Estado actual (se acerca suave al objetivo, como si tuviera peso)
  const actual = { x: .78, y: -1.25, s: .7, real: 0, amp: .1, frec: .8 };
  let raton = new THREE.Vector2(), ratonObj = new THREE.Vector2(), giro = 0, ultimoY = scrollY, velocidad = 0;
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') ratonObj.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); }, { passive: true });

  let visible = !document.hidden, t0 = performance.now();
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestAnimationFrame(cuadro); });

  function cuadro(ahora) {
    if (!visible) return;
    const t = (ahora - t0) / 1000;
    const y = scrollY;
    const obj = estadoEn(y);
    for (const k in actual) actual[k] += (obj[k] - actual[k]) * .07;

    velocidad += ((y - ultimoY) - velocidad) * .15; ultimoY = y;
    giro += .003 + velocidad * .0016;
    raton.lerp(ratonObj, .05);

    // posición en pantalla -> mundo
    const altoMitad = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * camara.position.z;
    const anchoMitad = altoMitad * camara.aspect;
    const cel = esCel();
    const x = cel ? Math.sign(actual.x) * celular.x : actual.x;
    idea.position.set(x * anchoMitad, actual.y * altoMitad, 0);
    const tam = altoMitad * .42 * actual.s * (cel ? celular.s : 1);
    idea.scale.setScalar(tam * (1 + Math.min(Math.abs(velocidad) * .004, .12)));
    idea.rotation.set(giro * .6 + raton.y * .3, giro + raton.x * .4, giro * .2);

    comunes.uTiempo.value = t;
    comunes.uReal.value = actual.real;
    comunes.uAmp.value = actual.amp + Math.min(Math.abs(velocidad) * .002, .12);
    comunes.uFrec.value = actual.frec;
    comunes.uLuz.value.copy(raton);
    renderer.render(escena, camara);

    // riel "boceto -> realidad"
    if (riel) {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, y / max) : 0;
      riel.style.setProperty('--p', p.toFixed(4));
      document.documentElement.classList.toggle('riel-visible', y > innerHeight * .5);
      riel.querySelector('.riel__valor').textContent = Math.round(p * 100) + '%';
    }
    requestAnimationFrame(cuadro);
  }

  medir();
  addEventListener('resize', () => { clearTimeout(medir._t); medir._t = setTimeout(medir, 150); });
  addEventListener('load', medir);
  // el carrete de proyectos cambia la altura de la página al medirse: volver a medir
  setTimeout(medir, 1200); setTimeout(medir, 3500);
  document.documentElement.classList.add('con-escena');
  requestAnimationFrame(cuadro);
})();
