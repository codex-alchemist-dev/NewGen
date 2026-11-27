import{n as e,r as t}from"./quality.DF1ZzyeR.js";import{a as n,c as r,s as i,t as a,u as o}from"./motion.DVYtJKeH.js";var s={field:0,eye:1,streaks:2,mosaic:3,hdr:4,trails:5,blueprint:6,cone:7,calm:8,timelapse:9,shimmer:10,clean:11},c=`attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`,l=`
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uSceneA; uniform float uSceneB;
uniform float uMix; uniform vec3 uTintA; uniform vec3 uTintB; uniform float uVel; uniform float uScroll; uniform vec2 uMouse;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }

// Hex lattice: returns (dist-to-center, cell id hash, sub-triangle sign)
vec3 hexCell(vec2 p){
  const vec2 s = vec2(1., 1.7320508);
  vec2 h = s*.5;
  vec2 a = mod(p, s) - h;
  vec2 b = mod(p - h, s) - h;
  vec2 g = dot(a,a) < dot(b,b) ? a : b;
  vec2 id = p - g;
  float ang = atan(g.y, g.x);
  return vec3(length(g), hash(floor(id*10.)), ang);
}

vec3 prim6(float s){
  return s < .5 ? vec3(1.,.18,.12) : s < 1.5 ? vec3(1.,.17,.84) : s < 2.5 ? vec3(.16,.42,1.)
       : s < 3.5 ? vec3(0.,.9,1.) : s < 4.5 ? vec3(0.,1.,.6) : vec3(1.,.88,.2);
}

vec3 scene(float id, vec2 uv, vec2 frag, vec3 tint){
  float t = uTime;
  float asp = uRes.x/uRes.y;
  vec2 c = uv - .5; c.x *= asp;
  if (id < .5) {
    // 0 field: the VR field the tube powers on into (perspective floor + dome)
    float y = uv.y - .5;
    float side = sign(y);
    float z = .35 / max(abs(y), .002);
    float x = c.x * z;
    float zz = z + t*.5 + uScroll*2.;
    float lx = abs(fract(x) - .5);
    float lz = abs(fract(zz*.5) - .5);
    float w = .015*z;
    float line = smoothstep(w, 0., lx) + smoothstep(w*1.2, 0., lz);
    float fade = smoothstep(18., 1., z) * (side < 0. ? 1. : .4);
    float horizon = exp(-abs(y)*40.)*.6;
    return tint * (line*fade*.5 + horizon*.45);
  } else if (id < 1.5) {
    // 1 eye: an almond scan field centred on the gaze (cursor); lines pack
    // densest at the fovea and thin out toward the edge, like Skip-Scan
    vec2 m = (uMouse - .5) * vec2(asp, 1.);
    vec2 d = c - m;
    float f = abs(d.y) * 1.25 + d.x*d.x*.9;          // level sets are eye-shaped
    float dens = pow(f, .55);
    float lines = smoothstep(.55, 1., sin(dens*95. - t*3.)*.5+.5);
    float fall = exp(-f*2.4);
    float fovea = exp(-f*28.);
    float iris = smoothstep(.012, 0., abs(length(d) - .085)) * .7;
    return tint * (lines*fall*.32 + fovea*.5 + iris*.35) + vec3(fovea*.15);
  } else if (id < 2.5) {
    // 2 streaks: beam streaks, faster as you scroll
    float lanes = 46.;
    float ln = floor(uv.y*lanes);
    float ly = fract(uv.y*lanes);
    float h = hash(vec2(ln, 3.1));
    float sp = (.04 + h*.12) * (1. + min(abs(uVel), 60.)*.18);
    float s = fract(uv.x*(.6 + h*.8) - uTime*sp*2. - h*7. - uScroll*(.3+h));
    float head = smoothstep(.985, 1., s);
    float tail = pow(s, 9.) * (.55 + min(abs(uVel), 60.)*.03);
    float lane = smoothstep(.5, .15, abs(ly - .5)) * step(.5, hash(vec2(ln, 9.7)));
    return tint * (head*1.2 + tail) * lane * .65 + vec3(head*lane*.25);
  } else if (id < 3.5) {
    // 3 mosaic: six-color hex mosaic, flowing
    vec2 p = c*16. + vec2(t*.35 + uScroll*2., uScroll*5.);
    vec3 hc = hexCell(p);
    float cell = smoothstep(.5, .36, hc.x);
    float sector = floor(mod((hc.z + 3.14159)/1.0472, 6.));
    vec3 col = prim6(sector);
    float flow = .5 + .5*sin(dot(c, vec2(3., 1.6)) - t*1.1 + hc.y*1.5);
    float k = cell * (.05 + .45*pow(flow, 3.)) * (.55 + .45*hc.y);
    return col * k * .9;
  } else if (id < 4.5) {
    // 4 hdr: HDR bloom on a pure Kurocoat-black void (true 0 floor)
    vec3 acc = vec3(0.);
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 q = vec2(sin(t*.07*(fi+1.) + fi*2.1)*.55*asp, cos(t*.05*(fi+1.3) + fi)*.32);
      float pulse = .5 + .5*sin(t*.6 + fi*1.7);
      float d2 = dot(c-q, c-q);
      acc += vec3(exp(-d2*900.)*1.6 + exp(-d2*40.)*.18) * pulse;
    }
    return acc * tint;
  } else if (id < 5.5) {
    // 5 trails: moving dots with crisp impulse copies: motion that never smears
    vec3 acc = vec3(0.);
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float y = (fi + .5)/6. - .5;
      float sp = .12 + hash(vec2(fi, 1.))*.18;
      float span = asp + .4;
      for (int k = 0; k < 6; k++) {
        float fk = float(k);
        float x = mod(t*sp + hash(vec2(fi, 2.))*span - fk*.045, span) - span*.5;
        float dd = length(c - vec2(x, y*.8));
        float dot1 = smoothstep(.016, .013, dd);   // hard edge: no blur
        acc += tint * dot1 * pow(.48, fk);
      }
    }
    return acc * 1.1;
  } else if (id < 6.5) {
    // 6 blueprint: engineering grid, minor + major lines, slow pan
    vec2 p = frag/uRes.y * 24. + vec2(0., uScroll*6.);
    vec2 g1 = abs(fract(p) - .5);
    vec2 g2 = abs(fract(p/6.) - .5);
    float minor = smoothstep(.48, .5, max(g1.x, g1.y));
    float major = smoothstep(.49, .5, max(g2.x, g2.y));
    float ring = smoothstep(.004, 0., abs(length(c - vec2(.35*asp, .1)) - .22)) +
                 smoothstep(.003, 0., abs(length(c + vec2(.4*asp, .15)) - .12));
    float scan = exp(-pow((uv.y - fract(t*.05))*30., 2.));
    return tint * (minor*.14 + major*.4 + ring*.45 + scan*.08);
  } else if (id < 7.5) {
    // 7 cone: a ray cone wrapping the viewer (rays + rings rushing past)
    float r = length(c);
    float a = atan(c.y, c.x);
    float rays = pow(abs(sin(a*18. + .3)), 60.) * smoothstep(.02, .6, r);
    float z = .25 / max(r, .01);
    float rings = smoothstep(.035, 0., abs(fract(z - t*.25 - uScroll*.8) - .5)) * smoothstep(.0, .5, r);
    float core = exp(-r*9.)*.4;
    return tint * (rays*.35 + rings*.22 + core);
  } else if (id < 8.5) {
    // 8 calm: soft, slow gradients
    float n = fbm(c*.6 + vec2(t*.008, -t*.01 + uScroll*.05));
    float g = smoothstep(.9, -.4, uv.y);
    return tint * (n*n*.22 + g*.06);
  } else if (id < 9.5) {
    // 9 timelapse: a slow sun-arc of glow crossing the sky
    float ph = fract(t/48. + uScroll*.02);
    vec2 sun = vec2((ph - .5)*1.6*asp, -.35 + sin(ph*3.14159)*.6);
    float d = length(c - sun);
    float glow = exp(-d*3.5)*.4 + exp(-d*22.)*.5;
    float sky = smoothstep(-.6, .5, c.y*-1.) * .06 * sin(ph*3.14159);
    return tint * (glow + sky);
  } else if (id < 10.5) {
    // 10 shimmer: diamond foil with sheen bands sweeping across
    vec2 p = vec2(c.x + c.y, c.x - c.y) * 28.;
    vec2 g = abs(fract(p) - .5);
    float foil = smoothstep(.43, .5, max(g.x, g.y));
    float band = mod(t*.25 + uScroll*.3, 2.4) - 1.2;
    float sheen = exp(-pow((c.x*.7 + c.y*.4 - band*asp)*4., 2.));
    return tint * (foil*(.1 + sheen*.6) + sheen*.12);
  } else {
    // 11 clean: modern, near-flat, one soft key light
    float key = exp(-length((c - vec2(0., .65))*vec2(.6, 1.))*2.2);
    return tint * (key * .16 + smoothstep(1., 0., uv.y) * .025);
  }
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  // scroll velocity: gentle vertical smear
  vec2 uvv = uv + vec2(0., uVel*.0015);
  vec3 a = scene(uSceneA, uvv, frag, uTintA);
  vec3 col = a;
  if (uMix > .001) {
    vec3 b = scene(uSceneB, uvv, frag, uTintB);
    col = mix(a, b, uMix);
  }
  col *= 1. + min(abs(uVel)*.02, .35);
  // tone map + tiny dither
  col = col / (1. + col);
  col += (hash(frag + uTime) - .5) / 255. * step(.002, col.r + col.g + col.b);
  gl_FragColor = vec4(col, 1.);
}`;function u(){let u=document.querySelector(`.vfx-backdrop`),d=u?.querySelector(`canvas`);if(!u||!d)return;let{ScrollTrigger:f}=r(),p=d.getContext(`webgl`,{antialias:!1,alpha:!1,powerPreference:`high-performance`});if(!p){document.documentElement.dataset.vfxNoGl=`1`;return}let m=(e,t)=>{let n=p.createShader(e);return p.shaderSource(n,t),p.compileShader(n),p.getShaderParameter(n,p.COMPILE_STATUS)||console.error(p.getShaderInfoLog(n)),n},h=p.createProgram();p.attachShader(h,m(p.VERTEX_SHADER,c)),p.attachShader(h,m(p.FRAGMENT_SHADER,l)),p.linkProgram(h),p.useProgram(h);let g=p.createBuffer();p.bindBuffer(p.ARRAY_BUFFER,g),p.bufferData(p.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),p.STATIC_DRAW);let _=p.getAttribLocation(h,`p`);p.enableVertexAttribArray(_),p.vertexAttribPointer(_,2,p.FLOAT,!1,0,0);let v=e=>p.getUniformLocation(h,e),y={res:v(`uRes`),time:v(`uTime`),a:v(`uSceneA`),b:v(`uSceneB`),mix:v(`uMix`),ta:v(`uTintA`),tb:v(`uTintB`),vel:v(`uVel`),scroll:v(`uScroll`),mouse:v(`uMouse`)},b=e(),x=1,S=()=>{x=b===`full`?Math.min(devicePixelRatio||1,1.5):.5,d.width=Math.round(innerWidth*x),d.height=Math.round(innerHeight*x),p.viewport(0,0,d.width,d.height)};S(),addEventListener(`resize`,S),t(e=>{b=e,S()});let C=[],w=()=>{C=[...document.querySelectorAll(`[data-vfx-bg]`)].map(e=>({el:e.closest(`[data-act]`)??e.parentElement,scene:s[e.dataset.scene||`field`]??0,tint:n(e.dataset.tint||`#00ff99`).map(e=>e/255)}))};w(),f.addEventListener(`refresh`,w);let T=0,E=0;i(e=>{E=e});let D=0,O=[.5,.5],k=[.5,.5];addEventListener(`pointermove`,e=>{k[0]=e.clientX/innerWidth,k[1]=1-e.clientY/innerHeight},{passive:!0});let A={a:0,b:0,mix:0,ta:[0,1,.6],tb:[0,1,.6]},j=()=>{let e=innerHeight,t=e*.5,n=0;for(let e=0;e<C.length;e++)C[e].el.getBoundingClientRect().top<=t&&(n=e);if(n>=C.length-1)return n;let r=C[n+1].el.getBoundingClientRect().top,i=a(1-(r-t)/(e*.9));return n+o(o(i))},M=0,N=performance.now(),P=!0,F=new URLSearchParams(location.search).get(`vfxscene`),I=F&&F in s?s[F]:null;d.classList.add(`is-live`);let L=e=>{if(requestAnimationFrame(L),b===`static`||document.hidden)return;let t=b===`full`?0:1e3/30;if(e-M<t)return;let n=Math.min(.05,(e-M)/1e3);if(M=e,C.length){let e=j();P&&=(T=e,!1),T+=(e-T)*(1-Math.exp(-n*3.5));let t=Math.max(0,Math.min(C.length-1,Math.floor(T))),r=Math.min(t+1,C.length-1);A.a=I??C[t].scene,A.b=I??C[r].scene,A.mix=t===r?0:T-t,A.ta=C[t].tint,A.tb=C[r].tint;let i=A.ta.map((e,t)=>Math.round((e+(A.tb[t]-e)*A.mix)*255));document.documentElement.style.setProperty(`--vfx-tint-rgb`,i.join(` `));let a=C.length>1?1-Math.min(1,T/(C.length-1)):1;document.documentElement.style.setProperty(`--vfx-retro`,a.toFixed(3))}D+=(E-D)*.1,p.uniform2f(y.res,d.width,d.height),p.uniform1f(y.time,(e-N)/1e3),p.uniform1f(y.a,A.a),p.uniform1f(y.b,A.b),p.uniform1f(y.mix,Math.max(0,Math.min(1,A.mix))),p.uniform3fv(y.ta,A.ta),p.uniform3fv(y.tb,A.tb),p.uniform1f(y.vel,Math.max(-60,Math.min(60,D))),p.uniform1f(y.scroll,scrollY/innerHeight),O[0]+=(k[0]-O[0])*.08,O[1]+=(k[1]-O[1])*.08,p.uniform2f(y.mouse,O[0],O[1]),p.drawArrays(p.TRIANGLES,0,3)};requestAnimationFrame(L)}u();