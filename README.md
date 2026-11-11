# Whisker's World

溫暖療癒的 3D 繪本小房間（Next.js 16 + React Three Fiber）。

## 開始使用

```bash
npm install
npm run dev     # 開啟 http://localhost:3000
npm run build   # 正式版建置
npm run lint
```

## 玩法

- 拖曳旋轉、滾輪／雙指縮放。
- 「編輯房間」：拖曳家具（格線吸附、靠牆自動貼齊）、R 旋轉、Delete 移除、Ctrl/⌘+Z 復原。
- 「家具」：從 20 種家具中新增。
- 「看看小貓」：鏡頭拉近藍白雙色英國短毛貓。
- 布置會自動存在瀏覽器 localStorage。

## 專案結構

- `src/game/`：家具目錄、版面與碰撞邏輯、狀態與存檔。
- `src/components/room/`：3D 場景、家具模型、小貓。
- `src/components/ui/`：HUD、家具面板、工具列。
