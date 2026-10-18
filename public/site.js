/*
 * The field: one WebGL figure, driven by scroll.
 *
 * Progressive enhancement only. All prose is in the HTML; if this file or
 * WebGL fails, the page keeps its static horizon background and stays
 * readable. Nothing is stored.
 *
 * Desktop: the canvas covers the viewport; the text column sits on the left.
 * Mobile:  the canvas is clipped to the top of the screen. On the landing view the
 *          mark is shown large; past it the clip narrows to a thin strip, and
 *          text scrolls below it without passing over the figure.
 *
 * Stages (data-stage) and what the figure shows:
 *   0 hero              the whole mark is drawn: stroke, poles, centre, crosshair, ring
 *  I  Meta-epistemology — cool; the instrument only (no centre, no crosshair)
 *   1 chapter           many contents, each with the same form
 *   2 metaphysics       a posited substrate behind the figure is withdrawn; the figure stands
 *   3 distinction       light emerges from the stroke toward both poles
 *   4 discretization    a lens on the stroke: at every scale it remains a relation
 *   5 objectivity       the figure as seen from a standpoint: a measuring dial
 *  II Teleosophy — warm; the instrument turned toward the fact
 *   6 chapter           the centre ignites, the crosshair and a horizon appear
 *   7 I am              the centre
 *   8 ontology          the centre in relation to the whole figure, nothing beneath
 *   9 human form        four aspects of one actualization, swept in one motion
 *  10 Sum Cogito Ago    one figure turned through three perspectives
 *  11 purposeful being  the horizon: a not-yet end held in relation to now
 *  12 persons           I, you (derived, mirrored), the third person (edge-on)
 *  13 borrowed language the figure tilted toward edge-on
 *  14 action            reciprocal relation between I and you
 *  15 social reality    many counterparts, converging
 *  16 institute         rest
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));
  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".rail a"));
  var heroInner = document.querySelector(".hero-inner");
  var barEl = document.querySelector(".bar");
  var lastSec = sections[sections.length - 1];
  var fadeEl = document.querySelector(".band-fade");
  var canvas = document.getElementById("field");

  /* Must match the small-screen media query in styles.css: phones, and tablets held upright */
  var bandMQ = window.matchMedia ? window.matchMedia("(max-width: 820px), (orientation: portrait) and (max-width: 1180px)") : null;
  function isBand() { return bandMQ ? bandMQ.matches : window.innerWidth <= 820; }
  var clipB = 0; /* bottom edge (px) of the visible part of the canvas on small screens */
  function bandH() { return isBand() ? clipB : 0; }

  /* ---------------------------------------------------------- text reveal */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("in"); });
    }, { threshold: 0.08 });
    sections.forEach(function (s) { io.observe(s); });
  } else {
    sections.forEach(function (s) { s.classList.add("in"); });
  }

  /* ---------------------------------------------------------- scroll stage */
  function scrollStage() {
    var top = bandH(), vh = window.innerHeight - top;
    /* on small screens sections are shorter than the view: change state sooner, hold it longer */
    var mid = top + vh * 0.5, ramp = vh * (isBand() ? 0.25 : 0.5);
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        var k = +sections[i].getAttribute("data-stage");
        var d1 = mid - r.top, d2 = r.bottom - mid;
        if (d1 < ramp && k > 0) return k - 0.5 + 0.5 * (d1 / ramp);
        if (d2 < ramp && k < sections.length - 1) return k + 0.5 - 0.5 * (d2 / ramp);
        return k;
      }
    }
    return sections.length && sections[0].getBoundingClientRect().top > mid ? 0 : sections.length - 1;
  }

  var activeIdx = -1;
  function updateRail(s) {
    var idx = Math.round(s);
    document.body.classList.toggle("past-hero", s > 0.35);
    var sec = sections[Math.max(0, Math.min(sections.length - 1, Math.round(s)))];
    if (sec) document.body.setAttribute("data-part", sec.getAttribute("data-part") || "0");
    if (heroInner && !isBand()) heroInner.style.opacity = Math.max(0, 1 - s * 1.8).toFixed(3);
    if (idx === activeIdx) return;
    activeIdx = idx;
    railLinks.forEach(function (a, i) {
      a.classList.toggle("active", i === idx);
      if (i === idx) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }

  function staticMode() {
    window.addEventListener("scroll", function () { updateRail(scrollStage()); }, { passive: true });
    updateRail(scrollStage());
  }

  /* ---------------------------------------------------------- section stepping (desktop)
     One wheel gesture moves to the next or previous section heading. A section
     taller than the view (e.g. with "read more" open) is stepped through a
     screen at a time before moving on. Keyboard, links and the
     scrollbar are untouched. Not used in the band layout (phones, upright tablets). */
  (function () {
    var lockStart = 0, lastWheel = 0, lastAbs = 0, locked = false;
    function top(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
    function go(y) {
      locked = true; lockStart = performance.now();
      window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: reduce ? "auto" : "smooth" });
    }
    window.addEventListener("wheel", function (e) {
      if (isBand() || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (e.target.closest && e.target.closest("textarea, select, [contenteditable]")) return;
      var now = performance.now(), abs = Math.abs(e.deltaY);
      var gap = now - lastWheel, prev = lastAbs;
      lastWheel = now; lastAbs = abs;
      if (locked) {
        /* After a step, trackpad momentum keeps sending events with falling deltas.
           Swallow those; release when the step has had time to finish and either
           the events paused, a new swipe starts (delta rises again), or 1.2 s passed. */
        var age = now - lockStart;
        var fresh = gap > 120 || (abs > prev * 1.5 && abs >= 8);
        if (age < 550 || (!fresh && age < 1200)) { e.preventDefault(); return; }
        locked = false;
        if (abs < 6) { e.preventDefault(); return; }
      }
      if (abs < 3) { e.preventDefault(); return; }   /* momentum tail: no drift, no step */
      /* Stops: every section heading; inside a section taller than the view,
         page-sized steps down to where its end is in view; finally the footer. */
      var vh = window.innerHeight, cur = window.pageYOffset, dir = e.deltaY > 0 ? 1 : -1;
      var max = document.documentElement.scrollHeight - vh, pts = [], k, t, h, y;
      for (k = 0; k < sections.length; k++) {
        t = top(sections[k]); h = sections[k].offsetHeight;
        pts.push(t);
        if (h > vh * 1.2) {   /* small overflow is mostly padding: no extra stop */
          for (y = t + vh * 0.8; y < t + h - vh - vh * 0.2; y += vh * 0.8) pts.push(y);
          pts.push(t + h - vh);
        }
      }
      pts.push(max);
      var target = null;
      if (dir > 0) { for (k = 0; k < pts.length; k++) if (pts[k] > cur + 4) { target = pts[k]; break; } }
      else { for (k = pts.length - 1; k >= 0; k--) if (pts[k] < cur - 4) { target = pts[k]; break; } }
      if (target === null) return;
      e.preventDefault();
      go(Math.min(max, target));
    }, { passive: false });
  })();

  /* ---------------------------------------------------------- WebGL */
  var gl = null;
  try {
    gl = canvas && (canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" }) ||
                    canvas.getContext("experimental-webgl"));
  } catch (e) { gl = null; }
  if (!gl) { staticMode(); return; }

  var VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

  var FS = [
    "precision highp float;",
    "uniform vec2 u_res,u_c,u_c2,u_c3,u_mouse;",
    "uniform float u_time,u_stage,u_build,u_R,u_shift,u_fade,u_lift,u_imgA;",
    "uniform vec4 u_imgMap;",
    "uniform vec2 u_imgBand;",
    "uniform sampler2D u_img;",
    "const vec3 CREAM=vec3(.957,.918,.859);",
    "const vec3 NAVY=vec3(.063,.137,.247);",
    "const vec3 DEEP=vec3(.020,.043,.086);",
    "const vec3 GOLD=vec3(1.,.76,.42);",
    "const float TAU=6.2831853;",
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float bump(float s,float c,float w){return 1.-smoothstep(0.,w,abs(s-c));}",
    "float inside(float d,float px){return 1.-smoothstep(-px,px,d);}",
    "float ln(float d,float w,float px){return 1.-smoothstep(w,w+1.5*px,abs(d));}",

    /* One figure. e = emphasis weights packed as vec4s:
       ea = (distinction, iam, perspectives, solid)  eb = (dial, relations, sweep, scan) */
    "vec3 figure(vec3 col,vec2 q,float R,float mir,float draw,float fill,float iam,float ring,",
    "            vec4 ea,vec4 eb,float a,float px,float t){",
    "  if(a<.001)return col;",
    "  float r=length(q),x=q.x*mir,L=1.5*R;",
    "  float scan=mix(1.,.45+.55*step(.5,fract(gl_FragCoord.y*.25)),eb.w);",
    "  float inD=inside(r-R,px);",
    "  float front=fill*R*1.04;",
    "  float rev=1.-smoothstep(front-.012,front,abs(x));",
    "  vec3 cr=CREAM*(.80+.20*smoothstep(-R,R,q.y));",
    "  cr=mix(cr,GOLD,.30*exp(-abs(q.y)/(.22*R))*iam);",
    "  vec3 dk=mix(NAVY*1.25,NAVY*.55,smoothstep(-R,R,-q.y));",
    "  dk+=GOLD*.45*exp(-abs(q.y)/(.05*R))*exp(-max(x,0.)/(.45*R))*iam;",
    /* solid: the stabilized halves shaded as if they were bodies */
    "  float sol=ea.w*(.5+.5*sin(t*.7));",
    "  if(sol>.001){",
    "    vec2 n2=q/R; float nz=sqrt(max(0.,1.-dot(n2,n2)));",
    "    float lit=clamp(dot(normalize(vec3(n2,nz)),normalize(vec3(-.5,.6,.65))),0.,1.);",
    "    cr*=mix(1.,.35+.85*lit,sol); dk*=mix(1.,.5+1.1*lit,sol);",
    "    col*=1.-.55*sol*exp(-length(q-vec2(.035*R/.14,-.05*R/.14))/(.9*R))*(1.-inD);",
    "  }",
    "  vec3 dc=x<0.?cr:dk;",
    "  col=mix(col,dc,inD*rev*a*scan);",
    "  col+=CREAM*exp(-abs(abs(x)-front)/.005)*(1.-fill)*fill*4.*inD*a;",
    "  float w=fract(t*.22);",
    "  col+=mix(CREAM,GOLD,.35)*exp(-abs(abs(q.x)-w*L)/.012)*(1.-w)*ea.x*.55*step(r,L)*a;",
    "  col=mix(col,CREAM,ln(r-R,.5*px,px)*fill*.55*a*(1.+sol));",
    /* the stroke */
    "  float vis=1.-smoothstep(draw*L-.004,draw*L,abs(q.y));",
    "  float sp=1.+ea.w*(1.2+.8*sin(t*2.));",
    "  col+=CREAM*(ln(q.x,.55*px,px)*.95+exp(-abs(q.x)/.006)*(.18+1.1*ea.x)*sp)*vis*(1.-.55*ea.y)*a;",
    "  col+=GOLD*exp(-length(vec2(q.x,abs(q.y)-draw*L))/.010)*(1.-draw)*step(.001,draw)*2.*a;",
    /* crosshair */
    "  float hv=1.-smoothstep(iam*L-.004,iam*L,abs(q.x));",
    "  col+=CREAM*ln(q.y,.5*px,px)*hv*.75*(1.-.5*ea.x)*a;",
    /* I am */
    "  float pulse=.88+.12*sin(t*1.5);",
    "  float rad=.010+.020*ea.y*(.75+.25*sin(t*2.));",
    "  col+=GOLD*exp(-r/rad)*iam*(1.3+2.2*ea.y)*pulse*a;",
    "  col+=GOLD*.40*exp(-abs(q.y)/.0028)*exp(-abs(q.x)/(.38*R))*iam*(1.+ea.y)*a;",
    "  float cp=fract(t*.3);",
    "  col+=GOLD*exp(-abs(r-cp*2.2*R)/.004)*(1.-cp)*ea.y*.7*a;",
    /* outer ring */
    "  float ang=fract(atan(q.x,q.y)/TAU+1.);",
    "  float rv=1.-smoothstep(ring*1.02-.006,ring*1.02,ang);",
    "  col+=CREAM*ln(r-L,.55*px,px)*rv*.8*(1.-.7*ea.z)*a;",
    /* dial: perspective implies a standpoint and a measure */
    "  if(eb.x>.001){",
    "    float aa=fract(ang+t*.01);",
    "    float big=1.-step(.04,abs(fract(aa*12.+.5)-.5));",
    "    float band=step(L+.006,r)*step(r,L+.016+.012*big);",
    "    float tickd=abs(fract(aa*72.+.5)-.5)/72.*TAU*r;",
    "    col+=CREAM*(1.-smoothstep(.5*px,1.5*px,tickd))*band*eb.x*.8*a;",
    "    col+=GOLD*ln(r-(L+.035),.5*px,px)*eb.x*.35*a;",
    "  }",
    /* relations: the centre in relation to the whole figure, nothing beneath */
    "  if(eb.y>.001&&r<L){",
    "    float n=36.;",
    "    float da=abs(fract(atan(q.y,q.x)/TAU*n+.5)-.5)/n*TAU*r;",
    "    float rl=1.-smoothstep(.4*px,1.4*px,da);",
    "    float fl=exp(-fract(r/L*2.-t*.35)*5.);",
    "    col+=mix(CREAM,GOLD,.6)*rl*(.18+.7*fl)*eb.y*smoothstep(.02,.05,r)*a;",
    "  }",
    /* sweep: four aspects of one actualization, taken together in one motion */
    "  if(eb.z>.001&&r<L){",
    "    float sa=fract(atan(q.y,q.x)/TAU-t*.12);",
    "    col+=mix(GOLD,CREAM,.4)*exp(-sa*7.)*.28*eb.z*a;",
    "    col+=GOLD*exp(-(1.-sa)*60.)*.5*eb.z*a*step(R*.02,r);",
    "  }",
    /* perspectives: the same ring turned — one figure, not three */
    "  if(ea.z>.001){",
    "    for(int k=0;k<3;k++){",
    "      float ph=t*.45+float(k)*2.0944;",
    "      float ax=max(abs(cos(ph))*L,.003),by=L;",
    "      float e=length(q/vec2(ax,by));",
    "      float d=(e-1.)*e/max(length(q/vec2(ax*ax,by*by)),1e-4);",
    "      float back=step(0.,sin(ph))*.55+.45;",
    "      col+=CREAM*ln(d,.55*px,px)*ea.z*.75*back*a;",
    "    }",
    "  }",
    "  return col;",
    "}",

    "void main(){",
    "  float px=1./u_res.y;",
    "  vec2 p=(gl_FragCoord.xy-.5*u_res)/u_res.y;",
    "  float W=.5*u_res.x/u_res.y;",
    "  float s=u_stage,t=u_time,R=u_R,b=u_build;",
    "  float draw=smoothstep(0.,.45,b),fill=smoothstep(.28,.75,b),iam=smoothstep(.55,1.,b),ring=smoothstep(.5,1.,b);",
    "  float eD=bump(s,3.,.75),eZ=bump(s,4.,.8),eS=0.,eO=bump(s,5.,.8),eC=bump(s,6.,.8);",
    /* Part I shows the instrument only; the centre and crosshair (I am) arrive with Teleosophy */
    "  float tele=smoothstep(5.4,6.2,s),heroW=1.-smoothstep(0.,.9,s);",
    "  iam*=mix(.0,1.,max(heroW,tele));",
    "  float eI=bump(s,7.,.75),eR=bump(s,8.,.8),eW=bump(s,9.,.8),eP=bump(s,10.,.8)+bump(s,13.,.8);",
    "  float eTel=bump(s,11.,.8),eV=0.,eX=bump(s,13.,.8),e3p=bump(s,12.,.75),eRec=bump(s,14.,.8);",
    "  float aT=smoothstep(10.3,11.,s)*(1.-smoothstep(15.4,16.2,s));",
    "  float aSub=smoothstep(1.35,1.8,s)*(1.-smoothstep(2.55,2.95,s));",
    "  float dis=smoothstep(1.85,2.5,s);",
    "  float aF=bump(s,1.,.85)+bump(s,15.,.85);",
    "  float aAE=smoothstep(11.3,12.,s)*(1.-smoothstep(14.4,15.,s));",
    "  float fx=smoothstep(u_fade-.12,u_fade+.12,p.x);",
    "  vec2 c=u_c-vec2(u_shift*aAE,-u_lift);",
    "  vec2 q=p-c;",

    /* ground */
    "  vec3 col=mix(DEEP,NAVY*.8,smoothstep(-.9,.75,p.y));",
    "  col+=GOLD*.05*exp(-length(q)*2.2)*iam;",
    "  col+=GOLD*.025*exp(-length(p-u_mouse)*2.5);",
    "  col+=(hash(gl_FragCoord.xy+fract(t*.37)*91.)-.5)*.03;",
    /* landing view: the landscape, anchored so the sun sits at the centre of the mark */
    "  float imgM=0.;",
    "  if(u_imgA>.001){",
    "    vec2 uv=vec2(u_imgMap.x+(p.x-c.x)/u_imgMap.z,u_imgMap.y-(p.y-c.y)/u_imgMap.w);",
    "    vec3 ic=texture2D(u_img,clamp(uv,.001,.999)).rgb;",
    /* a strip between the bar and the title; its sides fade into the dark field */
    /* crisp top and bottom edges (1 px antialiasing) */
    "    float m=(1.-smoothstep(u_imgBand.x-px,u_imgBand.x+px,p.y))*smoothstep(u_imgBand.y-px,u_imgBand.y+px,p.y);",
    "    m*=smoothstep(0.,.06,uv.x)*(1.-smoothstep(.94,1.,uv.x))*step(0.,uv.y)*step(uv.y,1.);",
    "    imgM=u_imgA*m;",
    "    col=mix(col,ic,imgM);",
    "  }",
    /* two climates: cool, analytic (I); warm, with a horizon of ends (II) */
    "  col=mix(col*vec3(.9,.97,1.1),col,max(tele,heroW));",
    "  col+=GOLD*.035*tele*exp(-abs(p.y-c.y)*3.)*(.3+.7*fx);",
    /* the turn to Teleosophy: the centre ignites */
    "  col+=GOLD*exp(-length(q)/(.03+.22*eC))*eC*.45;",
    "  col+=GOLD*exp(-abs(p.y-c.y)/.035)*.12*eC*(.2+.8*fx);",

    /* horizon and the held end */
    "  vec2 tp=vec2(W-.07,c.y);",
    "  if(aT>.001){",
    "    float dh=p.y-c.y;",
    "    float below=(1.-smoothstep(-.004,.004,dh))*aT;",
    "    col=mix(col,col*.62,below);",
    "    float rip=sin(dh*240.+sin(p.x*8.+t*.5)*1.6-t*.7);",
    "    col+=CREAM*.03*smoothstep(.86,1.,rip)*below*exp(dh*5.);",
    "    col+=GOLD*exp(-abs(dh)/.06)*.09*aT*(.3+.7*fx);",
    "    col+=CREAM*ln(dh,.5*px,px)*.5*aT*(.12+.88*fx);",
    "    float eE=eTel+eV;",
    "    col+=GOLD*(exp(-length(p-tp)/.010)*1.8+exp(-length(p-tp)/.09)*.22)*eE;",
    "    float seg=step(c.x,p.x)*step(p.x,tp.x);",
    "    float ph=(tp.x-p.x)*7.-t*.9;",
    "    col+=GOLD*exp(-(1.-fract(ph))*6.)*exp(-abs(dh)/.0028)*seg*eTel*1.1;",
    /* means toward an end: arcs from now; one reaches the end */
    "    if(eV>.001&&seg>0.){",
    "      float u=(p.x-c.x)/max(tp.x-c.x,.01);",
    "      for(int k=0;k<4;k++){",
    "        float fk=float(k);",
    "        float h=(fk==0.?.06:(fk==1.?-.05:(fk==2.?.11:-.1)));",
    "        float miss=(fk==0.?0.:(fk==1.?.045:(fk==2.?-.07:.09)));",
    "        float y=c.y+h*sin(3.14159*u)+miss*u*u;",
    "        float d=abs(p.y-y);",
    "        float fade=fk==0.?1.:(1.-smoothstep(.6,.95,u));",
    "        vec3 cc=fk==0.?GOLD:CREAM*.6;",
    "        float flow=exp(-fract(u*3.-t*.4)*5.);",
    "        col+=cc*(1.-smoothstep(.5*px,1.6*px,d))*(.35+.65*flow)*fade*eV*(fk==0.?1.:.6);",
    "      }",
    "    }",
    "  }",

    /* posited substrate, withdrawn */
    "  if(aSub>.001){",
    "    vec2 g=(p-c)/(1.75*R);",
    "    float box=step(abs(g.x),1.)*step(abs(g.y),1.);",
    "    vec2 cs=(p-c)/.034;",
    "    vec2 id=floor(cs),f=fract(cs);",
    "    float h=hash(id+7.);",
    "    float keep=smoothstep(dis*1.08-.1,dis*1.08,h);",
    "    float edge=max(1.-smoothstep(.0,.06,f.x),1.-smoothstep(.0,.06,f.y));",
    "    vec3 sc=vec3(.42,.48,.56);",
    "    col=mix(col,sc*.22,box*keep*aSub*.85);",
    "    col+=sc*edge*.22*box*keep*aSub;",
    "    float gone=(1.-keep)*step(h,dis*1.08);",
    "    vec2 drift=f-vec2(.5,.5+fract(dis*3.+h)*2.);",
    "    col+=CREAM*.05*box*aSub*gone*exp(-length(drift)*6.);",
    "  }",

    /* many contents, one form; at 16 converging */
    "  if(aF>.001){",
    "    float cz=.13;",
    "    vec2 id=floor(p/cz),f=(fract(p/cz)-.5)*cz;",
    "    float h=hash(id+3.1),h2=hash(id+11.7);",
    "    float rr=cz*.22*(.7+.5*h2);",
    "    float an=h*TAU+t*.05*(h2-.5);",
    "    vec2 fq=mat2(cos(an),-sin(an),sin(an),cos(an))*f;",
    "    vec2 cc=id*cz+cz*.5;",
    "    float dc=length(cc-c);",
    "    float v=smoothstep(aF*2.4,aF*2.4-.3,dc)*smoothstep(1.55*R,2.1*R,dc)*aF*(.1+.9*fx);",
    "    float r2=length(fq);",
    "    vec3 tc=fq.x<0.?mix(CREAM,GOLD,h2*.45):NAVY*1.5;",
    "    col=mix(col,tc,inside(r2-rr,px)*v*(fq.x<0.?.34:.55));",
    "    col+=CREAM*ln(fq.x,.45*px,px)*step(r2,rr*1.45)*v*.45;",
    "    col+=CREAM*ln(r2-rr*1.45,.4*px,px)*v*.16;",
    "    col+=GOLD*exp(-r2/.0035)*v;",
    "    float soc=bump(s,15.,.85);",
    "    if(soc>.001){",
    "      vec2 dir=normalize(c-cc+1e-4);",
    "      vec2 lp=f; float along=dot(lp,dir); float perp=abs(dot(lp,vec2(-dir.y,dir.x)));",
    "      float conn=(1.-smoothstep(.4*px,1.4*px,perp))*step(rr*1.5,along)*step(along,cz*.5);",
    "      float pk=exp(-fract(dc*5.-t*.5)*5.);",
    "      col+=mix(CREAM,GOLD,.7)*conn*(.2+.8*pk)*v*soc*.8;",
    "    }",
    "  }",

    /* zoom into the stroke: at every scale it remains a relation */
    "  float Z=1.+eZ*6.*(.5-.5*cos(t*.3));",
    "  vec2 fz=vec2(0.,.55*R);",
    "  vec2 qm=fz+(q-fz)/Z;",
    "  float pxm=px/Z;",

    /* the counterpart (you), derived and mirrored, and the third person edge-on */
    "  if(aAE>.001){",
    "    vec2 c2=u_c2+vec2(0.,u_lift); float R2=R*.62;",
    "    col=figure(col,p-c2,R2,-1.,1.,1.,1.,1.,vec4(0.),vec4(0.,0.,0.,1.),aAE*.95,px,t);",
    "    float seg=step(c.x,p.x)*step(p.x,c2.x);",
    "    float dh=abs(p.y-c.y);",
    "    float ph1=fract((p.x-c.x)*6.-t*.6),ph2=fract((c2.x-p.x)*6.-t*.6);",
    "    col+=GOLD*(exp(-(1.-ph1)*7.)+exp(-(1.-ph2)*7.))*exp(-dh/.0026)*seg*(.25+eRec)*aAE*.9;",
    "    if(e3p>.001){",
    "      vec2 c3=u_c3+vec2(0.,u_lift);",
    "      vec2 q3=p-c3; float fl=.11;",
    "      col=figure(col,vec2(q3.x,q3.y/fl),R*.62,1.,1.,1.,1.,1.,vec4(0.),vec4(0.),e3p*.85,px/fl,t);",
    "    }",
    "  }",

    /* the figure; at 13 tilted toward edge-on */
    "  float tilt=eX*(.55+.45*sin(t*.5))*1.32;",
    "  float cy=max(cos(tilt),.12);",
    "  vec2 qf=vec2(qm.x,qm.y/cy);",
    "  vec3 base=col;",
    "  col=figure(base,vec2(q.x,q.y/cy),R,1.,draw,fill,iam,ring,vec4(eD,eI,eP,eS),vec4(eO,eR,eW,0.),1.,px/cy,t);",
    /* the lens: inside the ring, the stroke magnified */
    "  if(eZ>.001){",
    "    float lr=1.5*R;",
    "    float lm=inside(length(q)-lr,px)*eZ;",
    "    vec3 zc=figure(base*.8,qf,R,1.,draw,fill,iam,ring,vec4(eD,eI,eP,eS),vec4(0.),1.,pxm/cy,t);",
    "    col=mix(col,zc,lm);",
    "    col+=GOLD*ln(length(q)-lr,.6*px,px)*eZ*.9;",
    "  }",

    /* scale marks along the stroke during the zoom: no smallest unit appears */
    "  if(eZ>.001){",
    "    for(int k=0;k<4;k++){",
    "      float sp=.05/pow(4.,float(k));",
    "      float on=smoothstep(.006,.02,sp*Z)*(1.-smoothstep(.08,.16,sp*Z));",
    "      float dy=abs(fract(qm.y/sp+.5)-.5)*sp;",
    "      float m=(1.-smoothstep(.5*pxm,1.4*pxm,dy))*step(abs(qm.x),.008/Z)*step(length(q),1.5*R);",
    "      col+=GOLD*m*on*eZ*.8;",
    "    }",
    "  }",

    "  col*=1.-.32*length(p*vec2(.55,.9))*(1.-imgM);",   /* no vignette over the landscape */
    "  gl_FragColor=vec4(clamp(col,0.,1.),1.);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  var prog, U = {};
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    if (window.console) console.warn("field:", e.message);
    staticMode();
    return;
  }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  ["u_res", "u_c", "u_c2", "u_c3", "u_mouse", "u_time", "u_stage", "u_build", "u_R", "u_shift", "u_fade", "u_lift", "u_imgA", "u_imgMap", "u_img", "u_imgBand"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  root.className += " gl";

  /* ---------------------------------------------------------- the landscape (landing view) */
  var IMG = { w: 3600, h: 1027, sunX: 0.5, sunY: 0.5 };   /* cropped so the sun on the horizon is the exact centre */
  var tex = gl.createTexture(), imgReady = false, imgT0 = 0;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([5, 11, 22]));
  ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T"].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, gl[k], gl.CLAMP_TO_EDGE); });
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  function loadImage(src) {
    var im = new Image();
    im.onload = function () {
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        imgReady = true; imgT0 = performance.now();
      } catch (e) { /* no landscape; the mark is drawn on the dark field */ }
    };
    im.src = src;
  }
  if (location.protocol === "file:") {
    /* Opened from disk: browsers refuse local files as WebGL textures, so use an embedded copy */
    var sc = document.createElement("script");
    sc.src = "images/horizon-data.js";
    sc.onload = function () { if (window.HORIZON_DATA) loadImage(window.HORIZON_DATA); };
    document.head.appendChild(sc);
  } else {
    loadImage("images/horizon.jpg");
  }

  var W = 0, H = 0, cssW = 1, cssH = 1;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var r = canvas.getBoundingClientRect();
    cssW = r.width || window.innerWidth; cssH = r.height || window.innerHeight;
    W = Math.floor(cssW * dpr); H = Math.floor(cssH * dpr);
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    measureFade();
    measureStrip();
  }

  var stripTop = 64, stripBot = 540;
  function measureStrip() {
    var b = document.querySelector(".bar"), k = document.querySelector(".hero-kicker");
    if (b) stripTop = b.getBoundingClientRect().height;
    if (k) stripBot = k.getBoundingClientRect().top + window.pageYOffset - 26;
    if (stripBot - stripTop < 200) stripBot = stripTop + 200;
  }
  window.addEventListener("load", measureStrip);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureStrip);

  var fadeX = 0;
  function measureFade() {
    var el = document.querySelector(".stage:not(.hero) .stage-inner");
    if (!el || isBand()) { fadeX = -10; return; }
    var r = el.getBoundingClientRect();
    fadeX = (r.right - cssW / 2) / cssH;
  }
  window.addEventListener("resize", resize);
  resize();

  var mouse = [0, 0], mouseT = [0, 0];
  window.addEventListener("pointermove", function (e) {
    mouseT[0] = (e.clientX - cssW / 2) / cssH;
    mouseT[1] = -(e.clientY - cssH / 2) / cssH;
  }, { passive: true });

  function lerp(a, b, k) { return a + (b - a) * k; }
  function smooth(e0, e1, x) { var k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); }

  var stage = scrollStage(), t0 = performance.now(), last = t0;
  var build = reduce ? 1 : 0;

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var target = scrollStage();
    stage = reduce ? target : lerp(stage, target, Math.min(1, dt * 3.2));
    updateRail(target);
    /* start drawing the mark once the landscape is there (or after 1.5 s without it) */
    if (!reduce && (imgReady ? now - imgT0 > 350 : now - t0 > 1500)) build = Math.min(1, build + dt / 3.4);
    var eb = build < 1 ? 1 - Math.pow(1 - build, 2.2) : 1;

    var aspect = cssW / cssH, half = aspect / 2, band = isBand();
    var hero = 1 - smooth(0, 0.85, stage);
    var cx, cy, R, shift, c2x, c3x, c3y;
    if (!band) {
      if (canvas.style.clipPath) canvas.style.clipPath = "";
      var sx = Math.min(half * 0.52, half - 0.36);
      cx = lerp(sx, 0, hero);
      var pTopD = 0.5 - stripTop / cssH, pBotD = 0.5 - stripBot / cssH;
      cy = lerp(0, (pTopD + pBotD) / 2, hero);
      R = lerp(0.13, Math.min(0.2, 0.29 * (pTopD - pBotD)), hero);
      shift = 0.17;
      c2x = Math.min(cx + 0.21, half - 0.2);
      c3x = (cx - shift + c2x) / 2;
      c3y = cy - 1.95 * R;
    } else {
      /* small screens: interpolate between the large landing mark and a thin strip */
      var bar = barEl ? barEl.getBoundingClientRect().height : 56;
      var bandPx = bar + 0.14 * cssH, heroPx = 0.56 * cssH;
      clipB = lerp(bandPx, heroPx, hero);
      var centrePx = lerp(bar + 0.07 * cssH, bar + (heroPx - bar) / 2, hero);
      var Rb = (0.14 * 0.31);
      R = lerp(Rb, Math.min(0.13, 0.26 * aspect, ((heroPx - bar) / cssH) / 3.3), hero);
      cx = 0;
      cy = 0.5 - centrePx / cssH;
      /* the persons spread sideways inside the strip */
      shift = 1.9 * Rb;
      c2x = 0.75 * Rb;
      c3x = 2.9 * Rb;
      c3y = cy;
      canvas.style.clipPath = "inset(0 0 " + Math.max(0, cssH - clipB).toFixed(1) + "px 0)";
      if (fadeEl) fadeEl.style.top = clipB.toFixed(1) + "px";
    }

    /* Past the centre of the last section the figure stops following and stays in the page */
    var lr = lastSec.getBoundingClientRect();
    var anchor = band ? clipB + (window.innerHeight - clipB) / 2 : window.innerHeight / 2;
    var liftPx = Math.max(0, anchor - (lr.top + lr.height / 2));
    var lift = 0;
    if (band) {
      var tf = liftPx > 0 ? "translateY(" + (-liftPx).toFixed(1) + "px)" : "";
      canvas.style.transform = tf;
      if (fadeEl) fadeEl.style.transform = tf;
    } else {
      if (canvas.style.transform) canvas.style.transform = "";
      lift = liftPx / cssH;
    }

    mouse[0] = lerp(mouse[0], mouseT[0], 0.05);
    mouse[1] = lerp(mouse[1], mouseT[1], 0.05);

    gl.uniform2f(U.u_res, W, H);
    gl.uniform2f(U.u_c, cx, cy);
    gl.uniform2f(U.u_c2, c2x, cy);
    gl.uniform2f(U.u_c3, c3x, c3y);
    gl.uniform2f(U.u_mouse, mouse[0], mouse[1]);
    gl.uniform1f(U.u_time, reduce ? 12.0 : (now - t0) / 1000);
    gl.uniform1f(U.u_stage, stage);
    gl.uniform1f(U.u_build, eb);
    gl.uniform1f(U.u_R, R);
    gl.uniform1f(U.u_shift, shift);
    gl.uniform1f(U.u_fade, fadeX);
    gl.uniform1f(U.u_lift, lift);
    var ia = IMG.w / IMG.h, cyl = cy + lift;
    /* the landscape fills the strip's height; its width follows (sides fade out) */
    var pTop = 0.5 - (band ? (barEl ? barEl.getBoundingClientRect().height : 56) : stripTop) / cssH;
    var pBot = band ? 0.5 - clipB / cssH : 0.5 - stripBot / cssH;
    var k = Math.max((pTop - cyl) / IMG.sunY, (cyl - pBot) / (1 - IMG.sunY));
    gl.uniform2f(U.u_imgBand, pTop, pBot);
    var imgA = imgReady ? Math.min(1, (now - imgT0) / 900) * (1 - smooth(0, 0.7, stage)) : 0;
    gl.uniform1f(U.u_imgA, imgA);
    gl.uniform4f(U.u_imgMap, IMG.sunX, IMG.sunY, k * ia, k);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(U.u_img, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) requestAnimationFrame(frame);
  }

  if (reduce) {
    var pending = false;
    var req = function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function (n) { pending = false; frame(n); });
    };
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    req();
  } else {
    requestAnimationFrame(frame);
  }
})();
