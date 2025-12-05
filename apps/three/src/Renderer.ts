import * as THREE from "three"

export class Renderer {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private canvas: HTMLCanvasElement

  constructor() {
    // 获取 canvas 元素
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement

    // 初始化场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.z = 5

    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    this.scene.add(directionalLight)

    // 处理窗口大小调整
    window.addEventListener("resize", this.handleResize.bind(this))
  }

  private handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public render() {
    this.renderer.render(this.scene, this.camera)
  }
}
