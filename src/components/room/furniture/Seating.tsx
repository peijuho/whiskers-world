import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE, palette } from "../palette";

const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} {...MATTE} />;

/** 沙發 1.9 × 0.9：椅背在 -z */
function SofaBase() {
  return (
    <group>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.06, 0.25]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.12, 12]} />
          <M c={palette.woodDeep} />
        </mesh>
      ))}
      <RoundedBox args={[1.9, 0.3, 0.9]} radius={0.1} position={[0, 0.27, 0]} castShadow receiveShadow>
        <M c={palette.mist} />
      </RoundedBox>
      <RoundedBox args={[1.9, 0.62, 0.24]} radius={0.11} position={[0, 0.66, -0.33]} castShadow receiveShadow>
        <M c={palette.mist} />
      </RoundedBox>
      {[-0.84, 0.84].map((x) => (
        <RoundedBox key={x} args={[0.22, 0.5, 0.9]} radius={0.1} position={[x, 0.5, 0]} castShadow receiveShadow>
          <M c={palette.mistDeep} />
        </RoundedBox>
      ))}
      {[-0.4, 0.4].map((x) => (
        <RoundedBox key={x} args={[0.78, 0.16, 0.6]} radius={0.07} position={[x, 0.5, 0.1]} castShadow receiveShadow>
          <M c={palette.cream} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.34, 0.3, 0.12]} radius={0.06} position={[-0.55, 0.72, -0.14]} rotation={[0.15, 0.2, 0.1]} castShadow>
        <M c={palette.sage} />
      </RoundedBox>
    </group>
  );
}

/** 懶骨頭 0.9 × 0.9 */
function BeanbagBase() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} scale={[0.45, 0.3, 0.45]} castShadow receiveShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <M c={palette.sageDeep} />
      </mesh>
      <mesh position={[0.05, 0.5, 0.05]} scale={[0.3, 0.1, 0.3]}>
        <sphereGeometry args={[1, 20, 12]} />
        <M c={palette.leaf} />
      </mesh>
    </group>
  );
}

/** 圓凳 0.45 × 0.45 */
function StoolBase() {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />
        <M c={palette.sage} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.13, 0.19, Math.sin(a) * 0.13]} castShadow>
            <cylinderGeometry args={[0.025, 0.02, 0.38, 10]} />
            <M c={palette.woodDeep} />
          </mesh>
        );
      })}
    </group>
  );
}

export const Sofa = memo(SofaBase);
export const Beanbag = memo(BeanbagBase);
export const Stool = memo(StoolBase);
