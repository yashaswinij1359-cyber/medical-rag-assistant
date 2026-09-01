import { useEffect, useRef, useState } from "react";
import { askAssistant, uploadResearchPaper,searchResearch } from "./api";
import {
  Activity,
  ArrowUp,
  BookOpen,
  Brain,
  ChevronRight,
  CircleHelp,
  FileText,
  FlaskConical,
  FolderOpen,
  HeartPulse,
  History,
  Home,
  Library,
  Menu,
  MessageSquare,
  Microscope,
  Paperclip,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import "./index.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [query, setQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef(null);
  const [researchResults, setResearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  

  useEffect(() => {
    checkBackend();
  }, []);

  async function checkBackend() {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      setBackendOnline(response.ok);
    } catch {
      setBackendOnline(false);
    }
  }

 async function handleFileUpload(event) {
  const files = Array.from(event.target.files || []);

  const pdfFiles = files.filter(
    (file) => file.type === "application/pdf"
  );

  for (const file of pdfFiles) {
    try {
      await uploadResearchPaper(file);

      setUploadedFiles((previous) => [
        ...previous,
        {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: formatFileSize(file.size),
        },
      ]);
    } catch (error) {
      console.error("Upload failed:", error.message);
    }
  }

  event.target.value = "";
}

  function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function removeFile(id) {
    setUploadedFiles((previous) =>
      previous.filter((file) => file.id !== id)
    );
  }

  async function handleResearchSearch(event) {
  event.preventDefault();

  if (!query.trim()) return;

  setSearching(true);
  setSearchError(null);

  try {
    const data = await searchResearch(query);
    console.log("Research API response:", data); // temporary debug line
    setResearchResults(data?.results || []);
  } catch (error) {
    console.error("Research search error:", error);
    setSearchError(error.message);
    setResearchResults([]);
  } finally {
    setSearching(false);
    setActivePage("Research");
  }
}

 async function sendMessage(event) {
  event.preventDefault();

  const text = chatInput.trim();

  if (!text) return;

  setMessages((previous) => [
    ...previous,
    {
      type: "user",
      text,
    },
  ]);

  setChatInput("");

  try {
    const data = await askAssistant(text);

    setMessages((previous) => [
      ...previous,
      {
        type: "assistant",
        text: data.success
          ? data.answer
          : data.answer || "Something went wrong. Please try again.",
      },
    ]);
  } catch (error) {
    setMessages((previous) => [
      ...previous,
      {
        type: "assistant",
        text: `Error: ${error.message}`,
      },
    ]);
  }
}

  const navigation = [
    {
      label: "Overview",
      icon: Home,
    },
    {
      label: "Research",
      icon: Search,
    },
    {
      label: "AI Assistant",
      icon: MessageSquare,
    },
    {
      label: "My Library",
      icon: Library,
    },
  ];

  return (
    <div className="app-shell">

      {/* Mobile overlay */}
      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <HeartPulse size={23} />
          </div>

          <div>
            <div className="brand-name">MedResearch</div>
            <div className="brand-subtitle">RAG Intelligence</div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-card">
          <div className="workspace-icon">
            <Microscope size={18} />
          </div>

          <div>
            <span>Workspace</span>
            <strong>Medical Research</strong>
          </div>

          <ChevronRight size={16} />
        </div>

        <div className="nav-section">
          <p className="nav-title">WORKSPACE</p>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  activePage === item.label ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.label);
                  setMobileMenu(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>

                {item.label === "My Library" &&
                  uploadedFiles.length > 0 && (
                    <span className="nav-badge">
                      {uploadedFiles.length}
                    </span>
                  )}
              </button>
            );
          })}
        </div>

        <div className="nav-section">
          <p className="nav-title">TOOLS</p>

          <button
            className="nav-item"
            onClick={() => setActivePage("Collections")}
          >
            <FolderOpen size={18} />
            <span>Collections</span>
          </button>

          <button
            className="nav-item"
            onClick={() => setActivePage("History")}
          >
            <History size={18} />
            <span>Research History</span>
          </button>
        </div>

        <div className="sidebar-bottom">

          <div className="privacy-card">
            <div className="privacy-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <strong>Research mode</strong>
              <span>Sources are shown with answers</span>
            </div>
          </div>

          <button
            className="nav-item"
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">
              <UserRound size={18} />
            </div>

            <div className="profile-info">
              <strong>Researcher</strong>
              <span>Medical workspace</span>
            </div>

            <CircleHelp size={17} />
          </div>

        </div>
      </aside>

      {/* MAIN */}
      <main className="main-area">

        {/* TOPBAR */}
        <header className="topbar">

          <button
            className="menu-button"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumbs">
            <span>Medical Research</span>
            <ChevronRight size={15} />
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">

            <div className="system-status">
              <span
                className={`status-dot ${
                  backendOnline ? "online" : "offline"
                }`}
              />
              {backendOnline ? "AI system online" : "Backend offline"}
            </div>

            <button className="top-icon">
              <Settings size={18} />
            </button>

          </div>
        </header>

        {/* PAGE */}
        <div className="page-content">

          {activePage === "Overview" && (
            <Overview
              query={query}
              setQuery={setQuery}
              handleResearchSearch={handleResearchSearch}
              searching={searching}
              uploadedFiles={uploadedFiles}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              setActivePage={setActivePage}
            />
          )}

          {activePage === "Research" && (
  <ResearchPage
    query={query}
    setQuery={setQuery}
    handleResearchSearch={handleResearchSearch}
    searching={searching}
    researchResults={researchResults}
    searchError={searchError}
  />
)}

          {activePage === "AI Assistant" && (
            <AssistantPage
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendMessage={sendMessage}
              uploadedFiles={uploadedFiles}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              removeFile={removeFile}
            />
          )}

          {activePage === "My Library" && (
            <LibraryPage
              uploadedFiles={uploadedFiles}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              removeFile={removeFile}
            />
          )}

          {["Collections", "History", "Settings"].includes(activePage) && (
            <PlaceholderPage title={activePage} />
          )}

        </div>
      </main>
    </div>
  );
}


/* =========================
   OVERVIEW
========================= */

function Overview({
  query,
  setQuery,
  handleResearchSearch,
  searching,
  uploadedFiles,
  fileInputRef,
  handleFileUpload,
  setActivePage,
}) {
  return (
    <div className="dashboard">

      <section className="hero">

        <div className="hero-glow" />

        <div className="hero-content">

          <div className="eyebrow">
            <Sparkles size={15} />
            AI-POWERED MEDICAL RESEARCH
          </div>

          <h1>
            Research faster.
            <br />
            <span>Understand deeper.</span>
          </h1>

          <p>
            Search medical literature, analyze research papers,
            and ask questions across your private research library
            using retrieval-augmented AI.
          </p>

          <form
            className="research-search"
            onSubmit={handleResearchSearch}
          >
            <Search size={21} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search medical research, conditions, treatments..."
            />

            <button type="submit" disabled={searching}>
              {searching ? "Searching..." : "Search"}
              {!searching && <ArrowUp size={17} />}
            </button>
          </form>

          <div className="search-suggestions">
            <span>Try:</span>

            <button
              onClick={() => setQuery("Alzheimer's disease biomarkers")}
            >
              Alzheimer's biomarkers
            </button>

            <button
              onClick={() => setQuery("mRNA vaccine research")}
            >
              mRNA vaccines
            </button>

            <button
              onClick={() => setQuery("diabetes treatment studies")}
            >
              Diabetes studies
            </button>
          </div>

        </div>

        <div className="hero-orbit">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-core">
            <Brain size={43} />
          </div>
        </div>

      </section>


      {/* QUICK ACTIONS */}

      <section className="section-block">

        <div className="section-heading">
          <div>
            <span className="section-kicker">START HERE</span>
            <h2>Research workspace</h2>
          </div>
        </div>

        <div className="action-grid">

          <ActionCard
            icon={<Upload />}
            title="Upload research"
            description="Add PDFs to your private knowledge base."
            primary
            onClick={() => fileInputRef.current?.click()}
          />

          <ActionCard
            icon={<MessageSquare />}
            title="Ask AI"
            description="Ask questions grounded in your research."
            onClick={() => setActivePage("AI Assistant")}
          />

          <ActionCard
            icon={<Search />}
            title="Find literature"
            description="Explore relevant medical research."
            onClick={() => setActivePage("Research")}
          />

        </div>

      </section>


      {/* STATS */}

      <section className="stats-grid">

        <StatCard
          icon={<FileText />}
          number={uploadedFiles.length}
          label="Papers in library"
        />

        <StatCard
          icon={<Brain />}
          number="RAG"
          label="Knowledge engine"
        />

        <StatCard
          icon={<FlaskConical />}
          number="AI"
          label="Research assistant"
        />

        <StatCard
          icon={<Zap />}
          number="Live"
          label="Research workflow"
        />

      </section>


      {/* RECENT RESEARCH */}

      <section className="section-block">

        <div className="section-heading row-heading">
          <div>
            <span className="section-kicker">RESEARCH FLOW</span>
            <h2>Built for serious research</h2>
          </div>

          <button
            className="text-button"
            onClick={() => setActivePage("AI Assistant")}
          >
            Open assistant
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="feature-grid">

          <FeatureCard
            number="01"
            icon={<Search />}
            title="Retrieve"
            text="Find relevant research from your indexed knowledge base."
          />

          <FeatureCard
            number="02"
            icon={<Brain />}
            title="Reason"
            text="Use retrieved context to build focused research answers."
          />

          <FeatureCard
            number="03"
            icon={<BookOpen />}
            title="Verify"
            text="Review the supporting research before using an answer."
          />

        </div>

      </section>


      {/* DISCLAIMER */}

      <div className="medical-disclaimer">
        <ShieldCheck size={18} />

        <div>
          <strong>Research information only</strong>
          <span>
            This application is designed for educational and research
            purposes. It is not a substitute for professional medical
            advice, diagnosis, or treatment.
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={handleFileUpload}
      />

    </div>
  );
}


/* =========================
   RESEARCH
========================= */

function ResearchPage({
  query,
  setQuery,
  handleResearchSearch,
  searching,
  researchResults,
  searchError,
}) {
  return (
    <div className="inner-page">
      <div className="page-title">
        <span className="section-kicker">LITERATURE</span>
        <h1>Research Explorer</h1>
        <p>Search and discover medical research relevant to your topic.</p>
      </div>

      <form className="large-search" onSubmit={handleResearchSearch}>
        <Search size={21} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search research..."
        />
        <button type="submit">
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {searchError && (
        <p style={{ color: "red" }}>{searchError}</p>
      )}

      {!searching && researchResults.length === 0 && !searchError && (
        <div className="empty-research">
          <div className="empty-icon">
            <Search size={28} />
          </div>
          <h2>Search medical literature</h2>
          <p>Enter a topic above to search PubMed.</p>
          <div className="topic-chips">
            <span>Clinical trials</span>
            <span>Systematic reviews</span>
            <span>Neuroscience</span>
            <span>Oncology</span>
            <span>Cardiology</span>
          </div>
        </div>
      )}

      {researchResults.length > 0 && (
        <div className="research-results">
          {researchResults.map((paper) => (
            <div className="research-result-card" key={paper.pmid}>
              <h3>{paper.title}</h3>
              <p>{paper.authors}</p>
              <p>
                {paper.journal} — {paper.pubdate}
              </p>
              <a href={paper.link} target="_blank" rel="noreferrer">
                View on PubMed
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   ASSISTANT
========================= */

function AssistantPage({
  messages,
  chatInput,
  setChatInput,
  sendMessage,
  uploadedFiles,
  fileInputRef,
  handleFileUpload,
  removeFile,
}) {
  return (
    <div className="assistant-page">

      <div className="assistant-header">

        <div>
          <span className="section-kicker">RAG ASSISTANT</span>
          <h1>Ask your research</h1>
          <p>
            Questions are designed to be answered using retrieved
            research context.
          </p>
        </div>

        <div className="ai-status">
          <span />
          RAG engine
        </div>

      </div>

      <div className="assistant-layout">

        <section className="chat-card">

          <div className="chat-messages">

            {messages.length === 0 && (
              <div className="chat-empty">

                <div className="chat-logo">
                  <Brain size={30} />
                </div>

                <h2>What would you like to research?</h2>

                <p>
                  Ask a question about your uploaded research papers.
                </p>

                <div className="suggestion-grid">

                  <button
                    onClick={() =>
                      setChatInput(
                        "Summarize the main findings of my papers"
                      )
                    }
                  >
                    <FileText size={17} />
                    Summarize my papers
                  </button>

                  <button
                    onClick={() =>
                      setChatInput(
                        "What are the key findings across these studies?"
                      )
                    }
                  >
                    <Brain size={17} />
                    Compare findings
                  </button>

                  <button
                    onClick={() =>
                      setChatInput(
                        "What limitations are mentioned in the research?"
                      )
                    }
                  >
                    <ShieldCheck size={17} />
                    Find limitations
                  </button>

                </div>

              </div>
            )}

            {messages.map((message, index) => (
              <div
                className={`message ${
                  message.type === "user"
                    ? "message-user"
                    : "message-ai"
                }`}
                key={index}
              >
                <div className="message-avatar">
                  {message.type === "user" ? (
                    <UserRound size={16} />
                  ) : (
                    <Brain size={16} />
                  )}
                </div>

                <div className="message-content">
                  {message.text}
                </div>
              </div>
            ))}

          </div>

          <form className="chat-input-area" onSubmit={sendMessage}>

            <button
              type="button"
              className="attachment-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={19} />
            </button>

            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask a question about your research..."
            />

            <button className="send-button" type="submit">
              <ArrowUp size={19} />
            </button>

          </form>

        </section>


        <aside className="context-card">

          <div className="context-header">
            <div>
              <span className="section-kicker">CONTEXT</span>
              <h3>Your knowledge base</h3>
            </div>

            <FileText size={19} />
          </div>

          <div className="context-count">
            <strong>{uploadedFiles.length}</strong>
            <span>PDF papers</span>
          </div>

          {uploadedFiles.length === 0 ? (
            <div className="context-empty">
              <Upload size={20} />

              <p>
                Upload research papers to give the assistant
                a knowledge base.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
              >
                Upload PDF
              </button>
            </div>
          ) : (
            <div className="context-files">
              {uploadedFiles.map((file) => (
                <div className="context-file" key={file.id}>
                  <FileText size={17} />

                  <div>
                    <strong>{file.name}</strong>
                    <span>{file.size}</span>
                  </div>

                  <button onClick={() => removeFile(file.id)}>
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </aside>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={handleFileUpload}
      />

    </div>
  );
}


/* =========================
   LIBRARY
========================= */

function LibraryPage({
  uploadedFiles,
  fileInputRef,
  handleFileUpload,
  removeFile,
}) {
  return (
    <div className="inner-page">

      <div className="page-title library-title">

        <div>
          <span className="section-kicker">KNOWLEDGE BASE</span>
          <h1>My Research Library</h1>
          <p>
            Your uploaded medical research papers.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={17} />
          Upload PDF
        </button>

      </div>

      {uploadedFiles.length === 0 ? (
        <div className="library-empty">

          <div className="empty-icon">
            <Library size={30} />
          </div>

          <h2>Your library is empty</h2>

          <p>
            Upload medical research PDFs to build your private
            RAG knowledge base.
          </p>

          <button
            className="primary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={17} />
            Add research paper
          </button>

        </div>
      ) : (
        <div className="paper-grid">

          {uploadedFiles.map((file) => (
            <div className="paper-card" key={file.id}>

              <div className="paper-icon">
                <FileText size={23} />
              </div>

              <div className="paper-info">
                <h3>{file.name}</h3>
                <span>{file.size} · PDF document</span>
              </div>

              <button
                className="remove-paper"
                onClick={() => removeFile(file.id)}
              >
                <X size={17} />
              </button>

            </div>
          ))}

        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={handleFileUpload}
      />

    </div>
  );
}


/* =========================
   COMPONENTS
========================= */

function ActionCard({
  icon,
  title,
  description,
  onClick,
  primary,
}) {
  return (
    <button
      className={`action-card ${primary ? "action-primary" : ""}`}
      onClick={onClick}
    >
      <div className="action-icon">{icon}</div>

      <div className="action-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <ChevronRight size={18} />
    </button>
  );
}


function StatCard({ icon, number, label }) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <strong>{number}</strong>
        <span>{label}</span>
      </div>

    </div>
  );
}


function FeatureCard({ number, icon, title, text }) {
  return (
    <div className="feature-card">

      <div className="feature-top">
        <span>{number}</span>

        <div className="feature-icon">
          {icon}
        </div>
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>
  );
}


function PlaceholderPage({ title }) {
  return (
    <div className="inner-page">

      <div className="page-title">
        <span className="section-kicker">WORKSPACE</span>
        <h1>{title}</h1>
        <p>
          This section is ready for the next backend integration.
        </p>
      </div>

      <div className="placeholder-card">

        <div className="empty-icon">
          <Settings size={28} />
        </div>

        <h2>{title} module</h2>

        <p>
          The interface is prepared. We'll connect this module
          to the backend after the RAG API is completed.
        </p>

      </div>

    </div>
  );
}

export default App;