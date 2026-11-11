import { RoomStage } from "@/components/room/RoomStage";
import { RoomHud } from "@/components/ui/RoomHud";

export default function Home() {
  return (
    <main
      className="relative h-dvh min-h-[480px] w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 35%, #fbf6ea 0%, #f1e8d3 55%, #dfe6e4 100%)",
      }}
    >
      <RoomStage />
      <RoomHud />
    </main>
  );
}
