import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'https://esm.sh/three@0.160.0';
import { EffectComposer } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js?deps=three@0.160.0';
import { RenderPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js?deps=three@0.160.0';
import { UnrealBloomPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js?deps=three@0.160.0';

// Type definitions for MediaPipe globals loaded via script tags
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

const PARTICLE_COUNT = 3000;
const HAND_TIMEOUT_MS = 1000;

// Mapping of landmarks to bones for particle distribution
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20]  // Pinky
];

const App = () => {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isHandsDetected, setIsHandsDetected] = useState(false);
  
  // Refs for Three.js
  const containerRef = useRef<HTMLDivElement>(null);
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    particles: THREE.Points;
    geometry: THREE.BufferGeometry;
    particleData: { 
      boneIndex: number; 
      handIndex: number; // 0 or 1
      t: number; 
      radialOffset: THREE.Vector3;
      speed: number;
      phase: number;
    }[];
  } | null>(null);

  // Refs for MediaPipe
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const handsResultsRef = useRef<any>(null);

  useEffect(() => {
    initThree();
    const timer = setTimeout(() => initMediaPipe(), 100);

    const handleResize = () => {
      if (!threeRef.current || !containerRef.current) return;
      const { camera, renderer, composer } = threeRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const initThree = () => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.01);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); // Antialias false for bloom perf
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Tone mapping helps with the bloom glow intensity
    renderer.toneMapping = THREE.ReinhardToneMapping;
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing: Bloom
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, // Strength
      0.2, // Radius (Lower radius for sharper glow)
      0.85 // Threshold
    );
    bloomPass.strength = 1.5;
    bloomPass.radius = 0.2; // Tighter glow
    bloomPass.threshold = 0.1;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Create Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const particleData = [];

    // Brighter neon colors
    const color1 = new THREE.Color(0x00F0FF); // Neon Cyan
    const color2 = new THREE.Color(0xFF0055); // Neon Pink

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Initialize particles randomly in space
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      const boneIndex = Math.floor(Math.random() * BONES.length);
      
      const theta = Math.random() * Math.PI * 2;
      
      // Tighter radius for clearer finger definition
      // Use power to bias distribution towards the bone core (center)
      const rBase = Math.random(); 
      // Bias: most particles close to 0, fewer at edge
      const rBiased = rBase * rBase; 
      const radius = 0.15 + rBiased * 0.55; // Range: ~0.15 to 0.7 units

      const radialOffset = new THREE.Vector3(
        Math.cos(theta) * radius,
        Math.sin(theta) * radius,
        0 
      );

      const handIndex = i % 2; 

      particleData.push({
        boneIndex,
        handIndex,
        t: Math.random(), 
        radialOffset,
        speed: 0.02 + Math.random() * 0.05, // Pulsing speed
        phase: Math.random() * Math.PI * 2 // Random starting phase
      });

      const c = handIndex === 0 ? color1 : color2;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Improved texture for glow
    const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png');

    const material = new THREE.PointsMaterial({
      size: 1.0, // Slightly smaller particles for sharpness
      vertexColors: true,
      map: sprite,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    threeRef.current = {
      scene, camera, renderer, composer, particles, geometry, particleData
    };

    const animate = () => {
      requestAnimationFrame(animate);
      updateParticles();
      // Render via composer for Bloom
      composer.render();
    };
    animate();
  };

  const updateParticles = () => {
    if (!threeRef.current) return;
    const { geometry, particleData, particles } = threeRef.current;
    const positions = geometry.attributes.position.array as Float32Array;
    
    const now = performance.now();
    const timeSec = now * 0.001;
    const timeSinceLastDetection = now - lastDetectionTimeRef.current;
    const isActive = timeSinceLastDetection < HAND_TIMEOUT_MS;
    
    // Smooth opacity transition
    const targetOpacity = isActive ? 1.0 : 0;
    const mat = particles.material as THREE.PointsMaterial;
    mat.opacity += (targetOpacity - mat.opacity) * 0.05;

    if (mat.opacity < 0.01) return;

    const results = handsResultsRef.current;
    const multiHandLandmarks = results?.multiHandLandmarks || [];

    const mapLandmarkToWorld = (lm: any) => {
      const scale = 35; 
      // Mirror X: (0.5 - lm.x)
      const x = (0.5 - lm.x) * scale;
      const y = (0.5 - lm.y) * (scale * (window.innerHeight / window.innerWidth)); 
      const z = -lm.z * scale * 2.5; 
      return new THREE.Vector3(x, y, z);
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const data = particleData[i];
      let targetPos = new THREE.Vector3();
      let hasTarget = false;

      let targetLandmarks = null;

      if (multiHandLandmarks.length === 1) {
        targetLandmarks = multiHandLandmarks[0];
      } else if (multiHandLandmarks.length > 1) {
        targetLandmarks = multiHandLandmarks[data.handIndex % multiHandLandmarks.length];
      }

      if (targetLandmarks) {
        hasTarget = true;
        const bone = BONES[data.boneIndex];
        const p1 = targetLandmarks[bone[0]];
        const p2 = targetLandmarks[bone[1]];

        const start = mapLandmarkToWorld(p1);
        const end = mapLandmarkToWorld(p2);

        // Interpolate along the bone
        targetPos.copy(start).lerp(end, data.t);

        // Dynamic "Breathing" Animation - Reduced amplitude for clarity
        // Rotate the offset around the bone direction over time
        const pulse = 1.0 + Math.sin(timeSec * 3 + data.phase) * 0.1; // Reduced pulse
        
        // Reduced turbulent movement to keep shape tight
        const wobbleX = Math.sin(timeSec * 2 + data.phase) * 0.03;
        const wobbleY = Math.cos(timeSec * 1.5 + data.phase) * 0.03;
        const wobbleZ = Math.sin(timeSec * 4 + data.phase) * 0.03;

        targetPos.x += data.radialOffset.x * pulse + wobbleX;
        targetPos.y += data.radialOffset.y * pulse + wobbleY;
        targetPos.z += data.radialOffset.z * pulse + wobbleZ;

      } else {
        // Float randomly if not attached
        targetPos.set(
          positions[i*3] + Math.sin(timeSec + i)*0.05,
          positions[i*3+1] + Math.cos(timeSec + i)*0.05,
          positions[i*3+2]
        );
      }

      const currentPos = new THREE.Vector3(positions[i*3], positions[i*3+1], positions[i*3+2]);
      
      // Dynamic Lerp: faster tracking for sharper movement
      const dist = currentPos.distanceTo(targetPos);
      const lerpFactor = hasTarget ? Math.min(0.4, Math.max(0.1, dist * 0.1)) : 0.02;

      currentPos.lerp(targetPos, lerpFactor);

      positions[i*3] = currentPos.x;
      positions[i*3+1] = currentPos.y;
      positions[i*3+2] = currentPos.z;
    }

    geometry.attributes.position.needsUpdate = true;
  };

  const initMediaPipe = () => {
    if (!window.Hands) {
      console.warn("MediaPipe not loaded yet, retrying...");
      setTimeout(initMediaPipe, 200);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      handsResultsRef.current = results;
      
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        lastDetectionTimeRef.current = performance.now();
        setIsHandsDetected(true);
      } else {
         if (performance.now() - lastDetectionTimeRef.current > HAND_TIMEOUT_MS) {
            setIsHandsDetected(false);
         }
      }

      drawCameraFeed(results);
    });

    const camera = new window.Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 320,
      height: 240
    });

    camera.start()
      .then(() => setPermissionDenied(false))
      .catch((err: any) => {
        console.error(err);
        setPermissionDenied(true);
      });
  };

  const drawCameraFeed = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    // Draw video frame with slight dark overlay to make skeleton pop
    if (results.image) {
       ctx.drawImage(results.image, 0, 0, width, height);
       ctx.fillStyle = 'rgba(0, 20, 40, 0.4)'; // Cyberpunk tint
       ctx.fillRect(0,0,width,height);
    }

    // Draw skeleton - Tech Style
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00F0FF', // Cyan connections
          lineWidth: 2
        });
        window.drawLandmarks(ctx, landmarks, {
          color: '#FFFFFF',
          lineWidth: 1,
          radius: 2
        });
      }
    }
    ctx.restore();
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: 'black', overflow: 'hidden' }}>
      
      {/* 3D Scene */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

      {/* Permission Error Overlay */}
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

      {/* Waiting Indicator */}
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

      {/* Source Video (Hidden) */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline />

      {/* Camera Feed with Skeleton - Cyberpunk Style */}
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
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '100% 4px', pointerEvents: 'none', opacity: 0.3
        }} />
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={240} 
          style={{ width: '100%', height: '100%', display: 'block' }} 
        />
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);