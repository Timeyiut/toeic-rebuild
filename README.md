# 多益重建計畫 TOEIC Rebuild

個人多益重建用的年度讀書計畫＋線上練習測驗工具。上次成績 305 分，這個 repo 用來從基礎打底、每週追蹤弱點，一路練到全真模考。

## 內容

- **[study-plan.md](./study-plan.md)** — 12 個月四階段讀書計畫、單字背誦方法、每週節奏表、推薦教材。
- **[index.html](./index.html)** — 線上練習測驗（單字／文法／閱讀），交卷後自動分析弱點類別並給建議，成績記錄在瀏覽器本機（localStorage），可以追蹤長期進步曲線。

## 線上開啟練習測驗

開啟 GitHub Pages 後（見下方設定），直接用這個網址在手機或電腦打開就能作答：

```
https://<你的帳號>.github.io/<repo名稱>/
```

## 開啟 GitHub Pages 的方法

1. 到這個 repo 的 **Settings → Pages**。
2. Source 選擇 **Deploy from a branch**，Branch 選 `main`，資料夾選 `/(root)`。
3. 存檔後等 1–2 分鐘，頁面上方會出現網址，就是你的練習測驗連結。

## 跨裝置同步設定（選用，但建議設定）

預設狀態下，成績只存在瀏覽器的 `localStorage`，換裝置會看不到舊紀錄。如果想要手機、電腦開同一個網址就看到同一份進度，需要接一個免費的 Firebase 專案（大約 5 分鐘）：

1. 到 [Firebase Console](https://console.firebase.google.com) 用 Google 帳號建立一個新專案（免費 Spark 方案即可，這種個人小工具的用量遠低於免費額度）。
2. 左側選單 **Build → Firestore Database → 建立資料庫**，地區選離你近的（例如 `asia-east1`），先選「測試模式」建立即可。
3. 左上角齒輪圖示 → **專案設定 → 一般**，往下捲到「你的應用程式」，點 `</>`（網頁）圖示，取個名稱註冊，會看到一段 `firebaseConfig = {...}` 的物件，把裡面 6 個值複製起來。
4. 打開 `index.html`，找到 `const firebaseConfig = {` 那一段（在 `<script type="module">` 開頭附近），把裡面的 `YOUR_API_KEY` 等預設值換成剛剛複製的內容。
5. 回到 Firestore Database 的 **規則（Rules）** 分頁，貼上以下規則並發布，把讀寫權限限制在這個工具專用的集合，其他路徑一律拒絕：
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /toeic_progress/{docId} {
         allow read, write: if true;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
6. 存檔後 `git add . && git commit -m "add cloud sync" && git push`，等 GitHub Pages 更新。打開網頁後最上方會有「跨裝置同步」欄位，輸入一組你自訂的**同步代碼**（例如英文名+生日，不需要是真的密碼），在另一台裝置輸入完全相同的代碼，兩邊就會顯示同一份學習紀錄。

> 這個設定沒有帳號登入機制，安全性只靠「同步代碼」跟公開網址增加一點門檻，並不是真正的機密保護。因為存的只是練習測驗的成績和錯題紀錄，風險很低；如果不放心，也可以完全不設定，工具會自動退回「只存本機瀏覽器」模式，不影響其他功能。

## 注意事項

- 沒有設定 Firebase 之前，測驗成績存在瀏覽器的 `localStorage`，只會保留在你當下使用的那個瀏覽器／裝置上，換瀏覽器或清除瀏覽器資料會看不到舊紀錄。
- 聽力練習無法在這個網頁裡進行（需要真人語音），請搭配 `study-plan.md` 裡建議的資源（VoiceTube、官方音檔）。
