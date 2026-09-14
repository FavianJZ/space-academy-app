import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlanetId } from "../../types/planet.types";

type CameraFollowPlanetProps = {
  selectedPlanet: PlanetId | null;
  planetRefs: {
    [key in PlanetId]?: React.RefObject<THREE.Group | null>;
  };
};

const CameraFollowPlanet: React.FC<CameraFollowPlanetProps> = ({
  selectedPlanet,
  planetRefs,
}) => {
  const { camera } = useThree();
  const cameraOffsetRef = useRef(new THREE.Vector3(0, 3, 8));

  useFrame(() => {
    if (selectedPlanet === null) return;

    const selectedPlanetRef = planetRefs[selectedPlanet];

    if (!selectedPlanetRef?.current) return;

    const planetPosition = new THREE.Vector3();

    selectedPlanetRef.current.getWorldPosition(planetPosition);

    const cameraPosition = planetPosition.clone().add(cameraOffsetRef.current);

    camera.position.lerp(cameraPosition, 0.1);
    camera.lookAt(planetPosition);
  });

  return null;
};

export default CameraFollowPlanet;