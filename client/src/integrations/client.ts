// client.ts
import axios from 'axios';

// Base URL of your Flask backend
const API_BASE_URL = 'https://tigo.pythonanywhere.com/api';

// Create an Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// If your lockers authenticate with an API key, set it here:
// api.defaults.headers.common['Authorization'] = `ApiKey YOUR_KEY_HERE`;

// Fetch all lockers (admin/dashboard view)
export async function getAllLockers() {
  const { data } = await api.get('/lockers/');
  return data; 
}

// Fetch a single locker’s status
export async function getLockerStatus(lockerId: string) {
  const { data } = await api.get(`/lockers/${encodeURIComponent(lockerId)}/status`);
  return data;
}

// Update locker open/closed status
export async function updateLockerStatusApi(lockerId: string, status: 'open' | 'closed') {
  await api.post(`/lockers/${encodeURIComponent(lockerId)}/status`, {
    status,
    timestamp: new Date().toISOString(),
  });
}

// Generate a new OTP for a locker
export async function generateOtpApi(lockerId: string) {
  const { data } = await api.post(`/lockers/${encodeURIComponent(lockerId)}/otp`, {});
  return data; // { locker_id, otp, expires_at }
}

// Post an activity log for a locker
export async function postActivityApi(
  lockerId: string,
  type: 'opened' | 'closed' | 'otp_used' | 'otp_failed',
  detail: object = {}
) {
  await api.post(`/lockers/${encodeURIComponent(lockerId)}/activity`, {
    type,
    timestamp: new Date().toISOString(),
    detail,
  });
}
