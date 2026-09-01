const API_URL = import.meta.env https://backend-phi-two-39vercel-n3de9jrvq.vercel.app/api/health || "http://127.0.0.1:8000";

export async function checkHealth() {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend is not responding");
  }

  return response.json();
}

export async function askAssistant(question) {
  const response = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: question,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.answer || "AI request failed");
  }

  return data;
}

export async function uploadResearchPaper(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Upload failed");
  }

  return data;
}
export async function searchResearch(query) {
  const response = await fetch(`${API_URL}/api/research?query=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Search failed");
  return data;
}
