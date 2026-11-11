import { memo } from "react";
import { MATTE, palette } from "../palette";

/** 橢圓地毯：霧藍外圈 + 奶油白內圈。 */
function RugBase() {
  return (
    <group position={[0, 0.035, 0]}>
      <mesh scale={[1.8, 1, 1.25]} receiveShadow>
        <cylinderGeometry args={[1, 1, 0.03, 48]} />
        <meshStandardMaterial color={palette.mist} {...MATTE} />
      </mesh>
      <mesh position={[0, 0.002, 0]} scale={[1.45, 1, 0.95]} receiveShadow>
        <cylinderGeometry args={[1, 1, 0.032, 48]} />
        <meshStandardMaterial color={palette.cream} {...MATTE} />
      </mesh>
      <mesh position={[0, 0.004, 0]} scale={[0.8, 1, 0.5]} receiveShadow>
        <cylinderGeometry args={[1, 1, 0.034, 48]} />
        <meshStandardMaterial color={palette.creamDeep} {...MATTE} />
      </mesh>
    </group>
  );
}

export const Rug = memo(RugBase);
