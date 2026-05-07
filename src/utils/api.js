// src/utils/api.js
// ⚠️ เปลี่ยน GAS_URL เป็น URL ของ Apps Script Web App ที่ Deploy แล้ว

const GAS_URL = import.meta.env.VITE_GAS_URL;

async function call(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API Error');
  return json.data;
}

async function post(action, body) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  const res = await fetch(url.toString(), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API Error');
  return json.data;
}

export const api = {
  getTransactions: (userId, season) => call({ action: 'getTransactions', userId, season }),
  addTransaction: (data) => post('addTransaction', data),
  deleteTransaction: (id, userId) => call({ action: 'deleteTransaction', id, userId }),
  getSummary: (userId, year, month, season) => call({ action: 'getSummary', userId, year, month, season }),
};
