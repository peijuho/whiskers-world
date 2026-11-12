import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE } from "../palette";
import { useStylePalette } from "../useStylePalette";

const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} {...MATTE} />;

/** 圓茶几 0.9 × 0.9 */
function CoffeeTableBase() {
  const palette = useStylePalette();
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.24, 0.26, 0.04, 24]} />
        <M c={palette.woodDeep} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.4, 16]} />
        <M c={palette.woodDeep} />
      </mesh>
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.06, 36]} />
        <M c={palette.wood} />
      </mesh>
      <mesh position={[0.1, 0.5, 0.05]} castShadow>
        <cylinderGeometry args={[0.055, 0.05, 0.08, 16]} />
        <M c={palette.cream} />
      </mesh>
    </group>
  );
}

/** 床頭櫃 0.5 × 0.45：正面朝 +z */
function NightstandBase() {
  const palette = useStylePalette();
  return (
    <group>
      <RoundedBox args={[0.5, 0.5, 0.45]} radius={0.05} position={[0, 0.3, 0]} castShadow receiveShadow>
        <M c={palette.woodDeep} />
      </RoundedBox>
      {[0.38, 0.2].map((y) => (
        <group key={y}>
          <RoundedBox args={[0.42, 0.15, 0.02]} radius={0.01} position={[0, y, 0.225]}>
            <M c={palette.woodLight} />
          </RoundedBox>
          <mesh position={[0, y, 0.25]}>
            <sphereGeometry args={[0.02, 12, 10]} />
            <M c={palette.cream} />
          </mesh>
        </group>
      ))}
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.025, 0.15]} castShadow>
          <cylinderGeometry args={[0.025, 0.02, 0.05, 10]} />
          <M c={palette.woodDeep} />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.07, 18]} />
        <M c={palette.cream} />
      </mesh>
    </group>
  );
}

export const CoffeeTable = memo(CoffeeTableBase);
export const Nightstand = memo(NightstandBase);
