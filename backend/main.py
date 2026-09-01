import os
import shutil
from pathlib import Path

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from google import genai
import httpx

# --------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


# --------------------------------------------------
# FASTAPI APP
# --------------------------------------------------

app = FastAPI(
    title="Medical RAG Research Assistant",
    description="AI-powered medical research knowledge assistant",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# STORAGE
# --------------------------------------------------

UPLOAD_FOLDER = Path("uploaded_papers")
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Store the latest uploaded paper
current_paper = None


# --------------------------------------------------
# REQUEST MODEL
# --------------------------------------------------

class QuestionRequest(BaseModel):
    question: str


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "Medical RAG Assistant Backend is running"
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "Medical RAG Research Assistant"
    }


# --------------------------------------------------
# UPLOAD RESEARCH PAPER
# --------------------------------------------------

@app.post("/api/upload")
async def upload_research_paper(file: UploadFile = File(...)):
    global current_paper

    if not file.filename.lower().endswith(".pdf"):
        return {
            "success": False,
            "message": "Please upload a PDF research paper."
        }

    file_path = UPLOAD_FOLDER / file.filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        current_paper = {
            "filename": file.filename,
            "path": str(file_path)
        }

        return {
            "success": True,
            "message": "Research paper uploaded successfully.",
            "filename": file.filename
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Upload failed: {str(e)}"
        }


# --------------------------------------------------
# ASK AI
# --------------------------------------------------

@app.post("/api/ask")
async def ask_assistant(request: QuestionRequest):

    global current_paper

    question = request.question.strip()

    if not question:
        return {
            "success": False,
            "answer": "Please enter a question."
        }

    if not current_paper:
        return {
            "success": False,
            "answer": "Please upload a research paper first."
        }

    if client is None:
        return {
            "success": False,
            "answer": "Gemini API key is not configured in the backend."
        }

    try:

        # Upload PDF to Gemini
        uploaded_file = client.files.upload(
            file=current_paper["path"]
        )

        prompt = f"""
You are a medical research assistant.

Analyze the uploaded research paper carefully.

User question:
{question}

Give a clear, accurate answer based ONLY on the uploaded research paper.

For a request such as "Summarize the main findings", provide:

1. Main findings
2. Important results
3. Methodology, if relevant
4. Key conclusions
5. Important limitations, if mentioned

Do not invent information that is not present in the paper.

Use simple academic language suitable for an engineering/medical student.

Mention important evidence from the paper when available.
"""

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                uploaded_file,
                prompt
            ]
        )

        answer = response.text

        return {
            "success": True,
            "answer": answer,
            "filename": current_paper["filename"]
        }

    except Exception as e:

        print("AI ERROR:", str(e))

        return {
            "success": False,
            "answer": f"AI processing failed: {str(e)}"
        }


# --------------------------------------------------
# RUNNING MESSAGE
# --------------------------------------------------

print("Medical RAG Research Assistant Backend loaded.")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to your frontend URL (e.g., "http://localhost:5173") for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/research")
async def search_research(query: str):
    if not query.strip():
        return {"success": False, "message": "Please enter a search term.", "results": []}

    try:
        async with httpx.AsyncClient() as http_client:
            # Step 1: search PubMed for matching article IDs
            search_response = await http_client.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
                params={
                    "db": "pubmed",
                    "term": query,
                    "retmax": 10,
                    "retmode": "json",
                }
            )
            search_data = search_response.json()
            id_list = search_data.get("esearchresult", {}).get("idlist", [])

            if not id_list:
                return {"success": True, "results": []}

            # Step 2: fetch summaries for those IDs
            summary_response = await http_client.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
                params={
                    "db": "pubmed",
                    "id": ",".join(id_list),
                    "retmode": "json",
                }
            )
            summary_data = summary_response.json()
            result_ids = summary_data.get("result", {}).get("uids", [])

            results = []
            for pmid in result_ids:
                item = summary_data["result"][pmid]
                results.append({
                    "pmid": pmid,
                    "title": item.get("title", "Untitled"),
                    "authors": ", ".join(
                        a.get("name", "") for a in item.get("authors", [])
                    ),
                    "journal": item.get("fulljournalname", ""),
                    "pubdate": item.get("pubdate", ""),
                    "link": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                })

            return {"success": True, "results": results}

    except Exception as e:
        print("RESEARCH SEARCH ERROR:", str(e))
        return {"success": False, "message": f"Search failed: {str(e)}", "results": []}