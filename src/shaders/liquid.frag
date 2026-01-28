
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
