import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE } from "../palette";
import { useStylePalette } from "../useStylePalette";

const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} {...MATTE} />;

const SHELVES = [0.06, 0.5, 0.94, 1.38, 1.76] as const;

/** 書櫃 1.0 × 0.35，高 1.8：正面朝 +z */
function BookshelfBase() {
  const palette = useStylePalette();
  const BOOK_COLORS = [palette.mist, palette.sage, palette.cream, palette.mistDeep, palette.woodLight];
  return (
    <group>
      {[-0.475, 0.475].map((x) => (
        <RoundedBox key={x} args={[0.05, 1.8, 0.35]} radius={0.015} position={[x, 0.9, 0]} castShadow receiveShadow>
          <M c={palette.wood} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.9, -0.16]} receiveShadow>
        <boxGeometry args={[0.95, 1.8, 0.03]} />
        <M c={palette.woodDeep} />
      </mesh>
      {SHELVES.map((y) => (
        <RoundedBox key={y} args={[0.9, 0.04, 0.33]} radius={0.01} position={[0, y, 0.005]} castShadow receiveShadow>
          <M c={palette.wood} />
        </RoundedBox>
      ))}
      {[0.5, 0.94, 1.38].map((y, row) =>
        Array.from({ length: 5 - row }, (_, i) => {
          const h = 0.26 + ((i + row) % 3) * 0.05;
          return (
            <RoundedBox
              key={`${y}-${i}`}
              args={[0.07, h, 0.22]}
              radius={0.01}
              position={[-0.36 + i * 0.1 + row * 0.05, y + 0.02 + h / 2, 0]}
              castShadow
            >
              <M c={BOOK_COLORS[(i + row * 2) % BOOK_COLORS.length]} />
            </RoundedBox>
          );
        }),
      )}
    </group>
  );
}

/** 衣櫃 1.2 × 0.6，高 1.9：正面朝 +z */
function WardrobeBase() {
  const palette = useStylePalette();
  return (
    <group>
      <RoundedBox args={[1.2, 1.9, 0.6]} radius={0.06} position={[0, 0.95, 0]} castShadow receiveShadow>
        <M c={palette.creamDeep} />
      </RoundedBox>
      {[-0.29, 0.29].map((x) => (
        <group key={x}>
          <RoundedBox args={[0.54, 1.7, 0.03]} radius={0.02} position={[x, 0.98, 0.305]} castShadow>
            <M c={palette.sage} />
          </RoundedBox>
          <mesh position={[x * 0.35, 1.0, 0.345]}>
            <sphereGeometry args={[0.025, 12, 10]} />
            <M c={palette.cream} />
          </mesh>
        </group>
      ))}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.03, 0.2]} castShadow>
          <cylinderGeometry args={[0.04, 0.03, 0.06, 10]} />
          <M c={palette.woodDeep} />
        </mesh>
      ))}
    </group>
  );
}

export const Bookshelf = memo(BookshelfBase);
export const Wardrobe = memo(WardrobeBase);
