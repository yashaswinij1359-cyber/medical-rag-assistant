// ============================================================
// MedResearch - API.JS
// React/Vite Frontend <-> FastAPI Backend
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://medical-rag-assistant-zduo.onrender.com";


// ============================================================
// COMMON RESPONSE HANDLER
// ============================================================

async function getResponseData(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      `Server error: ${response.status}`;

    throw new Error(message);
  }

  return data;
}


// ============================================================
// HEALTH CHECK
// ============================================================

export async function checkHealth() {
  try {
    const response = await fetch(
      `${API_URL}/api/health`
    );

    return await getResponseData(response);

  } catch (error) {
    console.error("Health check failed:", error);

    throw new Error(
      "Backend is not reachable. Make sure FastAPI is running on port 8000."
    );
  }
}


// ============================================================
// PDF UPLOAD
// ============================================================

export async function uploadResearchPaper(file) {
  if (!file) {
    throw new Error("Please select a PDF file.");
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are supported.");
  }

  const formData = new FormData();

  formData.append("file", file);

  try {
    console.log("Uploading:", file.name);

    const response = await fetch(
      `${API_URL}/api/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await getResponseData(response);

    console.log("Upload successful:", data);

    return data;

  } catch (error) {
    console.error("PDF upload failed:", error);
    throw error;
  }
}


// ============================================================
// PDF UPLOAD ALIAS
// ============================================================

export async function uploadPaper(file) {
  return uploadResearchPaper(file);
}


// ============================================================
// GET UPLOADED PAPERS
// ============================================================

export async function getUploadedPapers() {
  try {
    const response = await fetch(
      `${API_URL}/api/papers`
    );

    return await getResponseData(response);

  } catch (error) {
    console.error("Getting papers failed:", error);
    throw error;
  }
}


// ============================================================
// RESEARCH SEARCH
// ============================================================

export async function searchResearch(query) {
  if (!query || !query.trim()) {
    throw new Error("Please enter a research topic.");
  }

  const cleanQuery = query.trim();

  try {
    const url =
      `${API_URL}/api/research?query=` +
      encodeURIComponent(cleanQuery);

    console.log("Research search:", cleanQuery);

    const response = await fetch(url);

    const data = await getResponseData(response);

    console.log("Research results:", data);

    return data;

  } catch (error) {
    console.error("Research search failed:", error);
    throw error;
  }
}


// ============================================================
// RESEARCH ALIAS
// ============================================================

export async function researchSearch(query) {
  return searchResearch(query);
}


// ============================================================
// AI ASSISTANT
// ============================================================

export async function askAssistant(question) {
  if (!question || !question.trim()) {
    throw new Error("Please enter a question.");
  }

  const cleanQuestion = question.trim();

  try {
    console.log(
      "Sending question to AI:",
      cleanQuestion
    );

    const response = await fetch(
      `${API_URL}/api/assistant`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: cleanQuestion,
        }),
      }
    );

    const data = await getResponseData(response);

    console.log("AI response:", data);

    return data;

  } catch (error) {
    console.error("AI Assistant failed:", error);
    throw error;
  }
}


// ============================================================
// CHAT ALIAS
// ============================================================

export async function askChat(question) {
  return askAssistant(question);
}


// ============================================================
// SUMMARIZE PAPERS
// ============================================================
// This sends a real question to the AI.
// It does NOT generate a fake/hard-coded answer.

export async function summarizePapers() {
  return askAssistant(
    "Summarize the main findings of my uploaded research papers. " +
    "Identify the major findings, methodology, conclusions, " +
    "and important limitations."
  );
}


// ============================================================
// GENERIC API REQUEST
// ============================================================

export async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(
      `${API_URL}${endpoint}`,
      options
    );

    return await getResponseData(response);

  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  checkHealth,

  uploadResearchPaper,
  uploadPaper,

  getUploadedPapers,

  searchResearch,
  researchSearch,

  askAssistant,
  askChat,

  summarizePapers,

  apiRequest,
};