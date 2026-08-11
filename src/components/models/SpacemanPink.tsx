import { useGLTF } from "@react-three/drei";
import {
  SpacemanModel,
  type SpacemanModelProps,
} from "./SpacemanModel";

const MODEL_URL = "/models/spaceman_pink.glb";

export type SpacemanPinkProps = Omit<SpacemanModelProps, "modelUrl">;

export function SpacemanPink(props: SpacemanPinkProps) {
  return <SpacemanModel {...props} modelUrl={MODEL_URL} />;
}

useGLTF.preload(MODEL_URL);
