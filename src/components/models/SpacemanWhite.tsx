import { useGLTF } from "@react-three/drei";
import {
  SpacemanModel,
  type SpacemanModelProps,
} from "./SpacemanModel";

const MODEL_URL = "/models/spaceman_white.glb";

export type SpacemanWhiteProps = Omit<SpacemanModelProps, "modelUrl">;

export function SpacemanWhite(props: SpacemanWhiteProps) {
  return <SpacemanModel {...props} modelUrl={MODEL_URL} />;
}

useGLTF.preload(MODEL_URL);
