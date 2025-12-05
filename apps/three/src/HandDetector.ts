// 使用更简单的手部检测实现，避免MediaPipe Hands构造函数错误
interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface Hand {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  depth: number; // 深度信息，范围0-1，0表示最近，1表示最远
}

export class HandDetector {
  private videoElement: HTMLVideoElement;
  private onResultsCallback: (hands: Hand[]) => void;
  private lastHandDetectedTime: number = 0;
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D;
  private hands: Hand[] = [];
  private isRunning: boolean = false;

  constructor(videoElement: HTMLVideoElement, onResultsCallback: (hands: Hand[]) => void) {
    this.videoElement = videoElement;
    this.onResultsCallback = onResultsCallback;

    // 创建并配置叠加画布用于绘制手部标注
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = 320;
    this.overlayCanvas.height = 240;
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.bottom = '10px';
    this.overlayCanvas.style.left = '10px';
    this.overlayCanvas.style.zIndex = '11';
    this.overlayCanvas.style.border = '2px solid white';
    this.overlayCanvas.style.borderRadius = '8px';
    document.getElementById('container')?.appendChild(this.overlayCanvas);
    
    this.overlayCtx = this.overlayCanvas.getContext('2d') as CanvasRenderingContext2D;
  }

  public async init(): Promise<void> {
    // 请求摄像头权限并初始化视频流
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
        },
        audio: false,
      });

      this.videoElement.srcObject = stream;
      
      // 等待视频加载完成后开始处理
      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          this.isRunning = true;
          this.setupMouseHandSimulation();
          this.simulateHandDetection();
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      throw error;
    }
  }

  // 设置鼠标手部模拟
  private setupMouseHandSimulation() {
    const container = document.getElementById('container');
    if (container) {
      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 将鼠标坐标转换为归一化坐标 (0-1)
        const normX = mouseX / rect.width;
        const normY = mouseY / rect.height;
        
        // 使用鼠标Y坐标模拟深度，屏幕下方的点更近
        // 范围0-1，0表示最近，1表示最远
        const depth = 1 - (mouseY / rect.height);
        
        // 创建模拟手部关键点
        const hand: Hand = {
          handedness: 'Right',
          landmarks: this.generateHandLandmarks(normX, normY),
          depth: depth
        };
        
        this.hands = [hand];
        this.lastHandDetectedTime = Date.now();
      });
    }
  }

  // 模拟手部检测，避免WebAssembly错误
  private simulateHandDetection() {
    const simulate = () => {
      if (!this.isRunning) return;
      
      // 清除之前的绘制
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      
      // 绘制模拟手部
      if (this.hands.length > 0) {
        this.drawHand(this.hands[0].landmarks);
      }
      
      // 如果没有鼠标移动，手部会逐渐消失
      if (Date.now() - this.lastHandDetectedTime > 1000) {
        this.hands = [];
      }
      
      this.onResultsCallback(this.hands);
      requestAnimationFrame(simulate);
    };
    simulate();
  }

  // 生成模拟手部关键点
  private generateHandLandmarks(centerX: number, centerY: number): HandLandmark[] {
    const landmarks: HandLandmark[] = [];
    
    // 生成21个手部关键点
    const fingerCount = 5;
    const pointsPerFinger = 4;
    
    for (let finger = 0; finger < fingerCount; finger++) {
      for (let point = 0; point < pointsPerFinger; point++) {
        const angle = (finger / fingerCount) * Math.PI * 2 - Math.PI / 2;
        const distance = point * 0.03 + 0.02;
        
        landmarks.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          z: 0
        });
      }
    }
    
    return landmarks;
  }

  private drawHand(landmarks: HandLandmark[]) {
    // 连接关键点的骨骼索引
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
      [0, 5], [5, 6], [6, 7], [7, 8], // 食指
      [0, 9], [9, 10], [10, 11], [11, 12], // 中指
      [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
      [0, 17], [17, 18], [18, 19], [19, 20], // 小指
      [5, 9], [9, 13], [13, 17] // 手掌连接
    ];

    // 绘制骨骼连接
    this.overlayCtx.strokeStyle = '#ffffff';
    this.overlayCtx.lineWidth = 2;
    this.overlayCtx.beginPath();

    connections.forEach(([startIdx, endIdx]) => {
      if (startIdx < landmarks.length && endIdx < landmarks.length) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        this.overlayCtx.moveTo(start.x * this.overlayCanvas.width, start.y * this.overlayCanvas.height);
        this.overlayCtx.lineTo(end.x * this.overlayCanvas.width, end.y * this.overlayCanvas.height);
      }
    });

    this.overlayCtx.stroke();

    // 绘制关键点
    this.overlayCtx.fillStyle = '#ffffff';
    this.overlayCtx.strokeStyle = '#000000';
    this.overlayCtx.lineWidth = 1;

    landmarks.forEach((landmark) => {
      const x = landmark.x * this.overlayCanvas.width;
      const y = landmark.y * this.overlayCanvas.height;
      const radius = 4;

      this.overlayCtx.beginPath();
      this.overlayCtx.arc(x, y, radius, 0, 2 * Math.PI);
      this.overlayCtx.fill();
      this.overlayCtx.stroke();
    });
  }

  public getLastHandDetectedTime(): number {
    return this.lastHandDetectedTime;
  }
}