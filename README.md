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

## 注意事項

- 測驗成績存在瀏覽器的 `localStorage`，只會保留在你當下使用的那個瀏覽器／裝置上，換瀏覽器或清除瀏覽器資料會看不到舊紀錄。
- 聽力練習無法在這個網頁裡進行（需要真人語音），請搭配 `study-plan.md` 裡建議的資源（VoiceTube、官方音檔）。
