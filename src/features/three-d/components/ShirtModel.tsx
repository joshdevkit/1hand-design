import * as THREE from "three";

/** Renders the THREE.Group produced by useShirtModel inside the R3F scene. */
export function ShirtModel({ object }: { object: THREE.Group }) {
  return <primitive object={object} />;
}
