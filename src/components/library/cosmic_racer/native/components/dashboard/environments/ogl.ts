export class Color extends Float32Array {
  constructor(r = 0, g = 0, b = 0) {
    if (arguments.length === 1) {
      super([r, r, r]);
    } else {
      super([r, g, b]);
    }
  }
}

export class Renderer {
  public canvas: HTMLCanvasElement;
  public gl: WebGLRenderingContext | WebGL2RenderingContext;
  public dpr: number;

  constructor(options: any = {}) {
    this.canvas = document.createElement('canvas');
    const contextType = options.webgl === 2 ? 'webgl2' : 'webgl';
    this.gl = this.canvas.getContext(contextType, {
      alpha: options.alpha !== false,
      antialias: options.antialias !== false,
      premultipliedAlpha: options.premultipliedAlpha !== false,
      preserveDrawingBuffer: options.preserveDrawingBuffer === true,
      powerPreference: options.powerPreference || 'default',
    }) as WebGLRenderingContext | WebGL2RenderingContext;
    this.dpr = options.dpr || 1;
  }

  setSize(w: number, h: number) {
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render({ scene }: { scene: Mesh }) {
    scene.draw();
  }
}

export class Triangle {
  public gl: WebGLRenderingContext | WebGL2RenderingContext;
  public positionBuffer: WebGLBuffer;
  public uvBuffer: WebGLBuffer;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
    
    // Position buffer: a giant triangle covering the whole screen
    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    // UV buffer
    this.uvBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 2, 0, 0, 2]), gl.STATIC_DRAW);
  }
}

export class Program {
  public gl: WebGLRenderingContext | WebGL2RenderingContext;
  public program: WebGLProgram;
  public uniforms: any;
  public uniformLocations: Record<string, WebGLUniformLocation> = {};

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, { vertex, fragment, uniforms }: any) {
    this.gl = gl;
    this.uniforms = uniforms || {};
    this.program = gl.createProgram()!;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertex);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('Vertex Shader Error:', gl.getShaderInfoLog(vs));
    }
    gl.attachShader(this.program, vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragment);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment Shader Error:', gl.getShaderInfoLog(fs));
    }
    gl.attachShader(this.program, fs);

    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Program Link Error:', gl.getProgramInfoLog(this.program));
    }

    Object.keys(this.uniforms).forEach((name) => {
      const loc = gl.getUniformLocation(this.program, name);
      if (loc !== null) {
        this.uniformLocations[name] = loc;
      }
    });
  }

  bind() {
    this.gl.useProgram(this.program);
    Object.entries(this.uniforms).forEach(([name, uniform]: [string, any]) => {
      const loc = this.uniformLocations[name];
      if (!loc) return;
      let v = uniform.value;
      if (typeof v === 'number') this.gl.uniform1f(loc, v);
      else if (typeof v === 'boolean') this.gl.uniform1i(loc, v ? 1 : 0);
      else if (v instanceof Float32Array || Array.isArray(v)) {
        if (v.length === 2) this.gl.uniform2fv(loc, v);
        else if (v.length === 3) this.gl.uniform3fv(loc, v);
        else if (v.length === 4) this.gl.uniform4fv(loc, v);
      }
    });
  }
}

export class Mesh {
  public gl: WebGLRenderingContext | WebGL2RenderingContext;
  public geometry: Triangle;
  public program: Program;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, { geometry, program }: any) {
    this.gl = gl;
    this.geometry = geometry;
    this.program = program;
  }

  draw() {
    this.program.bind();

    const positionLoc = this.gl.getAttribLocation(this.program.program, 'position');
    const uvLoc = this.gl.getAttribLocation(this.program.program, 'uv');

    if (positionLoc !== -1) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry.positionBuffer);
      this.gl.enableVertexAttribArray(positionLoc);
      this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);
    }

    if (uvLoc !== -1) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geometry.uvBuffer);
      this.gl.enableVertexAttribArray(uvLoc);
      this.gl.vertexAttribPointer(uvLoc, 2, this.gl.FLOAT, false, 0, 0);
    }

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }
}
