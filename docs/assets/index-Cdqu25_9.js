import{C as B,X as ie,b as v,I as se,K as le,j as n,V as E,Y as ae}from"./vendor_three-B-iNi5iz.js";import{u as ce,b as A,L as ue,c as fe}from"./vendor_ui-XIV5bJka.js";import{s as me,d as de,w as he,y as pe,q as xe,B as ge,T as ve,S as ye}from"./vendor_extras-CKZ_Ow7M.js";(function(){const f=document.createElement("link").relList;if(f&&f.supports&&f.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))r(t);new MutationObserver(t=>{for(const o of t)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function u(t){const o={};return t.integrity&&(o.integrity=t.integrity),t.referrerPolicy&&(o.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?o.credentials="include":t.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(t){if(t.ep)return;t.ep=!0;const o=u(t);fetch(t.href,o)}})();const we=`
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[16];
uniform float uSeed;
uniform float uGrain;
uniform float uTransition; 
uniform float uPixelation; // 0.0 - 1.0
uniform float uDistortion; // Multiplier
uniform float uRelief;     // Multiplier
uniform vec2 uFlowVector;  // x,y direction

varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM with Seed shift
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    vec2 shift = vec2(100.0 + uSeed * 123.45);
    for (int i = 0; i < 6; ++i) { // 6 Octaves for detail
        value += amplitude * snoise(p + shift);
        p = rot * p * 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Helper to smooth mix between palette
vec3 getGradientColor(float t) {
    t = clamp(t, 0.0, 1.0);
    float scaled = t * 15.0; 
    int i = int(floor(scaled));
    float f = fract(scaled);
    
    vec3 c1 = vec3(0.0);
    vec3 c2 = vec3(0.0);
    
    if (i == 0) { c1 = uColors[0]; c2 = uColors[1]; }
    else if (i == 1) { c1 = uColors[1]; c2 = uColors[2]; }
    else if (i == 2) { c1 = uColors[2]; c2 = uColors[3]; }
    else if (i == 3) { c1 = uColors[3]; c2 = uColors[4]; }
    else if (i == 4) { c1 = uColors[4]; c2 = uColors[5]; }
    else if (i == 5) { c1 = uColors[5]; c2 = uColors[6]; }
    else if (i == 6) { c1 = uColors[6]; c2 = uColors[7]; }
    else if (i == 7) { c1 = uColors[7]; c2 = uColors[8]; }
    else if (i == 8) { c1 = uColors[8]; c2 = uColors[9]; }
    else if (i == 9) { c1 = uColors[9]; c2 = uColors[10]; }
    else if (i == 10) { c1 = uColors[10]; c2 = uColors[11]; }
    else if (i == 11) { c1 = uColors[11]; c2 = uColors[12]; }
    else if (i == 12) { c1 = uColors[12]; c2 = uColors[13]; }
    else if (i == 13) { c1 = uColors[13]; c2 = uColors[14]; }
    else { c1 = uColors[14]; c2 = uColors[15]; }

    return mix(c1, c2, f);
}

void main() {
    vec2 st = vUv * 2.0 - 1.0;
    st.x *= uResolution.x / uResolution.y;
    
    // Pixelation Logic
    if (uPixelation > 0.01) {
       // Map 0-1 to something like 200.0 (fine) down to 10.0 (blocky)
       float segs = mix(300.0, 15.0, uPixelation); 
       st = floor(st * segs) / segs;
    }

    st *= 1.2; 
    
    // Transition effect
    float trans = uTransition;
    st += trans * 2.0 * snoise(st * 3.0 + uTime);
    
    float time = uTime * 0.03 * uDistortion; // Distortion affects speed/chaos slightly too? Or separate.
    // Actually let's apply distortion to the warping strength
    
    float distStr = uDistortion; 

    // Domain warping
    vec2 q = vec2(0.);
    
    // Original Logic restored for base movement
    // We only add flowOffset if it exists, otherwise strictly keep 0.00*time
    vec2 flowOffset = uFlowVector * uTime * 0.5;
    
    q.x = fbm( st + 0.00 * time + flowOffset );
    q.y = fbm( st + vec2(1.0) + flowOffset );

    vec2 r = vec2(0.);
    // Apply distortion multiplier to the feedback loop
    // Ensure the time factors here (0.15 and 0.126) match the original EXACTLY for that specific chaotic swirl
    r.x = fbm( st + (1.0 * distStr)*q + vec2(1.7,9.2) + 0.15*time + flowOffset );
    r.y = fbm( st + (1.0 * distStr)*q + vec2(8.3,2.8) + 0.126*time + flowOffset );

    float f = fbm(st+r);

    // Calculate normal for "thick paint" effect
    float eps = 0.005;
    float h = f;
    float h_x = fbm(st + r + vec2(eps, 0.0));
    float h_y = fbm(st + r + vec2(0.0, eps));
    
    // Relief multiplier affects how steep the normal looks
    vec3 normal = normalize(vec3((h - h_x) * uRelief, (h - h_y) * uRelief, eps * 5.0));
    
    // Light source
    vec3 lightDir = normalize(vec3(-1.0, 1.0, 1.0));
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, normal), vec3(0,0,1)), 0.0), 32.0);

    // Color mapping
    float mapVal = f + 0.2*length(q) + 0.1*r.x;
    mapVal = smoothstep(0.0, 1.5, mapVal); 
    
    vec3 col = getGradientColor(mapVal);
    
    // Apply lighting
    col *= (0.8 + 0.4 * diff); 
    col += uColors[15] * spec * 0.6; 
    
    // Grain
    float noiseVal = fract(sin(dot(vUv * uResolution, vec2(12.9898, 78.233))) * 43758.5453);
    col += (noiseVal - 0.5) * uGrain;
    
    // Transition Fade out
    vec3 canvasColor = uColors[0] * 0.5 + vec3(0.5); 
    col = mix(col, canvasColor, smoothstep(0.0, 0.8, uTransition));

    gl_FragColor = vec4(col, 1.0);
}
`,be=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Ce=me({uTime:0,uResolution:new E,uColors:new Array(16).fill(new B("#000000")),uSeed:0,uGrain:.05,uTransition:0,uPixelation:0,uDistortion:1,uRelief:1,uFlowVector:new E(0,0)},be,we);ie({LiquidMaterial:Ce});const Se=({colors:p,seed:f,grain:u,speed:r,transition:t,pixelation:o,distortion:i,relief:a,flowVector:m})=>{const e=v.useRef(null),{viewport:d,size:y}=se(),R=v.useMemo(()=>{const h=[...p];for(;h.length<16;)h.push(h[h.length-1]||"#000000");return h.slice(0,16).map(w=>new B(w))},[p]);return le((h,w)=>{e.current&&(e.current.uTime+=w*(r*5),e.current.uResolution.set(y.width*d.dpr,y.height*d.dpr),e.current.uSeed=f,e.current.uColors=R,e.current.uGrain=u,e.current.uTransition=t,e.current.uPixelation=o,e.current.uDistortion=i,e.current.uRelief=a,e.current.uFlowVector=m)}),n.jsxs("mesh",{scale:[d.width,d.height,1],children:[n.jsx("planeGeometry",{args:[1,1]}),n.jsx("liquidMaterial",{ref:e})]})},Te=(p,f,u,r)=>new Promise((t,o)=>{try{const i=p.width,a=p.height,m=document.createElement("canvas");m.width=i,m.height=a;const e=m.getContext("2d");if(!e){o(new Error("Could not get 2D context"));return}if(e.drawImage(p,0,0),u){const x=Math.floor(a*.05);e.font=`500 ${x}px Inter, sans-serif`,e.textAlign="center",e.textBaseline="middle",e.shadowColor="rgba(0,0,0,0.5)",e.shadowBlur=20,e.shadowOffsetX=0,e.shadowOffsetY=10,e.fillStyle="rgba(255, 255, 255, 0.9)";let D=i/2,I=a/2;r==="bottom"&&(I=a-a*.1),e.fillText(u,D,I),e.shadowColor="transparent"}const d=e.getImageData(0,0,i,a),y=d.data,R=f+"\0",h=Array.from(R).map(x=>x.charCodeAt(0).toString(2).padStart(8,"0")).join("");h.length>y.length/4&&console.warn("Text is too long to hide in this image. Truncating.");let w=0;for(let x=0;x<y.length;x++)if((x+1)%4!==0)if(w<h.length){const D=h[w];y[x]=y[x]&254|parseInt(D,10),w++}else break;e.putImageData(d,0,0),t(m.toDataURL("image/png",1))}catch(i){o(i)}}),Re=p=>new Promise((f,u)=>{const r=new Image;r.crossOrigin="Anonymous",r.onload=()=>{const t=document.createElement("canvas");t.width=r.width,t.height=r.height;const o=t.getContext("2d");if(!o)return u("No context");o.drawImage(r,0,0);const i=o.getImageData(0,0,t.width,t.height).data;let a="",m="";for(let e=0;e<i.length;e++)if((e+1)%4!==0&&(a+=(i[e]&1).toString(),a.length===8)){const d=parseInt(a,2);if(d===0){f(m);return}m+=String.fromCharCode(d),a=""}f(m)},r.onerror=u,r.src=p}),l=["#363537","#fc618d","#7bd88f","#fce566","#fd9353","#948ae3","#5ad4e6","#f7f1ff","#69676c","#fc618d","#7bd88f","#fce566","#fd9353","#948ae3","#5ad4e6","#f7f1ff"];function De(){const[p,f]=v.useState(Math.random()),[u,r]=v.useState(!1),[t,o]=v.useState(0);v.useEffect(()=>{},[t]);const i=()=>{let b=performance.now();const T=1e3,g=T/2,C=S=>{const c=S-b;c<T?(c<g?o(c/g):(c>=g&&c<g+16&&f(Math.random()),o(1-(c-g)/g)),requestAnimationFrame(C)):o(0)};requestAnimationFrame(C)},a=()=>{const b=document.createElement("input");b.type="file",b.accept="image/png",b.onchange=async T=>{const g=T.target.files?.[0];if(!g)return;const C=new FileReader;C.onload=async S=>{if(S.target?.result)try{const c=await Re(S.target.result);alert(c?`Signature Found:

"${c}"`:"No signature found in this image.")}catch{alert("Error reading signature.")}},C.readAsDataURL(g)},b.click()},{color0:m,color1:e,color2:d,color3:y,color4:R,color5:h,color6:w,color7:x,color8:D,color9:I,color10:q,color11:k,color12:N,color13:U,color14:_,color15:G,grain:X,speed:W,pixelRatio:Y,pixelation:$,distortion:H,relief:K,flowAngle:M,flowIntensity:L,bloomStr:Q,bloomThresh:Z,aberration:O,vignette:J,saturation:ee,brightness:te,overlayText:F,overlayPosition:j}=ce("Settings",{color0:l[0],color1:l[1],color2:l[2],color3:l[3],color4:l[4],color5:l[5],color6:l[6],color7:l[7],color8:l[8],color9:l[9],color10:l[10],color11:l[11],color12:l[12],color13:l[13],color14:l[14],color15:l[15],grain:{value:.12,min:0,max:.3,step:.01,label:"Texture"},speed:{value:.15,min:0,max:3,step:.05,label:"Speed"},flowAngle:{value:0,min:0,max:360,step:1,label:"Flow Direction"},flowIntensity:{value:0,min:0,max:2,step:.05,label:"Flow Strength"},pixelRatio:{value:1.5,min:.5,max:3,step:.1,label:"Quality"},pixelation:{value:0,min:0,max:1,step:.01,label:"Pixelation"},distortion:{value:1,min:0,max:2,step:.01,label:"Distortion"},relief:{value:1,min:0,max:2,step:.01,label:"Relief"},bloomStr:{value:0,min:0,max:3,step:.05,label:"Bloom Intensity"},bloomThresh:{value:.5,min:0,max:1,step:.01,label:"Bloom Threshold"},aberration:{value:0,min:0,max:.05,step:.001,label:"Aberration"},vignette:{value:0,min:0,max:.8,step:.01,label:"Vignette"},saturation:{value:.2,min:-1,max:1,step:.05,label:"Saturation"},brightness:{value:.05,min:-.5,max:.5,step:.01,label:"Brightness"},overlayText:{value:"",label:"Overlay Text"},overlayPosition:{options:{Center:"center",Bottom:"bottom"},value:"center",label:"Position"},"Randomize & repaint":A(()=>i()),"Export 4k":A(()=>ne()),"Verify Signature":A(()=>a())},{collapsed:!1}),oe=new E(Math.cos(M*Math.PI/180)*L,Math.sin(M*Math.PI/180)*L),s=v.useRef(null),z=v.useRef(F),V=v.useRef(j);v.useEffect(()=>{z.current=F,V.current=j},[F,j]);const ne=async()=>{if(r(!0),s.current){const b=s.current.style.width,T=s.current.style.height,g=s.current.style.position,C=s.current.style.zIndex;s.current.style.width="3840px",s.current.style.height="2160px",s.current.style.position="fixed",s.current.style.zIndex="-9999",s.current.style.top="0",s.current.style.left="0",await new Promise(c=>setTimeout(c,600));const S=document.querySelector("canvas");if(S)try{const re=await Te(S,"Created by Xscriptor with Xwall",z.current,V.current),P=document.createElement("a");P.download=`xwall-${Date.now()}.png`,P.href=re,P.click()}catch(c){console.error("Export failed",c)}s.current.style.width=b||"100%",s.current.style.height=T||"100%",s.current.style.position=g||"absolute",s.current.style.zIndex=C||"1"}r(!1)};return n.jsxs("div",{className:"app-container",children:[n.jsx("div",{className:"custom-leva-wrapper",children:n.jsx(ue,{theme:{colors:{elevation1:"rgba(20, 20, 20, 0.6)",elevation2:"rgba(255, 255, 255, 0.05)",elevation3:"rgba(255, 255, 255, 0.1)",accent1:"#FFD700",accent2:"#FFD700",accent3:"#D4AF37",highlight1:"#FFD700",highlight2:"#D4AF37",vivid1:"#ff00ff"},fonts:{mono:"Inter, monospace",sans:"Inter, sans-serif"},radii:{xs:"4px",sm:"8px",lg:"16px"}},hidden:u})}),n.jsxs("div",{className:"canvas-wrapper",ref:s,children:[n.jsxs(ae,{flat:!0,dpr:u?2:Y,gl:{antialias:!0,preserveDrawingBuffer:!0},orthographic:!0,camera:{zoom:1,position:[0,0,100]},children:[n.jsx(Se,{colors:[m,e,d,y,R,h,w,x,D,I,q,k,N,U,_,G],seed:p,grain:X,speed:W,transition:t,pixelation:$,distortion:H,relief:K,flowVector:oe}),n.jsxs(de,{children:[n.jsx(he,{luminanceThreshold:Z,intensity:Q,levels:9,mipmapBlur:!0}),n.jsx(pe,{offset:[O,O]}),n.jsx(xe,{offset:.3,darkness:J,eskil:!1,blendFunction:ge.NORMAL}),n.jsx(ve,{saturation:ee,hue:0}),n.jsx(ye,{brightness:te,contrast:0})]})]}),F&&n.jsx("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",display:"flex",justifyContent:"center",alignItems:j==="bottom"?"flex-end":"center",paddingBottom:j==="bottom"?"10%":"0"},children:n.jsx("h2",{style:{fontFamily:"Inter, sans-serif",fontWeight:500,color:"rgba(255, 255, 255, 0.9)",fontSize:"5vmin",textShadow:"0 10px 20px rgba(0,0,0,0.5)",margin:0,textAlign:"center",whiteSpace:"pre-wrap",backdropFilter:"blur(4px)",padding:"10px 20px",borderRadius:"20px"},children:F})})]}),n.jsxs("div",{className:"overlay",style:{opacity:u?0:1},children:[n.jsx("h1",{children:"Xwall"}),n.jsx("a",{href:"https://github.com/xscriptordev/xwall",target:"_blank",rel:"noopener noreferrer",title:"View Source",children:n.jsx("svg",{height:"20",width:"20",viewBox:"0 0 16 16",fill:"white",children:n.jsx("path",{d:"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"})})})]})]})}fe.createRoot(document.getElementById("root")).render(n.jsx(v.StrictMode,{children:n.jsx(De,{})}));
