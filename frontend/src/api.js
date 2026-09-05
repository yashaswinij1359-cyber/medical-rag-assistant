const API_URL = import.meta.env.VITE_BACKEND_URL;

export const checkBackend = async () => {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend is not responding");
  }

  return response.json();
};

export const askQuestion = async (question) => {
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get response from backend");
  }

  return response.json();
};

export default API_URL;