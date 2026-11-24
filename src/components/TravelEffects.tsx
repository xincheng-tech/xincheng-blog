import { useMemo } from "react";
import { Bloom, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";
import { Vector2 } from "three";

export function TravelEffects() {
  const offset = useMemo(() => new Vector2(0.0012, 0.0012), []);
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={1.2} luminanceThreshold={0.22} mipmapBlur />
      <ChromaticAberration offset={offset} />
    </EffectComposer>
  );
}
