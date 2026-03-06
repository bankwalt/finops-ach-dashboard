const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';

export async function apiRequest(method, path, body = null) {
  const start = performance.now();
  const url = `${BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    const duration = Math.round(performance.now() - start);
    return {
      data,
      status: res.status,
      duration,
      method,
      path,
      requestBody: body,
      ok: res.ok,
    };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    return {
      data: { error: err.message },
      status: 0,
      duration,
      method,
      path,
      requestBody: body,
      ok: false,
    };
  }
}
