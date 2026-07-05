"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * A wireframe icosahedron, not a coin. The brief for B20 is explicitly
 * "not a smart contract" — a spinning coin would visually contradict that.
 * An angular, faceted solid rendered in wireframe reads as "structure
 * embedded in something harder," closer to the actual mental model of a
 * precompile living inside node software.
 */
function Lattice() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.18;
    meshRef.current.rotation.x += delta * 0.06;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshBasicMaterial color="#0052FF" wireframe />
    </mesh>
  );
}

export function PrecompileObject() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      className="!absolute inset-0"
      aria-hidden="true"
    >
      <ambientLight intensity={0.6} />
      <Lattice />
    </Canvas>
  );
}
