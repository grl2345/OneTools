import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export async function aiParseTime(query, tz, lang) {
  const res = await api.post("/ai/parse-time", { query, tz, lang });
  return res.data;
}

export async function aiJsonQuery(jsonStr, query, lang) {
  const res = await api.post("/ai/json/query", {
    json_str: jsonStr,
    query,
    lang,
  });
  return res.data;
}

export async function aiJsonSchema(jsonStr, lang) {
  const res = await api.post("/ai/json/schema", {
    json_str: jsonStr,
    lang,
  });
  return res.data;
}

export async function aiMarkdownRewrite(text, action, lang) {
  const res = await api.post(
    "/ai/markdown/rewrite",
    { text, action, lang },
    { timeout: 60000 }
  );
  return res.data;
}

export default api;

