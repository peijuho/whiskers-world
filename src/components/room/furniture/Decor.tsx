import { memo } from "react";
import { DoubleSide } from "three";
import { MATTE } from "../palette";
import { useStylePalette } from "../useStylePalette";

const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} {...MATTE} />;

/** 落地燈 0.4 × 0.4 */
function FloorLampBase() {
  const palette = useStylePalette();
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.04, 24]} />
        <M c={palette.woodDeep} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 1.4, 10]} />
        <M c={palette.woodDeep} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.19, 0.3, 24, 1, true]} />
        <meshStandardMaterial
          color={palette.cream}
          emissive="#ffd9a0"
          emissiveIntensity={0.6}
          roughness={1}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

const BIG_LEAVES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2 + (i % 2) * 0.25,
  tilt: 0.3 + (i % 4) * 0.14,
  len: 0.42 + (i % 3) * 0.09,
}));

/** 大型盆栽 0.7 × 0.7 */
function BigPlantBase() {
  const palette = useStylePalette();
  return (
    <group>
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.52, 28]} />
        <M c={palette.cream} />
      </mesh>
      <mesh position={[0, 0.53, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.02, 28]} />
        <M c={palette.soil} />
      </mesh>
      {BIG_LEAVES.map((l, i) => (
        <group key={i} rotation={[0, l.angle, 0]} position={[0, 0.55, 0]}>
          <mesh
            position={[0.2 * l.tilt * 2, l.len * 0.9, 0]}
            rotation={[0, 0, -l.tilt]}
            scale={[0.12, l.len + 0.2, 0.06]}
            castShadow
          >
            <sphereGeometry args={[1, 16, 12]} />
            <M c={i % 2 ? palette.leaf : palette.sageDeep} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** 圓地毯 1.6 × 1.6 */
function RoundRugBase() {
  const palette = useStylePalette();
  return (
    <group position={[0, 0.035, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.03, 40]} />
        <M c={palette.sage} />
      </mesh>
      <mesh position={[0, 0.002, 0]} receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.032, 40]} />
        <M c={palette.cream} />
      </mesh>
      <mesh position={[0, 0.004, 0]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.034, 32]} />
        <M c={palette.mist} />
      </mesh>
    </group>
  );
}

export const FloorLamp = memo(FloorLampBase);
export const BigPlant = memo(BigPlantBase);
export const RoundRug = memo(RoundRugBase);
