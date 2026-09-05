import os
import shutil
from pathlib import Path
from typing import List

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google import genai
from pypdf import PdfReader


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Use a stable Gemini model.
# You can change this in .env if required.
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)


# ============================================================
# GEMINI CLIENT
# ============================================================

client = None

if GEMINI_API_KEY:
    try:
        client = genai.Client(
            api_key=GEMINI_API_KEY
        )

        print("Gemini client initialized.")

    except Exception as e:
        print("Gemini initialization error:", e)

else:
    print("WARNING: GEMINI_API_KEY is not set.")


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"

PAPER_DIR = BASE_DIR / "uploaded_papers"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

PAPER_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Medical RAG Research Assistant",
    version="2.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class AssistantRequest(BaseModel):
    question: str


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Medical RAG Research Assistant Backend is running",
        "status": "ok"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "backend": "running",
        "gemini": client is not None,
        "gemini_model": GEMINI_MODEL
    }


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_pdf_text(pdf_path: Path) -> str:

    try:

        reader = PdfReader(
            str(pdf_path)
        )

        pages_text = []

        for page_number, page in enumerate(
            reader.pages,
            start=1
        ):

            try:

                text = page.extract_text()

                if text:

                    text = text.strip()

                    if text:
                        pages_text.append(
                            f"\n--- Page {page_number} ---\n"
                            f"{text}"
                        )

            except Exception as page_error:

                print(
                    f"Could not read page {page_number}:",
                    page_error
                )

        complete_text = "\n".join(
            pages_text
        )

        return complete_text.strip()

    except Exception as e:

        print(
            "PDF extraction error:",
            e
        )

        raise


# ============================================================
# SAVE EXTRACTED PAPER TEXT
# ============================================================

def save_paper_text(
    filename: str,
    text: str
) -> Path:

    text_filename = (
        Path(filename).stem
        + ".txt"
    )

    text_path = (
        PAPER_DIR
        / text_filename
    )

    with open(
        text_path,
        "w",
        encoding="utf-8"
    ) as f:

        f.write(text)

    return text_path


# ============================================================
# READ ALL UPLOADED PAPER TEXT
# ============================================================

def get_all_paper_text() -> str:

    text_files = list(
        PAPER_DIR.glob("*.txt")
    )

    if not text_files:

        return ""

    all_papers = []

    for text_file in text_files:

        try:

            with open(
                text_file,
                "r",
                encoding="utf-8"
            ) as f:

                text = f.read().strip()

            if text:

                all_papers.append(
                    f"""
==================================================
RESEARCH PAPER: {text_file.stem}
==================================================

{text}
"""
                )

        except Exception as e:

            print(
                f"Could not read {text_file}:",
                e
            )

    return "\n".join(
        all_papers
    ).strip()


# ============================================================
# PDF UPLOAD
# ============================================================

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...)
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    # --------------------------------------------------------
    # Check PDF
    # --------------------------------------------------------

    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    # --------------------------------------------------------
    # Safe filename
    # --------------------------------------------------------

    safe_filename = Path(
        file.filename
    ).name

    pdf_path = (
        UPLOAD_DIR
        / safe_filename
    )

    try:

        # ----------------------------------------------------
        # Save PDF
        # ----------------------------------------------------

        with open(
            pdf_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        print(
            f"PDF saved: {pdf_path}"
        )

        # ----------------------------------------------------
        # Extract text
        # ----------------------------------------------------

        extracted_text = extract_pdf_text(
            pdf_path
        )

        if not extracted_text:

            # Delete unusable file
            try:
                pdf_path.unlink()
            except Exception:
                pass

            raise HTTPException(
                status_code=400,
                detail=(
                    "The PDF was uploaded, but no readable "
                    "text could be extracted. "
                    "The PDF may be scanned/image-only."
                )
            )

        # ----------------------------------------------------
        # Save extracted text
        # ----------------------------------------------------

        text_path = save_paper_text(
            safe_filename,
            extracted_text
        )

        print(
            f"Extracted text saved: {text_path}"
        )

        # ----------------------------------------------------
        # Count words
        # ----------------------------------------------------

        word_count = len(
            extracted_text.split()
        )

        return {

            "success": True,

            "message": (
                "PDF uploaded and processed successfully."
            ),

            "filename": safe_filename,

            "size": pdf_path.stat().st_size,

            "text_file": text_path.name,

            "pages_text_available": True,

            "word_count": word_count
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "Upload processing error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"PDF processing failed: {str(e)}"
            )
        )


# ============================================================
# ALTERNATIVE UPLOAD ENDPOINT
# ============================================================

@app.post("/api/upload-paper")
async def upload_paper(
    file: UploadFile = File(...)
):

    return await upload_file(file)


# ============================================================
# LIST UPLOADED PAPERS
# ============================================================

@app.get("/api/papers")
def get_uploaded_papers():

    papers = []

    for pdf_file in UPLOAD_DIR.glob("*.pdf"):

        text_file = (
            PAPER_DIR
            / (
                pdf_file.stem
                + ".txt"
            )
        )

        papers.append({

            "filename": pdf_file.name,

            "size": pdf_file.stat().st_size,

            "processed": text_file.exists(),

            "word_count": (
                len(
                    text_file.read_text(
                        encoding="utf-8"
                    ).split()
                )
                if text_file.exists()
                else 0
            )
        })

    return {

        "success": True,

        "papers": papers,

        "count": len(papers)
    }


# ============================================================
# RESEARCH SEARCH - PUBMED
# ============================================================

@app.get("/api/research")
async def research_search(
    query: str = Query(
        ...,
        min_length=1
    )
):

    query = query.strip()

    if not query:

        raise HTTPException(
            status_code=400,
            detail="Research query cannot be empty."
        )

    try:

        async with httpx.AsyncClient(
            timeout=30.0
        ) as http:

            # ------------------------------------------------
            # PubMed search
            # ------------------------------------------------

            search_url = (
                "https://eutils.ncbi.nlm.nih.gov/"
                "entrez/eutils/esearch.fcgi"
            )

            search_params = {

                "db": "pubmed",

                "term": query,

                "retmode": "json",

                "retmax": 10
            }

            search_response = await http.get(
                search_url,
                params=search_params
            )

            search_response.raise_for_status()

            search_data = (
                search_response.json()
            )

            ids = (
                search_data
                .get("esearchresult", {})
                .get("idlist", [])
            )

            if not ids:

                return {

                    "success": True,

                    "query": query,

                    "results": []
                }

            # ------------------------------------------------
            # Get summaries
            # ------------------------------------------------

            summary_url = (
                "https://eutils.ncbi.nlm.nih.gov/"
                "entrez/eutils/esummary.fcgi"
            )

            summary_params = {

                "db": "pubmed",

                "id": ",".join(ids),

                "retmode": "json"
            }

            summary_response = await http.get(
                summary_url,
                params=summary_params
            )

            summary_response.raise_for_status()

            summary_data = (
                summary_response.json()
            )

            results = []

            for article_id in ids:

                article = (
                    summary_data
                    .get("result", {})
                    .get(article_id)
                )

                if not article:
                    continue

                results.append({

                    "id": article_id,

                    "title": article.get(
                        "title",
                        "Untitled"
                    ),

                    "journal": article.get(
                        "fulljournalname",
                        article.get(
                            "source",
                            ""
                        )
                    ),

                    "published": article.get(
                        "pubdate",
                        ""
                    ),

                    "authors": [
                        author.get(
                            "name",
                            ""
                        )

                        for author in article.get(
                            "authors",
                            []
                        )
                    ],

                    "url": (
                        "https://pubmed.ncbi.nlm.nih.gov/"
                        f"{article_id}/"
                    )
                })

            return {

                "success": True,

                "query": query,

                "results": results
            }

    except Exception as e:

        print(
            "Research search error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Research search failed: {str(e)}"
            )
        )


# ============================================================
# AI ASSISTANT / RAG
# ============================================================

@app.post("/api/assistant")
async def assistant(
    request: AssistantRequest
):

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    # --------------------------------------------------------
    # Check Gemini
    # --------------------------------------------------------

    if client is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Gemini API is not configured. "
                "Check GEMINI_API_KEY in your .env file."
            )
        )

    # --------------------------------------------------------
    # Get uploaded paper context
    # --------------------------------------------------------

    paper_context = get_all_paper_text()

    if not paper_context:

        return {

            "success": True,

            "answer": (
                "I don't have any readable research paper "
                "content in the knowledge base yet. "
                "Please upload a PDF research paper first."
            ),

            "papers_used": 0
        }

    # --------------------------------------------------------
    # Prevent extremely large prompts
    # --------------------------------------------------------

    MAX_CONTEXT_CHARS = 100000

    if len(paper_context) > MAX_CONTEXT_CHARS:

        paper_context = paper_context[
            :MAX_CONTEXT_CHARS
        ]

        paper_context += (
            "\n\n[Paper context truncated due to size.]"
        )

    # --------------------------------------------------------
    # Detect summary request
    # --------------------------------------------------------

    lower_question = question.lower()

    summary_words = [

        "summarize",

        "summarise",

        "summary",

        "main findings",

        "key findings",

        "findings",

        "overview",

        "across these studies"
    ]

    is_summary_request = any(
        word in lower_question
        for word in summary_words
    )

    # --------------------------------------------------------
    # Create RAG prompt
    # --------------------------------------------------------

    if is_summary_request:

        task_instruction = """
The user wants a summary of the uploaded research paper(s).

Provide a structured research summary containing:

1. Main findings
2. Important results
3. Research methodology, if available
4. Main conclusions
5. Important limitations
6. Areas of uncertainty or conflicting evidence
7. Important clinical/research implications

Use ONLY information supported by the uploaded papers.

Do not invent findings that are not present in the papers.
"""

    else:

        task_instruction = """
Answer the user's question using the uploaded research
paper(s) as the primary source.

If the answer is present in the papers, explain it clearly.

If the papers do not contain enough information to answer,
say so clearly instead of inventing information.

Where useful, mention which paper or section supports the answer.
"""

    prompt = f"""
You are MedResearch, a medical research RAG assistant.

You are answering questions about uploaded research papers.

IMPORTANT RULES:

- Use the provided research-paper context.
- Do not invent information.
- Do not pretend that information exists in the papers
  if it does not.
- Clearly identify uncertainty.
- Do not provide personal medical diagnosis.
- Do not give unsafe medical treatment instructions.
- Use clear, evidence-based language.
- Keep the answer useful and well structured.

{task_instruction}

USER QUESTION:
{question}


==================================================
UPLOADED RESEARCH PAPER CONTEXT
==================================================

{paper_context}

==================================================
END OF RESEARCH PAPER CONTEXT
==================================================
"""

    # --------------------------------------------------------
    # Send to Gemini
    # --------------------------------------------------------

    try:

        print(
            "Sending RAG question to Gemini..."
        )

        response = client.models.generate_content(

            model=GEMINI_MODEL,

            contents=prompt
        )

        answer = getattr(
            response,
            "text",
            None
        )

        if not answer:

            answer = (
                "Gemini returned an empty response."
            )

        # Count papers
        paper_count = len(
            list(
                PAPER_DIR.glob("*.txt")
            )
        )

        return {

            "success": True,

            "answer": answer,

            "papers_used": paper_count,

            "model": GEMINI_MODEL
        }

    except Exception as e:

        print(
            "Gemini error:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"AI Assistant failed: {str(e)}"
            )
        )


# ============================================================
# CHAT ALIAS
# ============================================================

@app.post("/api/chat")
async def chat(
    request: AssistantRequest
):

    return await assistant(request)


# ============================================================
# AI ASSISTANT GET TEST
# ============================================================

@app.get("/api/assistant")
def assistant_get():

    return {

        "success": True,

        "message": (
            "AI Assistant endpoint is working."
        ),

        "method": "POST",

        "endpoint": "/api/assistant"
    }


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event():

    print("")
    print("=" * 60)

    print(
        "Medical RAG Research Assistant Backend"
    )

    print("=" * 60)

    print(
        f"Upload directory: {UPLOAD_DIR}"
    )

    print(
        f"Paper directory:  {PAPER_DIR}"
    )

    print(
        f"Gemini enabled:   {client is not None}"
    )

    print(
        f"Gemini model:     {GEMINI_MODEL}"
    )

    existing_papers = list(
        UPLOAD_DIR.glob("*.pdf")
    )

    existing_text = list(
        PAPER_DIR.glob("*.txt")
    )

    print(
        f"PDF papers:       {len(existing_papers)}"
    )

    print(
        f"Processed papers: {len(existing_text)}"
    )

    print("=" * 60)
    print("")