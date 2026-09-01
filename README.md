🩺 MediRAG — Medical Research Knowledge Assistant

«An AI-powered RAG-based assistant for searching and understanding medical research documents.»

📌 Overview

MediRAG is a Medical Research Knowledge Assistant built using Retrieval-Augmented Generation (RAG).

The system allows users to upload medical research papers and documents, ask questions about them, and receive AI-generated answers based on the uploaded knowledge.

Instead of relying only on the AI's pre-trained knowledge, the system retrieves relevant information from the uploaded documents and uses it to generate more accurate, source-based responses.

✨ Features

- 📄 Upload medical research PDFs
- 🔍 Search and retrieve relevant information
- 🤖 AI-powered question answering
- 🧠 Retrieval-Augmented Generation (RAG)
- 📚 Document-based knowledge retrieval
- 🔗 Display relevant sources
- ⚡ Fast API backend
- 💻 Modern and responsive web interface
- 📊 Research/document management
- 🕘 Query/history support

🏗️ System Architecture

                    ┌─────────────────────┐
                    │      User           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    React Frontend  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI Backend  │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
          ┌───────────────┐        ┌────────────────┐
          │ PDF Documents │        │ RAG Pipeline   │
          └───────────────┘        └───────┬────────┘
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                       ┌─────────────┐          ┌─────────────┐
                       │ Embeddings  │          │ Retriever   │
                       └──────┬──────┘          └──────┬──────┘
                              │                         │
                              └────────────┬────────────┘
                                           ▼
                                  ┌─────────────────┐
                                  │ AI Generator    │
                                  └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ Answer + Sources│
                                  └─────────────────┘

📂 Project Structure

medical-research-assistant/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Answer.jsx
│   │   │   ├── Sources.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── PaperCard.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Research.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Documents.jsx
│   │   │   └── History.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── rag/
│   │   ├── loader.py
│   │   ├── chunker.py
│   │   ├── embeddings.py
│   │   ├── retriever.py
│   │   └── generator.py
│   │
│   ├── documents/
│   └── requirements.txt
│
├── .env
├── .gitignore
└── README.md

🔄 How RAG Works

The application follows these steps:

1. Upload

The user uploads a medical research PDF.

2. Document Loading

The PDF content is extracted and processed.

3. Chunking

The document is divided into smaller meaningful sections called chunks.

4. Embeddings

The chunks are converted into numerical vector representations called embeddings.

5. Retrieval

When the user asks a question, the system searches for the most relevant chunks.

6. Generation

The retrieved information is provided to the AI model, which generates an answer based on the available research content.

7. Sources

The application displays the relevant document/source information along with the answer.

🛠️ Technologies Used

Frontend

- React.js
- JavaScript
- HTML
- CSS
- Vite

Backend

- Python
- FastAPI

AI / RAG

- Retrieval-Augmented Generation
- Text Embeddings
- Vector Search
- Large Language Model

Document Processing

- PDF extraction
- Text chunking
- Semantic retrieval

🚀 Installation

Step 1 — Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL
cd medical-research-assistant

Step 2 — Setup Backend

cd backend

Create a virtual environment:

python -m venv venv

Activate it.

Windows:

venv\Scripts\activate

Mac/Linux:

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Step 3 — Configure Environment Variables

Create a ".env" file in the backend folder and add your required API keys/configuration.

Example:

OPENAI_API_KEY=your_api_key_here

«⚠️ Never upload your real API keys or ".env" file to GitHub.»

Step 4 — Start Backend

uvicorn main:app --reload

The backend will normally run at:

http://127.0.0.1:8000

Step 5 — Start Frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will normally be available at:

http://localhost:5173

💡 Example Usage

1. Open the application.
2. Upload a medical research PDF.
3. Wait for the document to be processed.
4. Enter a research question.
5. The system retrieves relevant information.
6. The AI generates an answer.
7. Review the sources used to generate the answer.

🎯 Use Cases

- 📖 Understanding research papers
- 🔬 Medical research assistance
- 📚 Literature exploration
- 🧑‍🎓 Student research
- 📝 Research document analysis
- 🔎 Finding relevant information in large documents

⚠️ Disclaimer

This project is designed for educational and research purposes only.

It is not a medical diagnosis or treatment system and should not be used as a substitute for professional medical advice.

AI-generated responses may contain errors. Always verify important medical information using trusted medical sources and qualified healthcare professionals.

🔮 Future Improvements

- 🌐 PubMed/research database integration
- 📑 Automatic research-paper summarization
- 🧬 Medical entity extraction
- 📊 Research analytics dashboard
- 🗣️ Voice-based questions
- 🌍 Multilingual support
- 🔐 User authentication
- ☁️ Cloud deployment
- 📱 Improved mobile experience
- 📈 Advanced citation and source tracking

👩‍💻 Project

Project: Medical Research Knowledge Assistant

Type: RAG-Based AI Knowledge Assistant

Domain: Artificial Intelligence + Medical Research

⭐ Acknowledgement

This project was developed as an AI/RAG learning and internship project to explore document retrieval, embeddings, vector search, and generative AI.
