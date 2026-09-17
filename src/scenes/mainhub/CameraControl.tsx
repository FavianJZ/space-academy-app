import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import type { PlanetId } from "../../types/planet.types";

type CameraControlProps = {
  selectedPlanet: PlanetId | null;
};

const CameraControl: React.FC<CameraControlProps> = ({ selectedPlanet }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (selectedPlanet !== null) return;

    gsap.to(camera.position, {
      x: 0,
      y: 5,
      z: 25,
      duration: 1.5,
      ease: "power2.inOut",
    });
  }, [selectedPlanet, camera]);

  return null;
};

export default CameraControl;