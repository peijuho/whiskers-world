import { memo } from "react";
import { MATTE, palette } from "../palette";

interface Leaf {
  readonly angle: number;
  readonly tilt: number;
  readonly height: number;
  readonly size: number;
}

/** 固定資料（非隨機），避免 hydration 與 SSR 差異。 */
const LEAVES: readonly Leaf[] = Array.from({ length: 9 }, (_, i) => ({
  angle: (i / 9) * Math.PI * 2 + (i % 2) * 0.3,
  tilt: 0.35 + (i % 3) * 0.18,
  height: 0.5 + (i % 4) * 0.1,
  size: 0.3 + (i % 3) * 0.05,
}));

/** 一盆圓潤的盆栽，可自由擺放。 */
function PlantBase() {
  return (
    <group>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.23, 0.17, 0.38, 28]} />
        <meshStandardMaterial color={palette.mist} {...MATTE} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 28]} />
        <meshStandardMaterial color={palette.soil} {...MATTE} />
      </mesh>
      {LEAVES.map((leaf, i) => (
        <group key={i} rotation={[0, leaf.angle, 0]} position={[0, 0.4, 0]}>
          <mesh
            position={[0.14 * leaf.tilt * 2, leaf.height / 2, 0]}
            rotation={[0, 0, -leaf.tilt]}
            scale={[0.09, leaf.size + 0.12, 0.05]}
            castShadow
          >
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial
              color={i % 2 ? palette.leaf : palette.sageDeep}
              {...MATTE}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export const Plant = memo(PlantBase);
