import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE, palette } from "../palette";

const LEG_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-0.2, -0.2],
  [0.2, -0.2],
  [-0.2, 0.2],
  [0.2, 0.2],
];

/** 圓潤小椅子：椅面朝 -z（面向書桌），椅背在 +z。 */
function ChairBase() {
  return (
    <group>
      <RoundedBox
        args={[0.52, 0.09, 0.5]}
        radius={0.04}
        position={[0, 0.46, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.mist} {...MATTE} />
      </RoundedBox>
      <RoundedBox
        args={[0.5, 0.46, 0.07]}
        radius={0.035}
        position={[0, 0.78, 0.23]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.mistDeep} {...MATTE} />
      </RoundedBox>
      {LEG_POSITIONS.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.21, z]} castShadow>
          <cylinderGeometry args={[0.03, 0.025, 0.42, 12]} />
          <meshStandardMaterial color={palette.woodDeep} {...MATTE} />
        </mesh>
      ))}
    </group>
  );
}

export const Chair = memo(ChairBase);
