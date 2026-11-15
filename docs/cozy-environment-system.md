# Cozy Room & Living Environment System（Phase 3）

## 架構

```
game/                         純邏輯 + 外部 store（無 React / three 相依者可獨立測試）
  persistence.ts              單一存檔 key，v2 格式 { version, items, settings }，相容 v1
  roomTheme.ts / furnitureStyles.ts / settingsStore.ts   房間外觀、家具風格、設定
  gameClock.ts / lighting.ts / environmentStore.ts       遊戲時間、光照關鍵影格、天氣狀態
  weather.ts / audioEngine.ts                            天氣混合、Web Audio 合成環境音
  catInteractions.ts          互動資料表（家具 → 活動/位置/動畫/允許狀態/時長/離開點）
  catNav.ts                   格線 A* 導航（實體家具為障礙）
  catPose.ts                  姿勢參數 + 平滑
  catBrain.ts                 行為狀態機（idle/wander/approach/mount/interact/dismount/called/reacting）
  catPreferences.ts           時段偏好（權重，不是行程表）
  catRuntime.ts               唯一一隻貓的執行期狀態 + HUD 狀態
components/room/cat/CatController.tsx   把 brain 套到 Kitten 關節；點貓 = 摸摸，點地板 = 呼喚
```

新增貓可互動的家具只需要：在 `furnitureCatalog` 加家具、在 `INTERACTIONS` 加一筆資料。

## 貓咪行為

- 自主：`decide()` 以 權重 × 時段偏好 × 變化性(不連續重複) ÷ 距離 抽選，候選包含家具互動、原地理毛/休息、散步。
- 時段偏好：早上看窗/高處、下午玩耍/磨爪、黃昏理毛、晚上與深夜睡覺。倍率皆 > 0，貓不會被強制睡覺。
- 玩家永遠可以打斷：點貓（摸摸，會醒來撒嬌）、點地板（呼喚，從家具上跳下來跑過去）。
- 家具被移動/移除時，貓會放棄互動並落到最近空地。
- 持續時間為真實秒數，不隨遊戲時間倍速改變。

## 測試結果（Playwright + 軟體渲染，開發模式 `window.__whiskers` 除錯入口）

- 自主行為：25 秒內自行出現 idle → approach → mount → interact。
- 互動逐一強制觸發並截圖確認：貓窩、小床、沙發、懶骨頭、椅子、書桌（看窗）、跳台、貓抓柱、紙箱、玩具、窗台。
- 時段偏好（每時段抽樣 60 次）：2 時 sleep 37、9 時 watch 最多、14 時 play 最多、21 時 sleep 26；其他活動仍會出現。
- 打斷：睡在貓窩時點地板 → 跳下並跑向點擊處後撒嬌；睡在床上時摸摸 → 醒來撒嬌後落地；貓窩被刪除 → 貓落地回到 idle。
- 存檔：v1 存檔可載入並升級為 v2；時間/暫停/速度/設定重新整理後保留。
- 音效：未互動前不建立 AudioContext；互動後建立；雨聲大於晴天；靜音歸零。
- `npm run lint`、`npm run build` 通過。

## 已知限制

- 家具風格是調色盤換膚，不是不同的模型；沒有外部 3D 資產。
- 貓是程序化模型，姿勢以關節旋轉近似（坐姿/睡姿/磨爪較簡化），不是骨架動畫。
- 跳台頂端與窗台用拋物線跳躍，沒有中間踏點；窗台只在左側有空位時可用（書桌擋住時走不到就不會被選）。
- 窗戶互動目前只有窗台與書桌兩處；陽光光斑只是貼圖，貓不會追著光斑曬太陽。
- 音效為 Web Audio 合成，非錄音素材；音樂頻道已分離但尚未放入音樂。
- 導航是 0.25m 格線，貓一次只考慮一個目標，沒有動態避開玩家拖曳中的家具。
- 在軟體渲染下 fps 很低，動畫速度在真機未做效能實測。

## 建議下一階段

貓咪需求系統（飢餓/精力/親密度）接上 `catBrain` 的權重；加入音樂頻道與夜間蟲鳴；用 GLB 骨架取代程序化貓，並以真實動畫片段取代姿勢參數。
