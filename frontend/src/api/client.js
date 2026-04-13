import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export async function aiFixJson(jsonString) {
  const res = await api.post("/json/ai-fix", { json_string: jsonString });
  return res.data;
}

export default api;
