import * as THREE from "three"

interface Hand {
  landmarks: {
    x: number
    y: number
    z: number
  }[]
  handedness: "Left" | "Right"
  depth: number // 深度信息，范围0-1，0表示最近，1表示最远
}

export class ParticleSystem {
  private scene: THREE.Scene
  private hands: Hand[] = []
  private particleCount: number = 2000
  private lastHandSeenTime: number = 0
  private isHandsVisible: boolean = false
  private particleGeometry!: THREE.BufferGeometry
  private particleMaterial!: THREE.PointsMaterial
  private particleSystem!: THREE.Points

  constructor(scene: THREE.Scene) {
    this.scene = scene

    // 初始化粒子系统
    this.initParticles()
  }

  private initParticles() {
    // 创建粒子几何体
    this.particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.particleCount * 3)
    const colors = new Float32Array(this.particleCount * 3)
    const sizes = new Float32Array(this.particleCount)

    // 初始化粒子位置和属性
    for (let i = 0; i < this.particleCount; i++) {
      // 初始位置在中心附近，更容易看到效果
      positions[i * 3] = (Math.random() - 0.5) * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2

      // 更大的粒子大小，更明显
      sizes[i] = Math.random() * 0.1 + 0.05

      // 明亮的白色粒子
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 1.0
      colors[i * 3 + 2] = 1.0
    }

    this.particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    )
    this.particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    )
    this.particleGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(sizes, 1)
    )

    // 创建粒子材质
    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1.0, // 更高的透明度，更明显
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true, // 添加光晕效果
    })

    // 创建粒子系统
    this.particleSystem = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    )
    this.scene.add(this.particleSystem)
  }

  public updateHands(hands: Hand[]) {
    this.hands = hands

    if (hands.length > 0) {
      this.lastHandSeenTime = Date.now()
      this.isHandsVisible = true
    } else {
      // 检查手部是否离开视野超过1秒
      if (Date.now() - this.lastHandSeenTime > 1000) {
        this.isHandsVisible = false
      }
    }
  }

  public update() {
    const positions = this.particleGeometry.attributes.position
      .array as Float32Array
    const sizes = this.particleGeometry.attributes.size.array as Float32Array

    // 更新粒子位置和大小
    for (let i = 0; i < this.particleCount; i++) {
      let targetX = positions[i * 3]
      let targetY = positions[i * 3 + 1]
      let targetZ = positions[i * 3 + 2]
      let particleSize = sizes[i]

      // 如果有手部检测到，更新粒子目标位置
      if (this.isHandsVisible && this.hands.length > 0) {
        // 随机选择一个手部关键点作为目标
        const handIndex = Math.floor(Math.random() * this.hands.length)
        const hand = this.hands[handIndex]
        const landmarkIndex = Math.floor(Math.random() * hand.landmarks.length)
        const landmark = hand.landmarks[landmarkIndex]

        // 根据手部深度调整粒子密度和大小
        // 深度值0表示最近，1表示最远
        // 更近时粒子分布更密集、更大
        const depth = hand.depth || 0.5
        const densityFactor = 1 - depth * 0.7 // 0.3-1.0，更近时密度更高
        const spread = 1.5 * densityFactor // 粒子分布范围，更近时范围更小

        // 根据深度调整粒子大小，更近时粒子更大
        const sizeFactor = 1 + (1 - depth) * 1.5 // 1-2.5倍，更近时更大
        particleSize = (Math.random() * 0.1 + 0.05) * sizeFactor

        // 随机偏移，根据深度调整偏移范围
        const randomOffset = (Math.random() - 0.5) * spread

        // 将手部关键点坐标转换为3D空间坐标，根据深度调整分布
        targetX = (landmark.x - 0.5) * 3 + randomOffset
        targetY = -(landmark.y - 0.5) * 3 + randomOffset
        targetZ = -landmark.z * 1 + randomOffset
      }

      // 平滑过渡到目标位置，增加lerp因子使粒子移动更快
      const lerpFactor = 0.2
      positions[i * 3] += (targetX - positions[i * 3]) * lerpFactor
      positions[i * 3 + 1] += (targetY - positions[i * 3 + 1]) * lerpFactor
      positions[i * 3 + 2] += (targetZ - positions[i * 3 + 2]) * lerpFactor

      // 更新粒子大小
      sizes[i] = particleSize
    }

    // 更新粒子系统的透明度，调整速度使过渡更明显
    if (!this.isHandsVisible) {
      this.particleMaterial.opacity = Math.max(
        0,
        this.particleMaterial.opacity - 0.05
      )
    } else {
      this.particleMaterial.opacity = Math.min(
        1.0,
        this.particleMaterial.opacity + 0.1
      )
    }

    // 标记几何体需要更新
    this.particleGeometry.attributes.position.needsUpdate = true
    this.particleGeometry.attributes.size.needsUpdate = true
  }
}
