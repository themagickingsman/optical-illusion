import { type WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
import {
    ACESFilmicToneMapping,
    PerspectiveCamera,
    RenderPipeline,
    Scene,
    Timer,
    TimestampQuery,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';

const position = new Vector3();
const defaultTarget = new Vector3();

class BaseExperience {
    protected disposed = false;
    private renderChain: Promise<void> = Promise.resolve();

    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    clock = new Timer();
    prevTime = 0;
    delta = 0;

    viewport = { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 };

    constructor(canvas: HTMLCanvasElement, rendererParams: WebGPURendererParameters = {}) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.clock.connect(document);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({
            canvas,
            alpha: true,
            powerPreference: 'high-performance',
            ...rendererParams,
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(35, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0, 15);

        this.viewport = this.getViewport();

        this.initEvents();
        this.renderer.setAnimationLoop(() => {
            this.renderChain = this.renderChain.then(() => Promise.resolve(this.render())).catch(() => {});
        });
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 2);
    }

    private getViewport() {
        const fov = (this.camera.fov * Math.PI) / 180;
        const distance = this.camera.getWorldPosition(position).distanceTo(defaultTarget);
        const h = 2 * Math.tan(fov / 2) * distance;
        const aspect = this.canvas.width / this.canvas.height;
        const w = aspect * h;

        return { height: h, width: w, top: h / 2, left: -w / 2, right: w / 2, bottom: -h / 2 };
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.viewport = this.getViewport();
    }

    protected initEvents() {
        this.onWindowResize();
        window.addEventListener('resize', this.onWindowResize);
    }

    protected destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    render(postProcessing?: RenderPipeline) {
        if (this.disposed) {
            return;
        }

        this.clock.update();
        const elapsedTime = this.clock.getElapsed();

        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        if (postProcessing) {
            postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    destroy() {
        if (this.disposed) {
            return;
        }

        this.disposed = true;

        this.clock.disconnect();
        this.renderer.setAnimationLoop(null);
        this.destroyEvents();

        this.disposeRendererSafely();
    }

    private async disposeRendererSafely(): Promise<void> {
        if (!this.renderer.hasInitialized()) {
            return;
        }

        await this.renderChain.catch(() => {});

        this.renderer.dispose();
    }
}

export default BaseExperience;
