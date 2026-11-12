import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE } from "../palette";
import { useStylePalette } from "../useStylePalette";

const SISAL = "#d9c19a";
const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} {...MATTE} />;

/** 貓窩 0.7 × 0.7 */
function CatBedBase() {
  const palette = useStylePalette();
  return (
    <group>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.24, 0.1, 16, 32]} />
        <M c={palette.mist} />
      </mesh>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.27, 0.27, 0.08, 28]} />
        <M c={palette.cream} />
      </mesh>
    </group>
  );
}

/** 貓跳台 0.7 × 0.7，高約 1.7 */
function CatTreeBase() {
  const palette = useStylePalette();
  return (
    <group>
      <RoundedBox args={[0.7, 0.08, 0.7]} radius={0.035} position={[0, 0.04, 0]} castShadow receiveShadow>
        <M c={palette.wood} />
      </RoundedBox>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 16]} />
        <M c={SISAL} />
      </mesh>
      {/* 貓屋 */}
      <RoundedBox args={[0.4, 0.34, 0.4]} radius={0.06} position={[0, 0.25, 0.1]} castShadow receiveShadow>
        <M c={palette.cream} />
      </RoundedBox>
      <mesh position={[0, 0.25, 0.305]}>
        <circleGeometry args={[0.1, 20]} />
        <meshStandardMaterial color="#6b5443" roughness={1} />
      </mesh>
      {/* 平台 */}
      <RoundedBox args={[0.58, 0.06, 0.5]} radius={0.03} position={[0.06, 0.85, 0]} castShadow receiveShadow>
        <M c={palette.sage} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.06, 0.5]} radius={0.03} position={[-0.06, 1.25, 0]} castShadow receiveShadow>
        <M c={palette.mist} />
      </RoundedBox>
      {/* 頂部貓窩 */}
      <mesh position={[0, 1.62, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.24, 0.12, 24]} />
        <M c={palette.cream} />
      </mesh>
      <mesh position={[0, 1.67, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />
        <M c={palette.sage} />
      </mesh>
    </group>
  );
}

/** 階梯跳台 1.2 × 0.5：三階木箱 */
function CatStepsBase() {
  const palette = useStylePalette();
  const steps = [
    { x: -0.4, h: 0.25, c: palette.woodLight },
    { x: 0, h: 0.5, c: palette.cream },
    { x: 0.4, h: 0.75, c: palette.sage },
  ];
  return (
    <group>
      {steps.map((s) => (
        <group key={s.x}>
          <RoundedBox args={[0.38, s.h, 0.44]} radius={0.05} position={[s.x, s.h / 2, 0]} castShadow receiveShadow>
            <M c={s.c} />
          </RoundedBox>
          <RoundedBox args={[0.34, 0.03, 0.4]} radius={0.015} position={[s.x, s.h + 0.01, 0]} receiveShadow>
            <M c={palette.mist} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

/** 貓抓柱 0.4 × 0.4 */
function CatScratcherBase() {
  const palette = useStylePalette();
  return (
    <group>
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.2, 0.05, 24]} />
        <M c={palette.wood} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 16]} />
        <M c={SISAL} />
      </mesh>
      <mesh position={[0, 0.68, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 12]} />
        <M c={palette.mist} />
      </mesh>
    </group>
  );
}

/** 貓碗 0.4 × 0.3 */
function CatBowlBase() {
  const palette = useStylePalette();
  return (
    <group>
      <RoundedBox args={[0.4, 0.012, 0.3]} radius={0.005} position={[0, 0.006, 0]} receiveShadow>
        <M c={palette.cream} />
      </RoundedBox>
      <mesh position={[-0.07, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.06, 0.07, 20]} />
        <M c={palette.mistDeep} />
      </mesh>
      <mesh position={[-0.07, 0.086, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.01, 20]} />
        <M c="#b78d62" />
      </mesh>
      <mesh position={[0.1, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.055, 0.055, 20]} />
        <M c={palette.sage} />
      </mesh>
    </group>
  );
}

export const CatBed = memo(CatBedBase);
export const CatTree = memo(CatTreeBase);
export const CatSteps = memo(CatStepsBase);
export const CatScratcher = memo(CatScratcherBase);
export const CatBowl = memo(CatBowlBase);
