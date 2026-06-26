import * as THREE from 'three';

export class VolumetricEnvironmentSystem {
  scene: THREE.Scene;
  smokeMesh?: THREE.Mesh;
  smokeMaterial?: THREE.ShaderMaterial;
  
  fractalMesh?: THREE.Mesh;
  fractalMaterial?: THREE.ShaderMaterial;
  
  lightningCanvas?: HTMLCanvasElement;
  lightningContext?: CanvasRenderingContext2D | null;
  lightningTexture?: THREE.CanvasTexture;
  lightningMesh?: THREE.Mesh;
  lightningBolts: any[] = [];
  activeGlows: any[] = [];
  lastFrame: number = Date.now();
  lightningActiveIntervals: NodeJS.Timeout[] = [];
  activeBranchesCount = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // --- 1. SMOKE LAYER ---
  initSmoke(config: any) {
    if (this.smokeMesh) return;
    
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uColor: { value: new THREE.Color().setHSL((config.hue || 230) / 360, 0.8, 0.5) },
      uSpeed: { value: config.speed || 1.0 },
      uScale: { value: config.scale || 1.0 },
      uDensity: { value: config.density || 1.0 },
      uWarp: { value: config.warp || 4.0 },
      uContrast: { value: config.contrast || 3.0 },
      uBrightness: { value: config.brightness || 1.0 },
      uDrift: { value: new THREE.Vector2(config.driftX || 1.0, config.driftY || 0.5) }
    };

    this.smokeMaterial = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: config.blendMode === 'screen' ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uColor;
        uniform float uSpeed;
        uniform float uScale;
        uniform float uDensity;
        uniform float uWarp;
        uniform float uContrast;
        uniform float uBrightness;
        uniform vec2 uDrift;

        float hash(vec2 p) {
            vec3 p3  = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f*f*(3.0-2.0*f);
            return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                       mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }

        float fbm(vec2 x) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
            for (int i = 0; i < 6; ++i) {
                v += a * noise(x);
                x = rot * x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution.y; 
            uv *= 2.5 * uScale;
            vec2 tDir = uDrift * uTime * 0.05 * uSpeed;
            vec2 q = vec2(fbm(uv + tDir), fbm(uv + vec2(5.2,1.3) + tDir));
            vec2 r = vec2(fbm(uv + uWarp*q + vec2(1.7,9.2) + tDir*1.2), fbm(uv + uWarp*q + vec2(8.3,2.8) + tDir*0.8));
            float f = fbm(uv + uWarp*r + tDir*1.5);
            f = clamp((f - 0.5) * uContrast + 0.5, 0.0, 1.0);
            vec3 col = uColor * uBrightness;
            col = mix(col * 0.1, col, f);
            col = mix(col, vec3(1.0), clamp(length(q)*length(r)*0.15, 0.0, 1.0)); 
            float alpha = smoothstep(0.15, 0.95, f);
            float finalAlpha = alpha * 0.8 * uDensity;
            gl_FragColor = vec4(col * finalAlpha, finalAlpha);
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(10000, 10000); // Massive plane to act as background
    this.smokeMesh = new THREE.Mesh(geometry, this.smokeMaterial);
    
    // Attach directly to camera in CosmicRenderer or orthographically scale it
    // For now, place it extremely far back
    this.smokeMesh.position.z = -2000;
    this.smokeMesh.renderOrder = -999;
    this.scene.add(this.smokeMesh);
  }

  // --- 2. FRACTAL LIGHTMAP LAYER ---
  initFractalLightmap(config: any) {
    if (this.fractalMesh) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    
    const uniforms = {
      u_time: { value: 1.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_noise: { value: null as any },
      u_bg: { value: null as any },
      u_mouse: { value: new THREE.Vector2() },
      u_scroll: { value: 0 },
      u_panSpeed: { value: config.panSpeed || 1.0 },
      u_fractalSpeed: { value: config.fractalSpeed || 1.0 },
      u_fractalScale: { value: config.fractalScale || 1.0 },
      u_fractalIntensity: { value: config.fractalIntensity || 3.0 },
      u_layer1Depth: { value: config.layer1Depth ?? 0.2 },
      u_layer2Depth: { value: config.layer2Depth ?? 0.1 },
      u_cloudColour: { value: new THREE.Color().setStyle(config.cloudColor || '#2b1b4d') },
      u_lightColour: { value: new THREE.Color().setStyle(config.lightColor || '#5c9ce6') }
    };

    loader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png', (noiseTex) => {
      noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;
      uniforms.u_noise.value = noiseTex;
      
      loader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/clouds-1-tile.jpg', (bgTex) => {
        bgTex.wrapS = bgTex.wrapT = THREE.RepeatWrapping;
        uniforms.u_bg.value = bgTex;
      });
    });

    this.fractalMaterial = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: config.blendMode === 'screen' ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform sampler2D u_noise;
        uniform sampler2D u_bg;
        uniform float u_scroll;
        uniform float u_panSpeed;
        uniform float u_fractalSpeed;
        uniform float u_fractalScale;
        uniform float u_fractalIntensity;
        uniform float u_layer1Depth;
        uniform float u_layer2Depth;
        uniform vec3 u_cloudColour;
        uniform vec3 u_lightColour;
        
        float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

        float noise(vec3 p){
            vec3 a = floor(p);
            vec3 d = p - a;
            d = d * d * (3.0 - 2.0 * d);
            vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
            vec4 k1 = perm(b.xyxy);
            vec4 k2 = perm(k1.xyxy + b.zzww);
            vec4 c = k2 + a.zzzz;
            vec4 k3 = perm(c);
            vec4 k4 = perm(c + 1.0);
            vec4 o1 = fract(k3 * (1.0 / 41.0));
            vec4 o2 = fract(k4 * (1.0 / 41.0));
            vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
            vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
            return o4.y * d.y + o4.x * (1.0 - d.y);
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
          uv *= u_fractalScale; 
          float nt = u_time * u_fractalSpeed;
          float pt = u_time * u_panSpeed;
          float noise1 = noise(vec3(uv * 3.0 * noise(vec3(uv * 3.0 + 100., nt * 3. + 10.)), nt * 2.))  * 2.;
          float noise2 = noise(vec3(uv + 2.35, nt * 1.357 - 10.));
          uv.y -= u_scroll * .0001;
          uv += texture2D(u_bg, uv * vec2(.5, 1.) - vec2(pt * .05, 1.) - .5 * .05).rg * 0.08 + noise1 * .008 * (1. - clamp(noise1 * noise1 * 2. + .2, 0., 1.));
          vec3 tex = texture2D(u_bg, uv * vec2(.5, 1.) - vec2(pt * .02, 1.) - .5).rgb;
          uv += noise2 * .02 * tex.rg * (1. - clamp(noise2 * noise2 * 2. + .2, 0., 1.));
          vec3 tex2 = texture2D(u_bg, uv * vec2(.5, 1.) - vec2(pt * .008, 1.) - .5).rgb;
          float lum = dot(tex2, vec3(0.299, 0.587, 0.114));
          vec3 fragcolour = tex2 * u_cloudColour * u_layer1Depth + (1. - tex) * u_lightColour * u_layer2Depth * lum;
          fragcolour *= u_fractalIntensity;
          
          // Use AdditiveBlending in ThreeJS, so alpha is tied to luminance
          gl_FragColor = vec4(fragcolour, lum); 
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(10000, 10000);
    this.fractalMesh = new THREE.Mesh(geometry, this.fractalMaterial);
    this.fractalMesh.position.z = -1900;
    this.fractalMesh.renderOrder = -998;
    this.scene.add(this.fractalMesh);
  }

  // --- 3. LIGHTNING LAYER (Canvas2D to WebGL Texture) ---
  initLightning(config: any) {
    if (this.lightningMesh) return;
    
    this.lightningCanvas = document.createElement('canvas');
    this.lightningCanvas.width = window.innerWidth;
    this.lightningCanvas.height = window.innerHeight;
    this.lightningContext = this.lightningCanvas.getContext('2d');
    
    this.lightningTexture = new THREE.CanvasTexture(this.lightningCanvas);
    this.lightningTexture.minFilter = THREE.LinearFilter;
    
    const material = new THREE.MeshBasicMaterial({
      map: this.lightningTexture,
      transparent: true,
      depthWrite: false,
      blending: config.blendMode === 'screen' ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    
    const geometry = new THREE.PlaneGeometry(10000, 10000);
    this.lightningMesh = new THREE.Mesh(geometry, material);
    this.lightningMesh.position.z = -1800;
    this.lightningMesh.renderOrder = -997;
    this.scene.add(this.lightningMesh);
  }

  updateLightning(config: any, elapsed: number, cameraPosition: THREE.Vector3) {
    if (!this.lightningContext || !this.lightningCanvas || !this.lightningTexture) return;
    
    const context = this.lightningContext;
    const width = this.lightningCanvas.width;
    const height = this.lightningCanvas.height;
    
    context.clearRect(0, 0, width, height);

    const spawnThreshold = 1.0 - (0.01 * (config.speed || 1.0));
    const boltFadeDuration = 0.5;
    const totalBoltDuration = 0.75;
    
    if (Math.random() > spawnThreshold) {
      const x = Math.floor(-10.0 + Math.random() * (width + 20.0));
      const y = Math.floor((height / 2.0) + Math.random() * (height / 4.0));
      let lengthMultiplier = config.lightningLength ?? 1.5;
      let branchProb = config.lightningBranches ?? 0.98;
      
      if (config.randomizeLightning) {
        lengthMultiplier = 1.0 + Math.random(); 
        branchProb = 0.5 + Math.random() * 0.49;
      }
      
      const length = Math.floor((height / 2.0 + Math.random() * (height / 2.0)) * lengthMultiplier);
      
      this.activeGlows.push({
        x: x, y: y,
        opacity: (0.4 + Math.random() * 0.4) * ((config.intensity || 2.0) / 2.0)
      });
      
      const boltCanvas = document.createElement("canvas");
      boltCanvas.width = width;
      boltCanvas.height = height;
      const boltContext = boltCanvas.getContext("2d");
      if (boltContext) {
        this.lightningBolts.push({ canvas: boltCanvas, duration: 0.0 });
        this.recursiveLaunchBolt(x, y, length, Math.PI * 1.5, boltContext, branchProb, 0, y, config);
      }
    }

    for (let i = 0; i < this.lightningBolts.length; i++) {
      const bolt = this.lightningBolts[i];
      bolt.duration += elapsed;
      if (bolt.duration >= totalBoltDuration) {
        this.lightningBolts.splice(i, 1);
        i--;
        continue;
      }
      context.globalAlpha = Math.max(0.0, Math.min(1.0, (totalBoltDuration - bolt.duration) / boltFadeDuration));
      context.globalCompositeOperation = "screen";
      context.drawImage(bolt.canvas, 0, 0);
      context.globalCompositeOperation = "source-over"; 
    }

    const glowRadius = Math.max(100, width * 0.4 * (config.glow || 1.0));
    context.globalCompositeOperation = "screen";
    for (let i = 0; i < this.activeGlows.length; i++) {
      const glow = this.activeGlows[i];
      if (glow.opacity > 0.0) {
        const gradient = context.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glowRadius);
        const safeOpacity = Math.min(1.0, glow.opacity);
        gradient.addColorStop(0, `hsla(${config.hue || 220}, 80%, 100%, ${safeOpacity})`);
        gradient.addColorStop(0.4, `hsla(${config.hue || 220}, 90%, 80%, ${Math.min(1.0, safeOpacity * 0.7)})`);
        gradient.addColorStop(1, `hsla(${config.hue || 220}, 100%, 50%, 0.0)`);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(glow.x, glow.y, glowRadius, 0, Math.PI * 2);
        context.fill();

        const midRadius = glowRadius * 0.5;
        const midGradient = context.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, midRadius);
        midGradient.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1.0, glow.opacity * 1.5)})`);
        midGradient.addColorStop(1, `rgba(255, 255, 255, 0.0)`);
        context.fillStyle = midGradient;
        context.beginPath();
        context.arc(glow.x, glow.y, midRadius, 0, Math.PI * 2);
        context.fill();

        glow.opacity -= 1.0 * elapsed;
      } else {
        this.activeGlows.splice(i, 1);
        i--;
      }
    }
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1.0;

    this.lightningTexture.needsUpdate = true;
  }

  recursiveLaunchBolt(x: number, y: number, length: number, direction: number, boltContext: CanvasRenderingContext2D, branchProb: number, depth: number, originY: number, config: any) {
    if (this.activeBranchesCount > 150) return; 
    this.activeBranchesCount++;
    const originalDirection = direction;
    
    const boltInterval = setInterval(() => {
      if (length <= 0) {
        this.activeBranchesCount--;
        clearInterval(boltInterval);
        const index = this.lightningActiveIntervals.indexOf(boltInterval);
        if (index > -1) this.lightningActiveIntervals.splice(index, 1);
        return;
      }
      
      let i = 0;
      while (i++ < Math.floor(45) && length > 0) {
        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        x += Math.cos(direction);
        y -= Math.sin(direction);
        length--;
        
        if (x1 !== Math.floor(x) || y1 !== Math.floor(y)) {
          const distFromOrigin = Math.max(0, y1 - originY);
          const fadeInAlpha = Math.min(1.0, distFromOrigin / 100.0);
          const tipAlpha = Math.min(1.0, length / 350.0);
          const finalAlpha = fadeInAlpha * tipAlpha;
          
          boltContext.fillStyle = `hsla(${config.hue || 220}, 80%, 75%, ${finalAlpha})`;
          boltContext.fillRect(x1, y1, 2.0, 2.0); 
          
          direction = originalDirection + (-Math.PI / 8.0 + Math.random() * (Math.PI / 4.0));
          
          if (Math.random() > branchProb && depth < 4) {
            this.recursiveLaunchBolt(x1, y1, length * (0.3 + Math.random() * 0.4), originalDirection + (-Math.PI / 6.0 + Math.random() * (Math.PI / 3.0)), boltContext, branchProb, depth + 1, originY, config);
          } else if (Math.random() > 0.95) {
            this.recursiveLaunchBolt(x1, y1, length, originalDirection + (-Math.PI / 6.0 + Math.random() * (Math.PI / 3.0)), boltContext, branchProb, depth, originY, config);
            length = 0;
          }
        }
      }
    }, 10);
    this.lightningActiveIntervals.push(boltInterval);
  }

  // --- MAIN UPDATE LOOP ---
  update(camera: THREE.Camera, configs: { smoke?: any, fractal?: any, lightning?: any }) {
    const now = Date.now();
    const elapsed = (now - this.lastFrame) / 1000.0;
    this.lastFrame = now;

    // We position the meshes exactly in front of the camera, scaling them to fill the view
    // Since CosmicRenderer can zoom, an Orthographic projection behavior is maintained by keeping them statically parented or scaled
    
    if (configs.smoke) {
      this.initSmoke(configs.smoke);
      if (this.smokeMesh && this.smokeMaterial) {
        this.smokeMesh.position.copy(camera.position);
        this.smokeMesh.position.z -= 800; // Push far back
        this.smokeMaterial.uniforms.uTime.value += elapsed;
        this.smokeMaterial.uniforms.uColor.value.setHSL((configs.smoke.hue || 230) / 360, 0.8, 0.5);
        this.smokeMaterial.uniforms.uDensity.value = configs.smoke.density;
      }
    } else if (this.smokeMesh) {
      this.smokeMesh.visible = false;
    }

    if (configs.fractal) {
      this.initFractalLightmap(configs.fractal);
      if (this.fractalMesh && this.fractalMaterial) {
        this.fractalMesh.position.copy(camera.position);
        this.fractalMesh.position.z -= 750;
        this.fractalMaterial.uniforms.u_time.value += elapsed;
        this.fractalMaterial.uniforms.u_fractalIntensity.value = configs.fractal.fractalIntensity;
      }
    } else if (this.fractalMesh) {
      this.fractalMesh.visible = false;
    }

    if (configs.lightning) {
      this.initLightning(configs.lightning);
      if (this.lightningMesh) {
        this.lightningMesh.position.copy(camera.position);
        this.lightningMesh.position.z -= 700;
        this.updateLightning(configs.lightning, elapsed, camera.position as THREE.Vector3);
      }
    } else if (this.lightningMesh) {
      this.lightningMesh.visible = false;
    }
  }

  dispose() {
    this.lightningActiveIntervals.forEach(clearInterval);
    if (this.smokeMesh) this.scene.remove(this.smokeMesh);
    if (this.fractalMesh) this.scene.remove(this.fractalMesh);
    if (this.lightningMesh) this.scene.remove(this.lightningMesh);
  }
}
