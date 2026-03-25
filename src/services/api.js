// ── src/services/api.js ──────────────────────────────────────────────

const BASE = "http://localhost:5000/api";

// 🔐 Common auth headers
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: localStorage.getItem("token"),
});

// ── Sensor REST calls ────────────────────────────────────────────────

// Latest single reading for one device
export async function getLatestReading(deviceId) {
  const res = await fetch(`${BASE}/sensors/latest/${deviceId}`, {
    headers: {
      Authorization: localStorage.getItem("token"), // ✅ REQUIRED
    },
  });
  if (!res.ok) throw new Error("Failed to fetch latest reading");
  return res.json();
}

// Last 30 readings for chart
// Last 30 readings for chart
export async function getSensorHistory(deviceId, limit = 30) {
  const res = await fetch(
    `${BASE}/sensors/history/${deviceId}?limit=${limit}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (res.status === 401) {
    throw new Error("Unauthorized - please login again");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch history");
  }

  return res.json();
}


// Admin: latest from ALL devices
export async function getAllLatest() {
  const res = await fetch(`${BASE}/sensors/all-latest`, {
    headers: getAuthHeaders(),
  });

  if (res.status === 401) {
    throw new Error("Unauthorized - please login again");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch all devices");
  }

  return res.json();
}


// All device IDs
export async function getDevices() {
  const res = await fetch(`${BASE}/devices`, {
    headers: getAuthHeaders(),
  });

  if (res.status === 401) {
    throw new Error("Unauthorized - please login again");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch devices");
  }

  return res.json();
}
// ── SSE — Real-time live updates ─────────────────────────────────────
// NOTE: SSE cannot send headers → keep this route public OR handle differently
export function subscribeToLive(onNewReading) {
  const evtSource = new EventSource(`${BASE}/live`);

  evtSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === "new_reading") {
        onNewReading(payload.data);
      }
    } catch (_) {}
  };

  evtSource.onerror = () => {
    console.warn("SSE connection lost — will auto-reconnect");
  };

  return () => evtSource.close();
}

// ── Auth ─────────────────────────────────────────────────────────────

// 🔐 LOGIN (returns token + user)
export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");

  return data; // ✅ IMPORTANT: return full object (token + user)
}

// Signup (no token needed)
export async function apiSignup(name, email, password, role) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");

  return data.user;
}