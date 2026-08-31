const BASE = import.meta.env.VITE_API_BASE || "/api";

function authHeaders() {
  const token = localStorage.getItem("spynx_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(resp) {
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function resolveUpload(pathOrUrl) {
  if (!pathOrUrl) return pathOrUrl;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  const apiBase = import.meta.env.VITE_API_BASE || "";
  const origin = apiBase ? apiBase.replace(/\/api\/?$/, "") : "";
  return origin + pathOrUrl;
}

export const api = {
  get: (path) => fetch(BASE + path, { headers: { ...authHeaders() } }).then(handle),

  post: (path, body) =>
    fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  patch: (path, body) =>
    fetch(BASE + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  del: (path) => fetch(BASE + path, { method: "DELETE", headers: { ...authHeaders() } }).then(handle),

  postForm: (path, formData) =>
    fetch(BASE + path, {
      method: "POST",
      headers: { ...authHeaders() },
      body: formData,
    }).then(handle),

  delForm: (path) => fetch(BASE + path, { method: "DELETE", headers: { ...authHeaders() } }).then(handle),
};
