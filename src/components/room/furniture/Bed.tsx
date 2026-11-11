import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE, palette } from "../palette";

/** 圓潤小床：床頭朝 -z（靠後牆），貼著左牆。 */
function BedBase() {
  return (
    <group>
      {/* 床架 */}
      <RoundedBox
        args={[1.5, 0.32, 2.1]}
        radius={0.1}
        position={[0, 0.26, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.wood} {...MATTE} />
      </RoundedBox>
      {/* 床頭板 */}
      <RoundedBox
        args={[1.5, 0.95, 0.14]}
        radius={0.07}
        position={[0, 0.55, -1.0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.woodDeep} {...MATTE} />
      </RoundedBox>
      {/* 床墊 */}
      <RoundedBox
        args={[1.4, 0.26, 1.9]}
        radius={0.12}
        position={[0, 0.55, 0.02]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.cream} {...MATTE} />
      </RoundedBox>
      {/* 鼠尾草綠被子 */}
      <RoundedBox
        args={[1.46, 0.18, 1.2]}
        radius={0.09}
        position={[0, 0.66, 0.38]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={palette.sage} {...MATTE} />
      </RoundedBox>
      {/* 枕頭 */}
      <RoundedBox
        args={[0.55, 0.16, 0.38]}
        radius={0.08}
        position={[-0.34, 0.76, -0.66]}
        rotation={[0, 0.08, 0]}
        castShadow
      >
        <meshStandardMaterial color={palette.cream} {...MATTE} />
      </RoundedBox>
      <RoundedBox
        args={[0.5, 0.15, 0.36]}
        radius={0.075}
        position={[0.32, 0.76, -0.66]}
        rotation={[0, -0.1, 0]}
        castShadow
      >
        <meshStandardMaterial color={palette.mist} {...MATTE} />
      </RoundedBox>
    </group>
  );
}

export const Bed = memo(BedBase);
