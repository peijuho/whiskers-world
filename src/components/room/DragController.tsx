import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import { roomActions, useRoomStore } from "@/game/roomStore";

/** 拖曳期間：把滑鼠位置投影到地板平面，更新家具草稿位置。 */
export function DragController() {
  const get = useThree((s) => s.get);
  const dragging = useRoomStore((s) => s.draft !== null);

  useEffect(() => {
    if (!dragging) return;
    const el = get().gl.domElement;
    const ray = new Raycaster();
    const ground = new Plane(new Vector3(0, 1, 0), 0);
    const point = new Vector3();
    const ndc = new Vector2();
    el.style.cursor = "grabbing";

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(ndc, get().camera);
      if (ray.ray.intersectPlane(ground, point)) {
        roomActions.updateDrag(point.x, point.z);
      }
    };
    const onEnd = () => roomActions.endDrag();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      el.style.cursor = "";
    };
  }, [dragging, get]);

  return null;
}
