import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'https://esm.sh/three@0.160.0';
import { EffectComposer } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js?deps=three@0.160.0';
import { RenderPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js?deps=three@0.160.0';
import { UnrealBloomPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js?deps=three@0.160.0';

// MediaPipe全局变量类型定义
// Type definitions for MediaPipe globals loaded via script tags
declare global {
  interface Window {
    Hands: any;      // MediaPipe Hands构造函数
    Camera: any;     // MediaPipe Camera构造函数
    drawConnectors: any;  // 绘制骨骼连接函数
    drawLandmarks: any;   // 绘制关键点函数
    HAND_CONNECTIONS: any; // 手部骨骼连接配置
  }
}


// 粒子数量常量
const PARTICLE_COUNT = 3000;        // 手部粒子数量
const BG_PARTICLE_COUNT = 1500;     // 背景粒子数量
const HAND_TIMEOUT_MS = 1000;        // 手部检测超时时间（毫秒）

// 关键点到骨骼的映射，用于粒子分布
// Mapping of landmarks to bones for particle distribution
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // 拇指 Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // 食指 Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // 中指 Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // 无名指 Ring
  [0, 17], [17, 18], [18, 19], [19, 20]  // 小指 Pinky
];

const App = () => {
  // 状态管理
  const [permissionDenied, setPermissionDenied] = useState(false); // 摄像头权限是否被拒绝
  const [isHandsDetected, setIsHandsDetected] = useState(false);   // 是否检测到手部
  
  // Three.js相关引用
  const containerRef = useRef<HTMLDivElement>(null); // 容器引用
  const threeRef = useRef<{
    scene: THREE.Scene;                      // 场景
    camera: THREE.PerspectiveCamera;          // 相机
    renderer: THREE.WebGLRenderer;            // 渲染器
    composer: EffectComposer;                 // 后处理合成器
    particles: THREE.Points;                  // 手部粒子系统
    bgParticles: THREE.Points;                // 背景粒子系统
    geometry: THREE.BufferGeometry;           // 手部粒子几何体
    particleData: { 
      boneIndex: number;                      // 骨骼索引
      handIndex: number;                      // 手部索引 (0或1)
      t: number;                              // 沿骨骼的插值参数
      radialOffset: THREE.Vector3;             // 径向偏移量
      speed: number;                           // 脉动速度
      phase: number;                           // 起始相位
    }[];
    currentBgSpeed: number;                   // 当前背景粒子速度（用于平滑过渡）
  } | null>(null);

  // MediaPipe相关引用
  const videoRef = useRef<HTMLVideoElement>(null);       // 视频元素
  const canvasRef = useRef<HTMLCanvasElement>(null);     // 画布元素
  const lastDetectionTimeRef = useRef<number>(0);        // 上次检测时间
  const handsResultsRef = useRef<any>(null);             // 手部检测结果

  // 组件挂载时初始化
  useEffect(() => {
    initThree(); // 初始化Three.js场景
    const timer = setTimeout(() => initMediaPipe(), 100); // 延迟初始化MediaPipe

    // 处理窗口大小变化
    const handleResize = () => {
      if (!threeRef.current || !containerRef.current) return;
      const { camera, renderer, composer } = threeRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 组件卸载时清理
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * 初始化Three.js场景
   */
  const initThree = () => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    // 深色雾化效果，隐藏远处粒子
    scene.fog = new THREE.FogExp2(0x000000, 0.015); 

    // 创建透视相机
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.z = 30; // 设置相机位置

    // 创建WebGL渲染器
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); // 关闭抗锯齿以提高性能
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以提高性能
    renderer.toneMapping = THREE.ReinhardToneMapping; // 色调映射，改善发光效果
    containerRef.current.appendChild(renderer.domElement);

    // 后处理：发光效果
    const renderScene = new RenderPass(scene, camera); // 渲染通道
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // 发光强度
      0.2, // 发光半径
      0.85 // 阈值
    );
    bloomPass.strength = 1.8; // 调整发光强度
    bloomPass.radius = 0.3; // 调整发光半径
    bloomPass.threshold = 0.1; // 调整发光阈值

    // 创建后处理合成器
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 加载粒子纹理
    const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');

    // --- 背景星空粒子系统 --- 
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(BG_PARTICLE_COUNT * 3); // 背景粒子位置
    const bgColors = new Float32Array(BG_PARTICLE_COUNT * 3); // 背景粒子颜色
    
    // 创建星空/隧道效果
    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
        // 初始化背景粒子位置（宽范围分布）
        bgPositions[i * 3] = (Math.random() - 0.5) * 400; // 宽X轴分布
        bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 400; // 宽Y轴分布
        bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 200; // 深Z轴分布
        
        // 深紫/蓝色背景色调
        const color = new THREE.Color();
        color.setHSL(0.6 + Math.random() * 0.1, 0.8, 0.2 + Math.random() * 0.3);
        bgColors[i * 3] = color.r;
        bgColors[i * 3 + 1] = color.g;
        bgColors[i * 3 + 2] = color.b;
    }
    // 设置背景粒子几何体属性
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    // 创建背景粒子材质
    const bgMaterial = new THREE.PointsMaterial({
        size: 1.5, // 背景粒子大小
        vertexColors: true, // 使用顶点颜色
        map: sprite, // 发光纹理
        transparent: true, // 透明
        opacity: 0.6, // 透明度
        blending: THREE.AdditiveBlending, // 加法混合，增强发光效果
        depthWrite: false // 关闭深度写入，避免遮挡问题
    });
    // 创建背景粒子系统并添加到场景
    const bgParticles = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgParticles);

    // --- 手部粒子系统 --- 
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3); // 手部粒子位置
    const colors = new Float32Array(PARTICLE_COUNT * 3); // 手部粒子颜色
    const particleData = []; // 粒子数据数组

    // 霓虹颜色定义
    const color1 = new THREE.Color(0x00F0FF); // 霓虹青色
    const color2 = new THREE.Color(0xFF0055); // 霓虹粉色

    // 初始化手部粒子
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 随机初始位置
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      const boneIndex = Math.floor(Math.random() * BONES.length); // 随机骨骼索引
      const theta = Math.random() * Math.PI * 2; // 随机角度
      
      // 更紧凑的半径分布，使粒子更集中在骨骼周围
      const rBase = Math.random(); 
      const rBiased = rBase * rBase; // 偏向：大多数粒子靠近中心
      const radius = 0.15 + rBiased * 0.55; // 范围：~0.15到0.7单位

      // 创建径向偏移向量
      const radialOffset = new THREE.Vector3(
        Math.cos(theta) * radius,
        Math.sin(theta) * radius,
        0 
      );

      // 分配手部索引（0或1）
      const handIndex = i % 2; 

      // 存储粒子数据
      particleData.push({
        boneIndex,
        handIndex,
        t: Math.random(), // 沿骨骼的随机位置
        radialOffset,
        speed: 0.02 + Math.random() * 0.05, // 脉动速度
        phase: Math.random() * Math.PI * 2 // 随机起始相位
      });

      // 根据手部索引分配颜色
      const c = handIndex === 0 ? color1 : color2;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    // 设置手部粒子几何体属性
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 创建手部粒子材质
    const material = new THREE.PointsMaterial({
      size: 1.0, // 粒子大小
      vertexColors: true, // 使用顶点颜色
      map: sprite, // 发光纹理
      transparent: true, // 透明
      opacity: 0, // 初始透明度为0
      depthWrite: false, // 关闭深度写入
      blending: THREE.AdditiveBlending // 加法混合
    });

    // 创建手部粒子系统并添加到场景
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 存储Three.js相关对象
    threeRef.current = {
      scene, camera, renderer, composer, 
      particles, geometry, particleData,
      bgParticles,
      currentBgSpeed: 0.2 // 初始背景粒子速度
    };

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      updateScene(); // 更新场景
      composer.render(); // 使用后处理合成器渲染
    };
    animate();
  };

  /**
   * 更新场景
   */
  const updateScene = () => {
    if (!threeRef.current) return;
    const { geometry, particleData, particles, bgParticles, camera } = threeRef.current;
    
    // 获取当前时间
    const now = performance.now();
    const timeSec = now * 0.001;
    const timeSinceLastDetection = now - lastDetectionTimeRef.current;
    const isActive = timeSinceLastDetection < HAND_TIMEOUT_MS;

    // --- 1. 交互逻辑：计算手部接近度 --- 
    let targetBgSpeed = 0.2; // 基础漂移速度
    let handProximity = 0; // 手部接近度（0-1）

    const results = handsResultsRef.current;
    const multiHandLandmarks = results?.multiHandLandmarks || [];

    if (isActive && multiHandLandmarks.length > 0) {
        // 计算手部在屏幕上的"大小"来近似接近度
        // 手腕(0)到中指MCP(9)的距离是稳定的度量
        let maxHandSize = 0;
        
        multiHandLandmarks.forEach((landmarks: any) => {
            const wrist = landmarks[0]; // 手腕关键点
            const middleMCP = landmarks[9]; // 中指掌指关节
            // 归一化屏幕坐标中的欧几里得距离 (0-1)
            const dx = wrist.x - middleMCP.x;
            const dy = wrist.y - middleMCP.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > maxHandSize) maxHandSize = dist;
        });

        // 将手部大小映射到速度
        // 典型大小范围: 0.1 (远) 到 0.4 (近)
        // 映射 0.1 -> 1x 速度, 0.4 -> 15x 速度
        handProximity = Math.min(Math.max((maxHandSize - 0.05) / 0.3, 0), 1);
        targetBgSpeed = 0.5 + (handProximity * 4.0); // 背景速度范围: 0.5-4.5
    }

    // 平滑插值当前速度到目标速度
    threeRef.current.currentBgSpeed += (targetBgSpeed - threeRef.current.currentBgSpeed) * 0.05;
    const speed = threeRef.current.currentBgSpeed;

    // --- 2. 更新背景粒子 --- 
    const bgGeo = bgParticles.geometry;
    const bgPos = bgGeo.attributes.position.array as Float32Array;
    for(let i = 0; i < BG_PARTICLE_COUNT; i++) {
        // 向相机方向（+Z）移动粒子
        bgPos[i*3 + 2] += speed;

        // 如果粒子超过相机（相机位于z=30），重置位置
        if (bgPos[i*3 + 2] > 50) {
            bgPos[i*3 + 2] = -150; // 发送到背景
            // 重新随机化X/Y位置以增加多样性
            bgPos[i*3] = (Math.random() - 0.5) * 400;
            bgPos[i*3 + 1] = (Math.random() - 0.5) * 400;
        }
    }
    bgGeo.attributes.position.needsUpdate = true;

    // 可选：当速度高时添加相机抖动效果
    if (speed > 2.0) {
        camera.position.x = (Math.random() - 0.5) * (speed * 0.02);
        camera.position.y = (Math.random() - 0.5) * (speed * 0.02);
    } else {
        camera.position.x = 0;
        camera.position.y = 0;
    }

    // --- 3. 更新手部粒子 --- 
    const targetOpacity = isActive ? 1.0 : 0;
    const mat = particles.material as THREE.PointsMaterial;
    mat.opacity += (targetOpacity - mat.opacity) * 0.05; // 平滑透明度过渡

    if (mat.opacity > 0.01) {
        const positions = geometry.attributes.position.array as Float32Array;
        
        // 将手部关键点映射到3D世界坐标
        const mapLandmarkToWorld = (lm: any) => {
            const scale = 35; 
            // 镜像X轴：(0.5 - lm.x)
            const x = (0.5 - lm.x) * scale;
            // 根据屏幕宽高比调整Y轴缩放
            const y = (0.5 - lm.y) * (scale * (window.innerHeight / window.innerWidth)); 
            // Z轴缩放，增强深度感
            const z = -lm.z * scale * 2.5; 
            return new THREE.Vector3(x, y, z);
        };

        // 更新每个手部粒子
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const data = particleData[i];
            let targetPos = new THREE.Vector3();
            let hasTarget = false;
            let targetLandmarks = null;

            // 确定目标手部
            if (multiHandLandmarks.length === 1) {
                targetLandmarks = multiHandLandmarks[0];
            } else if (multiHandLandmarks.length > 1) {
                targetLandmarks = multiHandLandmarks[data.handIndex % multiHandLandmarks.length];
            }

            if (targetLandmarks) {
                hasTarget = true;
                // 获取骨骼的两个端点
                const bone = BONES[data.boneIndex];
                const p1 = targetLandmarks[bone[0]];
                const p2 = targetLandmarks[bone[1]];
                // 将端点转换为3D世界坐标
                const start = mapLandmarkToWorld(p1);
                const end = mapLandmarkToWorld(p2);

                // 沿骨骼插值计算目标位置
                targetPos.copy(start).lerp(end, data.t);

                // 动态"呼吸"动画 - 降低振幅，更清晰
                const pulse = 1.0 + Math.sin(timeSec * 3 + data.phase) * 0.1;
                
                // 降低湍流运动，保持形状紧凑
                const wobbleX = Math.sin(timeSec * 2 + data.phase) * 0.03;
                const wobbleY = Math.cos(timeSec * 1.5 + data.phase) * 0.03;
                const wobbleZ = Math.sin(timeSec * 4 + data.phase) * 0.03;

                // 应用偏移和脉动
                targetPos.x += data.radialOffset.x * pulse + wobbleX;
                targetPos.y += data.radialOffset.y * pulse + wobbleY;
                targetPos.z += data.radialOffset.z * pulse + wobbleZ;
            } else {
                // 没有目标时，随机浮动
                targetPos.set(
                positions[i*3] + Math.sin(timeSec + i)*0.05,
                positions[i*3+1] + Math.cos(timeSec + i)*0.05,
                positions[i*3+2]
                );
            }

            // 平滑过渡到目标位置
            const currentPos = new THREE.Vector3(positions[i*3], positions[i*3+1], positions[i*3+2]);
            const dist = currentPos.distanceTo(targetPos);
            // 动态插值因子：更快的跟踪，更锐利的运动
            const lerpFactor = hasTarget ? Math.min(0.4, Math.max(0.1, dist * 0.1)) : 0.02;

            currentPos.lerp(targetPos, lerpFactor);

            // 更新粒子位置
            positions[i*3] = currentPos.x;
            positions[i*3+1] = currentPos.y;
            positions[i*3+2] = currentPos.z;
        }
        geometry.attributes.position.needsUpdate = true;
    }
  };

  /**
   * 初始化MediaPipe手部检测
   */
  const initMediaPipe = () => {
    // 检查MediaPipe是否已加载
    if (!window.Hands) {
      console.warn("MediaPipe尚未加载，重试...");
      setTimeout(initMediaPipe, 200);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // 创建MediaPipe Hands实例
    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    // 配置Hands模型
    hands.setOptions({
      maxNumHands: 2,           // 最大检测手部数量
      modelComplexity: 1,       // 模型复杂度
      minDetectionConfidence: 0.5, // 最小检测置信度
      minTrackingConfidence: 0.5  // 最小跟踪置信度
    });

    // 处理检测结果
    hands.onResults((results: any) => {
      handsResultsRef.current = results;
      
      // 更新检测状态
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        lastDetectionTimeRef.current = performance.now();
        setIsHandsDetected(true);
      } else {
         // 超时后设置未检测到手部
         if (performance.now() - lastDetectionTimeRef.current > HAND_TIMEOUT_MS) {
            setIsHandsDetected(false);
         }
      }

      // 绘制摄像头画面
      drawCameraFeed(results);
    });

    // 创建MediaPipe Camera实例
    const camera = new window.Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 320,  // 视频宽度
      height: 240  // 视频高度
    });

    // 启动摄像头
    camera.start()
      .then(() => setPermissionDenied(false)) // 权限获取成功
      .catch((err: any) => {
        console.error(err);
        setPermissionDenied(true); // 权限获取失败
      });
  };

  /**
   * 绘制摄像头画面和手部关键点
   */
  const drawCameraFeed = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 保存画布状态
    ctx.save();
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    // 水平翻转画布，镜像效果
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    // 绘制视频帧，添加轻微的深色覆盖层，使骨架更突出
    if (results.image) {
       ctx.drawImage(results.image, 0, 0, width, height);
       ctx.fillStyle = 'rgba(0, 20, 40, 0.4)'; // 赛博朋克色调
       ctx.fillRect(0, 0, width, height);
    }

    // 绘制手部骨架 - 科技风格
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // 绘制骨骼连接
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00F0FF', // 青色连接
          lineWidth: 2
        });
        // 绘制关键点
        window.drawLandmarks(ctx, landmarks, {
          color: '#FFFFFF', // 白色关键点
          lineWidth: 1,
          radius: 2 // 关键点半径
        });
      }
    }
    // 恢复画布状态
    ctx.restore();
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: 'black', overflow: 'hidden' }}>
      
      {/* 3D场景容器 */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

      {/* 摄像头权限错误覆盖层 */}
      {permissionDenied && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: '#FF0055', backgroundColor: 'rgba(20,0,0,0.9)', padding: '24px 48px', borderRadius: '4px',
          zIndex: 100, fontSize: '18px', fontWeight: 'bold', border: '1px solid #FF0055',
          boxShadow: '0 0 20px rgba(255,0,85,0.4)'
        }}>
          ⚠ CAMERA ACCESS REQUIRED
        </div>
      )}

      {/* 等待指示器 */}
      {!isHandsDetected && !permissionDenied && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: '#00F0FF', fontSize: '16px', pointerEvents: 'none',
          textAlign: 'center', letterSpacing: '2px', textShadow: '0 0 10px #00F0FF'
        }}>
          INITIALIZING HAND TRACKING SYSTEM...<br/>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>Please raise your hands</span>
        </div>
      )}

      {/* 隐藏的视频元素 */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline />

      {/* 带骨架的摄像头画面 - 赛博朋克风格 */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        width: '320px',
        height: '240px',
        border: '1px solid #00F0FF',
        borderTop: '4px solid #00F0FF',
        borderRadius: '2px',
        overflow: 'hidden',
        zIndex: 50,
        backgroundColor: '#000',
        boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
      }}>
        {/* 网格覆盖层 */}
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '100% 4px', pointerEvents: 'none', opacity: 0.3
        }} />
        
        {/* 画布元素 */}
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={240} 
          style={{ width: '100%', height: '100%', display: 'block' }} 
        />
        
        {/* 标签 */}
        <div style={{
             position: 'absolute', bottom: '4px', right: '8px', 
             color: '#00F0FF', fontSize: '10px', fontFamily: 'monospace'
        }}>
            LIVE FEED [RAW]
        </div>
      </div>
    </div>
  );
};

// 渲染应用
const root = createRoot(document.getElementById('root')!);
root.render(<App />);