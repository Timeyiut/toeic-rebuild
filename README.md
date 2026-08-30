# 多益重建計畫 TOEIC Rebuild

個人多益重建用的年度讀書計畫＋線上練習測驗工具。上次成績 305 分，這個 repo 用來從基礎打底、每週追蹤弱點，一路練到全真模考。

## 內容

- **[study-plan.md](./study-plan.md)** — 12 個月四階段讀書計畫、單字背誦方法、每週節奏表、推薦教材。
- **[index.html](./index.html)** — 線上練習測驗（生活情境單字／TOEIC情境單字／文法／閱讀），交卷後自動分析弱點類別並給建議。沒設定雲端同步時，成績記錄在瀏覽器本機（localStorage）。
- **[cloudflare-worker/notion-proxy.js](./cloudflare-worker/notion-proxy.js)** — 選用，一個很薄的代理，讓瀏覽器可以直接跟 Notion 資料庫同步（見下方「Notion 雲端同步設定」）。

## 線上開啟練習測驗

開啟 GitHub Pages 後（見下方設定），直接用這個網址在手機或電腦打開就能作答：

```
https://<你的帳號>.github.io/<repo名稱>/
```

## 開啟 GitHub Pages 的方法

1. 到這個 repo 的 **Settings → Pages**。
2. Source 選擇 **Deploy from a branch**，Branch 選 `main`，資料夾選 `/(root)`。
3. 存檔後等 1–2 分鐘，頁面上方會出現網址，就是你的練習測驗連結。

## Notion 雲端同步設定（選用，但建議設定）

預設狀態下，成績只存在瀏覽器的 `localStorage`，換裝置會看不到舊紀錄。這個工具直接把 **Notion** 當作雲端記憶——測驗紀錄和錯題會即時寫進你的 Notion 資料庫，換裝置打開網頁也能看到同一份，還可以直接在 Notion 裡瀏覽、篩選、加筆記。

**重要的技術限制**：Notion 官方 API 不允許瀏覽器直接呼叫（沒有回傳 CORS 授權標頭），沒辦法讓 `index.html` 直接 fetch() 打進 Notion。解法是架一個很薄的代理（`cloudflare-worker/notion-proxy.js`），跑在 Cloudflare Workers 的免費方案上——瀏覽器呼叫這個代理，代理再幫忙轉發給 Notion，並且把 Notion 的 secret token 藏在伺服器端，不會外流到瀏覽器。整個設定大約 15–20 分鐘，不需要 Firebase、不需要信用卡。

### 1. 在 Notion 建立兩個資料庫

新增兩個「資料庫（Database）」頁面，欄位名稱、型別要跟下面完全一致，之後同步才找得到對應欄位：

**TOEIC 學習紀錄**
| 欄位名稱 | 型別 |
|---|---|
| Name | Title（預設就有） |
| 日期 | Date |
| 模式 | Select |
| 總正確率 | Number |
| 單字 / 文法 / 閱讀 / 生活單字 | Number（4 個都要建） |

**TOEIC 錯題本**
| 欄位名稱 | 型別 |
|---|---|
| Name | Title（預設就有） |
| 分類 | Select |
| 正確答案 | Text |
| 解析 | Text |
| 錯誤次數 | Number |
| 最近錯誤日期 | Date |
| 狀態 | Select（先手動新增兩個選項：**待複習**、**已熟悉**） |
| 題目ID | Text |

### 2. 建立 Notion 整合並取得 token

1. 到 [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**，取個名字（例如「TOEIC Sync」），關聯到你的工作區，建立後複製 **Internal Integration Secret**（等一下要貼進 Cloudflare）。
2. 回到剛剛建立的兩個資料庫頁面，右上角 `...` → **Connections**（連結）→ 把這個整合加進去，**兩個資料庫都要加**，不然會沒有權限讀寫。
3. 資料庫 ID 藏在網址列：打開資料庫，網址長得像 `https://www.notion.so/xxxxxxxx?v=...`，網址中那串 32 碼英數字就是資料庫 ID。兩個資料庫都記下來。

### 3. 部署 Cloudflare Worker 代理

1. 到 [dash.cloudflare.com](https://dash.cloudflare.com) 註冊／登入（免費），左側選單 **Workers & Pages → Create → Create Worker**。
2. 取個名字（例如 `toeic-notion-proxy`），先按 **Deploy** 建立一個預設版本。
3. 進到這個 Worker → **Edit code**，把 `cloudflare-worker/notion-proxy.js` 的內容整個複製貼上、覆蓋掉範例程式碼 → **Save and deploy**。
4. 回到這個 Worker 的 **Settings → Variables and Secrets → Add**，依序新增 3 個：

   | 名稱 | 型別 | 值 |
   |---|---|---|
   | `NOTION_TOKEN` | Secret | 步驟 2 拿到的 Internal Integration Secret |
   | `NOTION_HISTORY_DB_ID` | Text | 學習紀錄資料庫 ID |
   | `NOTION_MISTAKES_DB_ID` | Text | 錯題本資料庫 ID |

   存檔後會自動重新部署。
5. 記下這個 Worker 的網址，長得像 `https://toeic-notion-proxy.你的帳號.workers.dev`。

### 4. 把設定值填進 index.html

打開 `index.html`，找到 `const NOTION_CONFIG = {` 那一段（在 `<script type="module">` 開頭附近），把三個值換成你自己的：

```js
const NOTION_CONFIG = {
  proxyUrl: "https://toeic-notion-proxy.你的帳號.workers.dev",
  historyDbId: "你的學習紀錄資料庫ID",
  mistakesDbId: "你的錯題本資料庫ID"
};
```

存檔後 `git add . && git commit -m "add notion sync" && git push`，等 GitHub Pages 更新。打開網頁後，最上方「Notion 雲端記憶」欄位會顯示「已連接 Notion 雲端同步」。

### 之後怎麼用

- 每次測驗結束，畫面會先立即顯示結果（不等網路），然後在背景把這次的紀錄和錯題同步進 Notion。
- 「TOEIC 錯題本」的**狀態**欄位會自動更新：答對一次就標成「已熟悉」，之後在正式測驗又答錯的話會自動改回「待複習」。你也可以在 Notion 裡手動加標籤、寫筆記，或拉出「狀態＝待複習」的篩選視圖當作每天的複習清單。
- 「TOEIC 學習紀錄」是逐次測驗的正確率歷史，可以在 Notion 拉成折線圖或時間軸檢視長期趨勢。
- 網頁上「複習待複習的錯題」模式會直接讀 Notion 裡狀態＝待複習的題目來出題，跟 Notion 資料是同一份。

## 注意事項

- 沒有設定 Notion 同步之前，測驗成績存在瀏覽器的 `localStorage`，只保留在當下使用的那個瀏覽器／裝置上，換瀏覽器或清除瀏覽器資料會看不到舊紀錄；設定好之後，本機快取仍會保留一份，作為 Notion 讀取失敗時的備援。
- Cloudflare Worker 免費方案的用量額度對這種個人小工具非常充足，正式設定時可以到 Cloudflare 的用量頁面確認目前額度是否有變動。
- 這個代理沒有身分驗證機制，只靠限制「只接受設定好的兩個資料庫 ID」增加一點防護；因為存的只是練習測驗的成績和錯題紀錄，風險很低。如果不想處理這些設定，也可以完全不接 Notion，工具會自動退回「只存本機瀏覽器」模式，其他功能都不受影響。
- 聽力練習無法在這個網頁裡進行（需要真人語音），請搭配 `study-plan.md` 裡建議的資源（VoiceTube、官方音檔）。
