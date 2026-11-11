import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE, palette } from "../palette";

const LEG_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-0.7, -0.32],
  [0.7, -0.32],
  [-0.7, 0.32],
  [0.7, 0.32],
];

/** 小書桌，附書本、馬克杯與小檯燈。 */
function DeskBase() {
  return (
    <group>
      <RoundedBox
        args={[1.6, 0.08, 0.8]}
        radius={0.04}
        position={[0, 0.76, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.woodLight} {...MATTE} />
      </RoundedBox>
      {LEG_POSITIONS.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.36, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.72, 16]} />
          <meshStandardMaterial color={palette.woodDeep} {...MATTE} />
        </mesh>
      ))}
      {/* 書本 */}
      <RoundedBox
        args={[0.3, 0.06, 0.22]}
        radius={0.02}
        position={[-0.55, 0.83, -0.1]}
        rotation={[0, 0.15, 0]}
        castShadow
      >
        <meshStandardMaterial color={palette.mist} {...MATTE} />
      </RoundedBox>
      <RoundedBox
        args={[0.27, 0.05, 0.2]}
        radius={0.02}
        position={[-0.55, 0.88, -0.1]}
        rotation={[0, -0.1, 0]}
        castShadow
      >
        <meshStandardMaterial color={palette.cream} {...MATTE} />
      </RoundedBox>
      {/* 馬克杯 */}
      <mesh position={[0.1, 0.84, 0.1]} castShadow>
        <cylinderGeometry args={[0.06, 0.055, 0.1, 20]} />
        <meshStandardMaterial color={palette.sage} {...MATTE} />
      </mesh>
      {/* 小檯燈 */}
      <mesh position={[0.6, 0.81, -0.15]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 20]} />
        <meshStandardMaterial color={palette.woodDeep} {...MATTE} />
      </mesh>
      <mesh position={[0.6, 0.97, -0.15]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshStandardMaterial color={palette.woodDeep} {...MATTE} />
      </mesh>
      <mesh position={[0.6, 1.16, -0.15]}>
        <sphereGeometry args={[0.13, 20, 16]} />
        <meshStandardMaterial
          color={palette.cream}
          emissive="#ffd9a0"
          emissiveIntensity={0.55}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

export const Desk = memo(DeskBase);
