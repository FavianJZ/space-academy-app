import React, { useCallback, useMemo } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';
import * as THREE from 'three';

type QualityTier = 'low' | 'balanced';

const getQualityTier = (): QualityTier => {
  if (typeof window === 'undefined') return 'balanced';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const isSmallScreen = window.matchMedia('(max-width: 900px)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const userAgent = navigator.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);

  if (reducedMotion || isSmallScreen || isMobileUA || memory <= 4 || cores <= 4) {
    return 'low';
  }

  return 'balanced';
};

export interface AdaptiveCanvasProps extends Omit<CanvasProps, 'dpr' | 'gl'> {
  quality?: 'auto' | 'low' | 'balanced';
  dpr?: CanvasProps['dpr'];
  gl?: CanvasProps['gl'];
}

export const AdaptiveCanvas: React.FC<AdaptiveCanvasProps> = ({
  quality = 'auto',
  dpr,
  gl,
  onCreated,
  shadows,
  ...rest
}) => {
  const tier = useMemo<QualityTier>(() => {
    if (quality === 'low') return 'low';
    if (quality === 'balanced') return 'balanced';
    return getQualityTier();
  }, [quality]);

  const resolvedDpr = useMemo<CanvasProps['dpr']>(() => {
    if (dpr) return dpr;
    return tier === 'low' ? [1, 1.15] : [1, 1.5];
  }, [dpr, tier]);

  const resolvedGl = useMemo<CanvasProps['gl']>(() => {
    if (typeof gl === 'function') return gl;

    return {
      alpha: true,
      antialias: tier !== 'low',
      powerPreference: 'low-power',
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
      ...(gl ?? {}),
    };
  }, [gl, tier]);

  const handleCreated = useCallback<NonNullable<CanvasProps['onCreated']>>(
    (state) => {
      state.gl.setClearColor(0x000000, 0);
      state.gl.toneMapping = THREE.ACESFilmicToneMapping;
      state.gl.toneMappingExposure = tier === 'low' ? 1.0 : 1.1;
      state.gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'low' ? 1.15 : 1.5));
      onCreated?.(state);
    },
    [onCreated, tier]
  );

  return (
    <Canvas
      dpr={resolvedDpr}
      gl={resolvedGl}
      shadows={shadows ?? false}
      onCreated={handleCreated}
      {...rest}
    />
  );
};

export default AdaptiveCanvas;
