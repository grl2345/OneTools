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

export default api;

