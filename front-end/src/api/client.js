import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL: `${BASE}/api/v1/db`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const rootApi = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchAlertThresholds() {
  const { data } = await rootApi.get('/alert-thresholds');
  return data;
}

export async function updateAlertThreshold(metric, payload) {
  const { data } = await rootApi.put(`/alert-thresholds/${metric}`, payload);
  return data;
}

export async function fetchOverview(params = {}) {
  const { data } = await api.get('/overview', { params });
  return data;
}

export async function fetchInstancesForIp(ip) {
  const { data } = await api.get(`/monitor/${encodeURIComponent(ip)}`);
  return data;
}

export async function fetchInstanceHistory(ip, instanceName, params = {}) {
  const { data } = await api.get(
    `/monitor/${encodeURIComponent(ip)}/${encodeURIComponent(instanceName)}`,
    { params }
  );
  return data;
}

export async function fetchAlerts(params = {}) {
  const { data } = await api.get('/alerts', { params });
  return data;
}

export async function resolveAlert(alertId) {
  const { data } = await api.patch(`/alerts/${alertId}/resolve`);
  return data;
}

export async function exportCsv(ip, instanceName, params = {}) {
  const resp = await api.get(
    `/monitor/${encodeURIComponent(ip)}/${encodeURIComponent(instanceName)}/export`,
    { params, responseType: 'blob' }
  );
  const url = URL.createObjectURL(resp.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `db-${ip}-${instanceName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const groupsApi = rootApi;

export default api;
