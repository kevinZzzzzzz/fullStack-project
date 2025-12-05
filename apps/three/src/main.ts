import { HandDetector } from "./HandDetector"
import { ParticleSystem } from "./ParticleSystem"
import { Renderer } from "./Renderer"

class App {
  private handDetector: HandDetector
  private particleSystem: ParticleSystem
  private renderer: Renderer
  private permissionMessage: HTMLDivElement
  private cameraFeed: HTMLVideoElement

  constructor() {
    this.permissionMessage = document.getElementById(
      "permission-message"
    ) as HTMLDivElement
    this.cameraFeed = document.getElementById("camera-feed") as HTMLVideoElement

    // 初始化渲染器
    this.renderer = new Renderer()

    // 初始化手部检测器
    this.handDetector = new HandDetector(this.cameraFeed, (hands) => {
      this.particleSystem.updateHands(hands)
    })

    // 初始化粒子系统
    this.particleSystem = new ParticleSystem(
      this.renderer.scene
    )

    // 启动应用
    this.init()
  }

  private async init() {
    // 请求摄像头权限
    try {
      await this.handDetector.init()
      this.permissionMessage.style.display = "none"
      this.startAnimation()
    } catch (error) {
      console.error("Failed to initialize camera:", error)
      this.permissionMessage.style.display = "block"
    }
  }

  private startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate)
      this.particleSystem.update()
      this.renderer.render()
    }
    animate()
  }
}

// 启动应用
new App()
