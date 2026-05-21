import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameState } from '../types/threejs-intro.types';

type MotionState = Pick<GameState, 'kecepatanWarp' | 'isAlarmActive' | 'phase'>;

interface SceneEffectsProProps {
  gameState: MotionState;
}

type StarLayer = 'far' | 'mid' | 'near';

type StarEntry = {
  sprite: THREE.Sprite;
  baseScale: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  depthFactor: number;
  driftX: number;
  driftY: number;
  color: THREE.Color;
  layer: StarLayer;
  spreadX: number;
  spreadY: number;
};

type WarpLineEntry = {
  startIndex: number;
  baseLength: number;
  depthFactor: number;
  drift: number;
  spreadX: number;
  spreadY: number;
};

type MeteorState = {
  active: boolean;
  cooldown: number;
  life: number;
  maxLife: number;
  speed: number;
  trailLength: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);

const createGlowTexture = (size = 128) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const center = size / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.98)');
  gradient.addColorStop(0.36, 'rgba(214,247,255,0.86)');
  gradient.addColorStop(0.64, 'rgba(141,219,255,0.32)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  context.clearRect(0, 0, size, size);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
};

interface StarFieldProps {
  count?: number;
  warpSpeed: number;
  isAlarmActive: boolean;
  phase: MotionState['phase'];
}

const StarField = ({ count = 220, warpSpeed, isAlarmActive, phase }: StarFieldProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const starsRef = useRef<StarEntry[]>([]);
  const previousWarpRef = useRef(warpSpeed);
  const glowTexture = useMemo(() => createGlowTexture(128), []);

  useEffect(() => {
    if (!groupRef.current || !glowTexture) {
      return undefined;
    }

    const group = groupRef.current;
    group.clear();
    starsRef.current = [];

    const farCount = Math.max(60, Math.round(count * 0.56));
    const midCount = Math.max(30, Math.round(count * 0.3));
    const nearCount = Math.max(12, count - farCount - midCount);

    const layers: Array<{
      layer: StarLayer;
      amount: number;
      baseScaleMin: number;
      baseScaleMax: number;
      baseOpacity: number;
      spreadX: number;
      spreadY: number;
      depthMin: number;
      depthMax: number;
      speedFactor: number;
      color: string;
    }> = [
      {
        layer: 'far',
        amount: farCount,
        baseScaleMin: 0.85,
        baseScaleMax: 1.65,
        baseOpacity: 0.28,
        spreadX: 1800,
        spreadY: 1200,
        depthMin: -120,
        depthMax: 1800,
        speedFactor: 0.42,
        color: '#edf8ff',
      },
      {
        layer: 'mid',
        amount: midCount,
        baseScaleMin: 1.15,
        baseScaleMax: 2.45,
        baseOpacity: 0.42,
        spreadX: 1400,
        spreadY: 1000,
        depthMin: -60,
        depthMax: 1500,
        speedFactor: 0.7,
        color: '#ffffff',
      },
      {
        layer: 'near',
        amount: nearCount,
        baseScaleMin: 1.75,
        baseScaleMax: 3.9,
        baseOpacity: 0.58,
        spreadX: 900,
        spreadY: 700,
        depthMin: -20,
        depthMax: 1100,
        speedFactor: 1,
        color: '#d9f6ff',
      },
    ];

    layers.forEach((layerConfig) => {
      for (let index = 0; index < layerConfig.amount; index += 1) {
        const spriteMaterial = new THREE.SpriteMaterial({
          map: glowTexture,
          color: layerConfig.color,
          transparent: true,
          opacity: layerConfig.baseOpacity,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        const baseScale = randomRange(layerConfig.baseScaleMin, layerConfig.baseScaleMax);
        const starColor = new THREE.Color(layerConfig.color);

        const entry: StarEntry = {
          sprite,
          baseScale,
          baseOpacity: layerConfig.baseOpacity,
          twinkleSpeed: randomRange(0.7, 1.9),
          twinkleOffset: Math.random() * Math.PI * 2,
          depthFactor: layerConfig.speedFactor,
          driftX: randomRange(0.08, 0.22),
          driftY: randomRange(0.08, 0.2),
          color: starColor,
          layer: layerConfig.layer,
          spreadX: layerConfig.spreadX,
          spreadY: layerConfig.spreadY,
        };

        sprite.position.set(
          randomRange(-layerConfig.spreadX, layerConfig.spreadX),
          randomRange(-layerConfig.spreadY, layerConfig.spreadY),
          randomRange(layerConfig.depthMin, layerConfig.depthMax)
        );
        sprite.scale.setScalar(baseScale);
        sprite.userData = entry;
        group.add(sprite);
        starsRef.current.push(entry);
      }
    });

    return () => {
      starsRef.current.forEach((entry) => {
        entry.sprite.material.dispose();
      });
      glowTexture.dispose();
      group.clear();
      starsRef.current = [];
    };
  }, [count, glowTexture]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) {
      return;
    }

    const time = clock.getElapsedTime();
    const currentWarp = phase === 'idle' ? Math.max(warpSpeed * 0.35, 0.06) : warpSpeed;
    const acceleration = Math.max(0, (currentWarp - previousWarpRef.current) / Math.max(delta, 0.016));
    previousWarpRef.current = currentWarp;

    const travel = (0.6 + currentWarp * 11.5 + acceleration * 0.42) * delta * 60;
    const driftIntensity = 0.015 + currentWarp * 0.06 + acceleration * 0.01;
    const alarmMix = isAlarmActive ? 0.14 : 0.04;

    groupRef.current.children.forEach((child) => {
      const sprite = child as THREE.Sprite;
      const data = sprite.userData as StarEntry;
      const material = sprite.material as THREE.SpriteMaterial;

      sprite.position.z -= travel * data.depthFactor;
      sprite.position.x += Math.sin(time * data.twinkleSpeed + data.twinkleOffset) * data.driftX * driftIntensity * 60;
      sprite.position.y += Math.cos(time * data.twinkleSpeed * 0.8 + data.twinkleOffset * 1.37) * data.driftY * driftIntensity * 60;

      if (sprite.position.z < -240) {
        sprite.position.z = randomRange(1200, 1900);
        sprite.position.x = randomRange(-data.spreadX, data.spreadX);
        sprite.position.y = randomRange(-data.spreadY, data.spreadY);
      }

      const twinkle = 0.72 + Math.sin(time * data.twinkleSpeed + data.twinkleOffset) * 0.12 + Math.sin(time * 0.55 + data.twinkleOffset * 0.3) * 0.06;
      const brightness = clamp(data.baseOpacity * (0.85 + twinkle) * (1 + currentWarp * 0.18 + acceleration * 0.03), 0.05, 1.35);

      material.opacity = brightness;
      material.color.copy(data.color).lerp(new THREE.Color('#fff9ee'), alarmMix);
      sprite.scale.setScalar(data.baseScale * (1 + currentWarp * 0.11 + acceleration * 0.02));
    });
  });

  return <group ref={groupRef} />;
};

interface WarpTunnelProps {
  count?: number;
  warpSpeed: number;
  isAlarmActive: boolean;
  phase: MotionState['phase'];
}

const WarpTunnel = ({ count = 320, warpSpeed, isAlarmActive, phase }: WarpTunnelProps) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const lineDataRef = useRef<WarpLineEntry[]>([]);
  const previousWarpRef = useRef(warpSpeed);

  useEffect(() => {
    if (!geometryRef.current) {
      return undefined;
    }

    const positions: number[] = [];
    const lineData: WarpLineEntry[] = [];

    for (let index = 0; index < count; index += 1) {
      const startIndex = index * 6;
      const baseLength = randomRange(18, 52);
      const depthFactor = randomRange(0.75, 1.75);
      const drift = Math.random() * Math.PI * 2;
      const spreadX = randomRange(90, 250);
      const spreadY = randomRange(55, 190);
      const startX = randomRange(-spreadX, spreadX);
      const startY = randomRange(-spreadY, spreadY);
      const startZ = randomRange(-40, 220);

      positions.push(startX, startY, startZ);
      positions.push(startX * 0.94, startY * 0.94, startZ + baseLength);

      lineData.push({
        startIndex,
        baseLength,
        depthFactor,
        drift,
        spreadX,
        spreadY,
      });
    }

    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    lineDataRef.current = lineData;

    return () => {
      geometryRef.current?.dispose();
    };
  }, [count]);

  useFrame(({ clock }, delta) => {
    if (!geometryRef.current || !materialRef.current) {
      return;
    }

    const time = clock.getElapsedTime();
    const currentWarp = phase === 'idle' ? Math.max(warpSpeed * 0.45, 0.04) : warpSpeed;
    const acceleration = Math.max(0, (currentWarp - previousWarpRef.current) / Math.max(delta, 0.016));
    previousWarpRef.current = currentWarp;

    const travel = (0.8 + currentWarp * 14 + acceleration * 0.6) * delta * 60;
    const dashFactor = clamp(currentWarp * 0.85 + acceleration * 0.08, 0, 2.2);

    const positionAttribute = geometryRef.current.attributes.position.array as Float32Array;

    lineDataRef.current.forEach((entry) => {
      const zIndex1 = entry.startIndex + 2;
      const zIndex2 = entry.startIndex + 5;
      const xIndex1 = entry.startIndex;
      const yIndex1 = entry.startIndex + 1;
      const xIndex2 = entry.startIndex + 3;
      const yIndex2 = entry.startIndex + 4;

      const sway = Math.sin(time * 0.35 + entry.drift) * (0.2 + dashFactor * 0.3);
      positionAttribute[xIndex1] += Math.sin(time * 0.12 + entry.drift) * 0.08;
      positionAttribute[yIndex1] += Math.cos(time * 0.09 + entry.drift * 1.3) * 0.06;
      positionAttribute[xIndex2] = positionAttribute[xIndex1] * 0.96 + sway;
      positionAttribute[yIndex2] = positionAttribute[yIndex1] * 0.96 + sway * 0.65;

      positionAttribute[zIndex1] -= travel * entry.depthFactor;
      positionAttribute[zIndex2] = positionAttribute[zIndex1] + entry.baseLength * (1 + dashFactor * 1.9);

      if (positionAttribute[zIndex1] < -10) {
        const respawnLength = randomRange(18, 58);
        const respawnSpreadX = entry.spreadX * (0.85 + Math.random() * 0.5);
        const respawnSpreadY = entry.spreadY * (0.8 + Math.random() * 0.45);
        const respawnZ = randomRange(150, 260);

        positionAttribute[xIndex1] = randomRange(-respawnSpreadX, respawnSpreadX);
        positionAttribute[yIndex1] = randomRange(-respawnSpreadY, respawnSpreadY);
        positionAttribute[zIndex1] = respawnZ;
        positionAttribute[xIndex2] = positionAttribute[xIndex1] * 0.96;
        positionAttribute[yIndex2] = positionAttribute[yIndex1] * 0.96;
        positionAttribute[zIndex2] = respawnZ + respawnLength;
        entry.baseLength = respawnLength;
      }
    });

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.computeBoundingSphere();

    materialRef.current.color.set(isAlarmActive ? '#fff4e8' : '#f7ffff');
    materialRef.current.opacity = dashFactor > 0.02 ? clamp(0.05 + dashFactor * 0.6 + acceleration * 0.04, 0, 1) : 0;
  });

  return (
    <group>
      <lineSegments>
        <bufferGeometry ref={geometryRef} />
        <lineBasicMaterial
          ref={materialRef}
          color={0xf8ffff}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

interface MeteorProps {
  seed: number;
  warpSpeed: number;
  isAlarmActive: boolean;
  phase: MotionState['phase'];
}

const Meteor = ({ seed, warpSpeed, isAlarmActive, phase }: MeteorProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.LineSegments>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const stateRef = useRef<MeteorState>({
    active: false,
    cooldown: 0,
    life: 0,
    maxLife: 0,
    speed: 0,
    trailLength: 0,
    position: new THREE.Vector3(),
    direction: new THREE.Vector3(0, 0, -1),
  });
  const previousWarpRef = useRef(warpSpeed);
  const haloTexture = useMemo(() => createGlowTexture(128), []);
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      0, 0, -1,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);
  const headMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#47433c',
        roughness: 0.92,
        metalness: 0.08,
        flatShading: true,
        emissive: '#ffe7c4',
        emissiveIntensity: 0.08,
      }),
    []
  );
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: haloTexture ?? undefined,
        color: '#fff6df',
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [haloTexture]
  );
  const trailMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#fff3d2',
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    const spawnMeteor = (instant = false) => {
      const state = stateRef.current;
      const start = new THREE.Vector3();
      const target = new THREE.Vector3();
      const edge = Math.floor((seed + Math.random() * 4) % 4);

      if (edge === 0) {
        start.set(randomRange(-900, 900), randomRange(220, 460), randomRange(680, 1200));
        target.set(randomRange(-160, 160), randomRange(-120, 120), randomRange(-480, -180));
      } else if (edge === 1) {
        start.set(randomRange(-1100, 1100), randomRange(-420, -220), randomRange(560, 1120));
        target.set(randomRange(-140, 140), randomRange(80, 180), randomRange(-450, -220));
      } else if (edge === 2) {
        start.set(-980, randomRange(-260, 260), randomRange(620, 1100));
        target.set(randomRange(120, 240), randomRange(-80, 140), randomRange(-520, -200));
      } else {
        start.set(980, randomRange(-260, 260), randomRange(620, 1100));
        target.set(randomRange(-240, -120), randomRange(-80, 140), randomRange(-520, -200));
      }

      state.position.copy(start);
      state.direction.copy(target.sub(start)).normalize();
      state.speed = randomRange(58, 126) * (instant ? 1 : 0.9 + Math.random() * 0.22);
      state.trailLength = randomRange(7, 14);
      state.life = 0;
      state.maxLife = randomRange(1.1, 2.8);
      state.cooldown = randomRange(1.6, 4.6);
      state.active = true;

      if (groupRef.current) {
        groupRef.current.visible = true;
        groupRef.current.position.copy(start);
        groupRef.current.lookAt(start.clone().add(state.direction));
      }
    };

    spawnMeteor(true);

    return () => {
      trailGeometry.dispose();
      trailMaterial.dispose();
      haloMaterial.dispose();
      headMaterial.dispose();
      haloTexture?.dispose();
    };
  }, [headMaterial, haloMaterial, haloTexture, seed, trailGeometry, trailMaterial]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const state = stateRef.current;
    const time = clock.getElapsedTime();
    const currentWarp = phase === 'idle' ? Math.max(warpSpeed * 0.45, 0.03) : warpSpeed;
    const acceleration = Math.max(0, (currentWarp - previousWarpRef.current) / Math.max(delta, 0.016));
    previousWarpRef.current = currentWarp;

    const speedBoost = 1 + currentWarp * 0.95 + acceleration * 0.06 + (isAlarmActive ? 0.12 : 0);
    const burnFactor = clamp(currentWarp * 0.9 + acceleration * 0.08, 0, 2.5);

    if (!state.active) {
      state.cooldown -= delta * (1 + currentWarp * 0.35);
      group.visible = false;
      if (state.cooldown <= 0) {
        state.active = true;
        const wake = new THREE.Vector3();
        const target = new THREE.Vector3();
        const edge = Math.floor((seed + Math.random() * 4) % 4);

        if (edge === 0) {
          wake.set(randomRange(-900, 900), randomRange(220, 460), randomRange(680, 1200));
          target.set(randomRange(-160, 160), randomRange(-120, 120), randomRange(-480, -180));
        } else if (edge === 1) {
          wake.set(randomRange(-1100, 1100), randomRange(-420, -220), randomRange(560, 1120));
          target.set(randomRange(-140, 140), randomRange(80, 180), randomRange(-450, -220));
        } else if (edge === 2) {
          wake.set(-980, randomRange(-260, 260), randomRange(620, 1100));
          target.set(randomRange(120, 240), randomRange(-80, 140), randomRange(-520, -200));
        } else {
          wake.set(980, randomRange(-260, 260), randomRange(620, 1100));
          target.set(randomRange(-240, -120), randomRange(-80, 140), randomRange(-520, -200));
        }

        state.position.copy(wake);
        state.direction.copy(target.sub(wake)).normalize();
        state.speed = randomRange(58, 126);
        state.trailLength = randomRange(7, 14);
        state.life = 0;
        state.maxLife = randomRange(1.1, 2.8);
        group.visible = true;
      }
      return;
    }

    state.life += delta;
    state.position.addScaledVector(state.direction, state.speed * speedBoost * delta);

    const turbulence = Math.sin(time * 0.7 + seed) * 0.0009 * (1 + currentWarp * 0.5);
    state.direction.x += Math.sin(time * 1.3 + seed * 1.7) * turbulence;
    state.direction.y += Math.cos(time * 1.1 + seed * 1.2) * turbulence * 0.85;
    state.direction.normalize();

    group.position.copy(state.position);
    group.lookAt(state.position.clone().add(state.direction));
    group.visible = true;

    const trailLength = 6 + currentWarp * 16 + acceleration * 0.3;
    state.trailLength = trailLength;
    if (trailRef.current) {
      trailRef.current.scale.z = trailLength;
      const trailMaterialRef = trailRef.current.material as THREE.LineBasicMaterial;
      trailMaterialRef.opacity = clamp(0.18 + burnFactor * 0.18 + acceleration * 0.02, 0.08, 0.92);
      trailMaterialRef.color.set(isAlarmActive ? '#fff1db' : '#ffeed0');
    }

    if (haloRef.current) {
      const haloMaterialRef = haloRef.current.material as THREE.MeshBasicMaterial;
      haloMaterialRef.opacity = clamp(0.18 + burnFactor * 0.18 + acceleration * 0.02, 0.18, 0.98);
      haloRef.current.scale.setScalar(1.8 + burnFactor * 0.6);
    }

    if (headRef.current) {
      const material = headRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = clamp(0.08 + burnFactor * 0.24, 0.08, 0.65);
    }

    if (lightRef.current) {
      lightRef.current.intensity = clamp(0.15 + burnFactor * 0.75 + acceleration * 0.03, 0.15, 2.5);
      lightRef.current.distance = 20 + trailLength * 5;
    }

    if (
      Math.abs(state.position.x) > 1500 ||
      Math.abs(state.position.y) > 900 ||
      state.position.z < -620 ||
      state.life > state.maxLife
    ) {
      state.active = false;
      state.cooldown = randomRange(1.8, 5.2) / (1 + currentWarp * 0.15);
      group.visible = false;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={headRef}>
        <sphereGeometry args={[1, 7, 6]} />
        <primitive object={headMaterial} attach="material" />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[2.1, 12, 12]} />
        <primitive object={haloMaterial} attach="material" />
      </mesh>
      <lineSegments ref={trailRef}>
        <bufferGeometry ref={trailGeometry} />
        <primitive object={trailMaterial} attach="material" />
      </lineSegments>
      <pointLight ref={lightRef} color="#fff6e7" intensity={0.2} distance={30} />
    </group>
  );
};

interface MeteorShowerProps {
  count?: number;
  warpSpeed: number;
  isAlarmActive: boolean;
  phase: MotionState['phase'];
}

const MeteorShower = ({ count = 3, warpSpeed, isAlarmActive, phase }: MeteorShowerProps) => {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <Meteor key={`meteor-${index}`} seed={index * 17.21} warpSpeed={warpSpeed} isAlarmActive={isAlarmActive} phase={phase} />
      ))}
    </group>
  );
};

export const SceneEffectsPro = ({ gameState }: SceneEffectsProProps) => {
  const { starCount, warpCount, meteorCount } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { starCount: 220, warpCount: 320, meteorCount: 3 };
    }

    const compact = window.matchMedia('(max-width: 900px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      return compact
        ? { starCount: 96, warpCount: 120, meteorCount: 1 }
        : { starCount: 140, warpCount: 180, meteorCount: 1 };
    }

    return compact
      ? { starCount: 150, warpCount: 220, meteorCount: 2 }
      : { starCount: 220, warpCount: 320, meteorCount: 3 };
  }, []);

  return (
    <>
      <StarField
        count={starCount}
        warpSpeed={gameState.kecepatanWarp}
        isAlarmActive={gameState.isAlarmActive}
        phase={gameState.phase}
      />
      <WarpTunnel
        count={warpCount}
        warpSpeed={gameState.kecepatanWarp}
        isAlarmActive={gameState.isAlarmActive}
        phase={gameState.phase}
      />
      <MeteorShower
        count={meteorCount}
        warpSpeed={gameState.kecepatanWarp}
        isAlarmActive={gameState.isAlarmActive}
        phase={gameState.phase}
      />
    </>
  );
};

export default SceneEffectsPro;
