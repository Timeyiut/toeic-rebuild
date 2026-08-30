/**
 * 一個很薄的 CORS 代理，架在瀏覽器版多益練習測驗和 Notion API 中間。
 *
 * 為什麼需要這個：Notion 官方 API 不會回傳 CORS 授權標頭，瀏覽器沒辦法直接
 * fetch() 呼叫 api.notion.com。這支 Worker 幫忙加上 CORS 標頭、夾帶 Notion
 * 的 secret token（存在 Worker 的環境變數，不會被瀏覽器看到），只轉發三種
 * 動作：查詢資料庫、新增一筆資料、更新一筆資料，而且只接受設定好的兩個
 * 資料庫 ID，其餘一律拒絕。
 *
 * 部署方式（用 Cloudflare 網頁版 Dashboard，不需要安裝任何東西）：
 *   1. dash.cloudflare.com → 左側 Workers & Pages → Create → Create Worker
 *   2. 取個名字（例如 toeic-notion-proxy）→ Deploy 先建立一個預設版本
 *   3. 進去這個 Worker → Edit code，把這個檔案的內容整個貼進去覆蓋掉範例程式碼 → Save and deploy
 *   4. 回到 Worker 的 Settings → Variables and Secrets → Add，新增以下 3 個：
 *        NOTION_TOKEN         (類型選 Secret)  Notion integration 的 token
 *        NOTION_HISTORY_DB_ID (類型選 Text)    「TOEIC 學習紀錄」資料庫 ID
 *        NOTION_MISTAKES_DB_ID(類型選 Text)    「TOEIC 錯題本」資料庫 ID
 *      存檔後會自動重新部署。
 *   5. Worker 的網址（例如 https://toeic-notion-proxy.你的帳號.workers.dev）
 *      就是要填進 index.html 裡 NOTION_CONFIG.proxyUrl 的值。
 *
 * 完整步驟見 repo 的 README.md「Notion 雲端同步設定」。
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function corsHeaders(env){
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(obj, status, headers){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export default {
  async fetch(request, env){
    const headers = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const allowedDbIds = [env.NOTION_HISTORY_DB_ID, env.NOTION_MISTAKES_DB_ID].filter(Boolean);
    const notionHeaders = {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    };

    const url = new URL(request.url);

    try {
      // 查詢某個資料庫（篩選 + 排序都可選）
      if (request.method === 'POST' && url.pathname === '/query') {
        const body = await request.json();
        if (!allowedDbIds.includes(body.dbId)) {
          return jsonResponse({ error: 'dbId not allowed' }, 403, headers);
        }
        const payload = {};
        if (body.filter) payload.filter = body.filter;
        if (body.sorts) payload.sorts = body.sorts;
        const resp = await fetch(`${NOTION_API}/databases/${body.dbId}/query`, {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify(payload),
        });
        const data = await resp.json();
        return jsonResponse(data, resp.status, headers);
      }

      // 在某個資料庫新增一筆資料
      if (request.method === 'POST' && url.pathname === '/pages') {
        const body = await request.json();
        if (!allowedDbIds.includes(body.dbId)) {
          return jsonResponse({ error: 'dbId not allowed' }, 403, headers);
        }
        const resp = await fetch(`${NOTION_API}/pages`, {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify({ parent: { database_id: body.dbId }, properties: body.properties }),
        });
        const data = await resp.json();
        return jsonResponse(data, resp.status, headers);
      }

      // 更新一筆既有的資料（page id 放在路徑最後）
      if (request.method === 'PATCH' && url.pathname.startsWith('/pages/')) {
        const pageId = url.pathname.slice('/pages/'.length);
        const body = await request.json();
        const resp = await fetch(`${NOTION_API}/pages/${pageId}`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ properties: body.properties }),
        });
        const data = await resp.json();
        return jsonResponse(data, resp.status, headers);
      }

      return jsonResponse({ error: 'not found' }, 404, headers);
    } catch (err) {
      return jsonResponse({ error: String(err) }, 500, headers);
    }
  },
};
