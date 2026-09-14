import { useGLTF } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";

export const MODEL_URLS = {
  shuttle: "/models/intro-routes/space_shuttle.glb?v=2",
  planet: "/models/intro-routes/planet_earth.glb?v=2",
  islandGround: "/models/intro-routes/island_ground.glb?v=2",
  islandFlying: "/models/intro-routes/island_flying.glb?v=2",
  islandFloating: "/models/intro-routes/island_floating.glb?v=2",
} as const;

export const FLOATING_CLOUD_PREFIXES = ["Icosphere"] as const;

export interface NormalizedModelProps {
  url: string;
  targetSize: number;
  clearSite?: [number, number];
  hiddenObjectPrefixes?: readonly string[];
}

const clearMeshGeometryAtSite = (
  mesh: THREE.Mesh,
  modelCenter: THREE.Vector3,
  longestSide: number,
  clearSite: [number, number]
) => {
  const objectBounds = new THREE.Box3().setFromObject(mesh);
  const objectSize = objectBounds.getSize(new THREE.Vector3());
  const normalizedFootprint =
    Math.max(objectSize.x, objectSize.z) / longestSide;

  if (normalizedFootprint >= 0.46) return;

  const positionAttribute = mesh.geometry.getAttribute("position");
  if (!positionAttribute) return;

  const sourceIndex = mesh.geometry.getIndex();
  const triangleCount = Math.floor(
    (sourceIndex?.count ?? positionAttribute.count) / 3
  );
  const keptIndices: number[] = [];
  const vertexA = new THREE.Vector3();
  const vertexB = new THREE.Vector3();
  const vertexC = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  const readVertex = (vertexIndex: number, target: THREE.Vector3) => {
    target
      .set(
        positionAttribute.getX(vertexIndex),
        positionAttribute.getY(vertexIndex),
        positionAttribute.getZ(vertexIndex)
      )
      .applyMatrix4(mesh.matrixWorld);
  };

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = triangle * 3;
    const indexA = sourceIndex?.getX(offset) ?? offset;
    const indexB = sourceIndex?.getX(offset + 1) ?? offset + 1;
    const indexC = sourceIndex?.getX(offset + 2) ?? offset + 2;

    readVertex(indexA, vertexA);
    readVertex(indexB, vertexB);
    readVertex(indexC, vertexC);
    centroid.copy(vertexA).add(vertexB).add(vertexC).multiplyScalar(1 / 3);

    const normalizedX = (centroid.x - modelCenter.x) / longestSide;
    const normalizedZ = (centroid.z - modelCenter.z) / longestSide;
    if (
      Math.hypot(
        normalizedX - clearSite[0],
        normalizedZ - clearSite[1]
      ) > 0.112
    ) {
      keptIndices.push(indexA, indexB, indexC);
    }
  }

  if (keptIndices.length === triangleCount * 3) return;
  if (keptIndices.length === 0) {
    mesh.visible = false;
    return;
  }

  const clippedGeometry = mesh.geometry.clone();
  clippedGeometry.setIndex(keptIndices);
  clippedGeometry.clearGroups();
  clippedGeometry.addGroup(0, keptIndices.length, 0);
  clippedGeometry.computeBoundingBox();
  clippedGeometry.computeBoundingSphere();
  mesh.geometry = clippedGeometry;
};

export const NormalizedModel: React.FC<NormalizedModelProps> = ({
  url,
  targetSize,
  clearSite,
  hiddenObjectPrefixes,
}) => {
  const gltf = useGLTF(url);

  const prepared = useMemo(() => {
    const clone = gltf.scene.clone(true);

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;

      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) => material.clone());
      } else {
        object.material = object.material.clone();
      }

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      materials.forEach((material) => {
        if (
          material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshPhysicalMaterial
        ) {
          material.envMapIntensity = 0.72;
          material.needsUpdate = true;
        }
      });
    });

    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const longestSide = Math.max(size.x, size.y, size.z, 0.001);

    if (clearSite || hiddenObjectPrefixes) {
      clone.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;

        if (
          hiddenObjectPrefixes?.some((prefix) =>
            object.name.startsWith(prefix)
          )
        ) {
          object.visible = false;
          return;
        }

        if (!clearSite) return;
        const objectBounds = new THREE.Box3().setFromObject(object);
        const objectCenter = objectBounds.getCenter(new THREE.Vector3());
        const objectSize = objectBounds.getSize(new THREE.Vector3());
        const normalizedX = (objectCenter.x - center.x) / longestSide;
        const normalizedZ = (objectCenter.z - center.z) / longestSide;
        const normalizedFootprint =
          Math.max(objectSize.x, objectSize.z) / longestSide;
        const distance = Math.hypot(
          normalizedX - clearSite[0],
          normalizedZ - clearSite[1]
        );

        if (
          normalizedFootprint < 0.19 &&
          distance < 0.105 + normalizedFootprint * 0.45
        ) {
          object.visible = false;
          return;
        }

        clearMeshGeometryAtSite(object, center, longestSide, clearSite);
      });
    }

    return {
      clone,
      center,
      scale: targetSize / longestSide,
    };
  }, [clearSite, gltf.scene, hiddenObjectPrefixes, targetSize]);

  return (
    <group scale={prepared.scale}>
      <group
        position={[
          -prepared.center.x,
          -prepared.center.y,
          -prepared.center.z,
        ]}
      >
        <primitive object={prepared.clone} />
      </group>
    </group>
  );
};

export default NormalizedModel;
