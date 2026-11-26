import { useMemo } from "react";
import { Bloom, ChromaticAberration, EffectComposer } from "@react-three/postprocessing";
import { Vector2 } from "three";

export function TravelEffects({ traveling = false }: { traveling?: boolean }) {
  const offset = useMemo(
    () => new Vector2(traveling ? 0.0014 : 0.00035, traveling ? 0.0014 : 0.00035),
    [traveling],
  );
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={traveling ? 0.92 : 0.45} luminanceThreshold={0.42} mipmapBlur />
      <ChromaticAberration offset={offset} />
    </EffectComposer>
  );
}
