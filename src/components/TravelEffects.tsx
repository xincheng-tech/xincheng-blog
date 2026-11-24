import { useMemo } from "react";
import { Bloom, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";
import { Vector2 } from "three";

export function TravelEffects() {
  const offset = useMemo(() => new Vector2(0.0008, 0.0008), []);
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.72} luminanceThreshold={0.34} mipmapBlur />
      <ChromaticAberration offset={offset} />
    </EffectComposer>
  );
}
