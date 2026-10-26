// Change this if your backend runs somewhere other than localhost:8000
// (e.g. after deploying, point this at your Render/Railway URL)
const API_BASE = "https://agroscan-backend-odix.onrender.com";

export async function predictDisease(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Prediction failed. Please try again.");
  }
  return response.json();
}

export async function fetchHistory(limit = 20) {
  const response = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Could not load scan history.");
  }
  return response.json();
}
