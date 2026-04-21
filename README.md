# ⚖️ LexAI — Indian Legal Document Intelligence Platform

AI-powered platform for analyzing, summarizing, and understanding Indian legal documents using modern NLP and LLM techniques.

---

## 🚀 Overview

LexAI is a full-stack AI system designed to simplify complex legal documents by:

* 📄 Summarizing lengthy legal texts
* ⚖️ Mapping content to Indian laws (IPC, Contracts, etc.)
* 🔍 Extracting key entities and insights
* 🤖 Providing intelligent legal analysis

Built with a scalable architecture using modern AI + web technologies.

---

## ✨ Features

* 📑 **Legal Document Summarization**
  Convert complex legal text into concise, readable summaries

* ⚖️ **Indian Law Context Awareness**
  Identifies references to IPC sections, acts, and legal structures

* 🔍 **Entity Extraction**
  Extracts key parties, sections, and legal terms

* 📊 **Confidence-based Analysis**
  AI-generated predictions with confidence scoring

* 🧠 **LLM Integration (Gemini API)**
  Advanced reasoning using Google Gemini

* 📁 **Document Dashboard**
  Clean UI to manage and analyze documents

---

## 🏗️ Project Structure

```
lexai-project/
│
├── artifacts/mockup-sandbox   # Frontend (UI)
├── scripts                    # Backend / server logic
├── lib                        # Shared modules & integrations
│   ├── db
│   ├── integrations
│   └── api clients
│
├── package.json
├── pnpm-workspace.yaml
```

---

## 🛠️ Tech Stack

* **Frontend:** React / Vite (UI dashboard)
* **Backend:** Node.js (TypeScript)
* **Package Manager:** pnpm (monorepo workspace)
* **Database:** PostgreSQL
* **AI:** Google Gemini API
* **Architecture:** Modular monorepo

---

## ⚙️ Setup (Local Development)

### 1. Clone the repo

```
git clone https://github.com/YOUR_USERNAME/LexAI.git
cd LexAI
```

---

### 2. Install dependencies

```
pnpm install --ignore-scripts
```

---

### 3. Configure environment variables

Create `.env`:

```
DATABASE_URL=your_postgres_url

AI_INTEGRATIONS_GEMINI_API_KEY=your_api_key
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

---

### 4. Run the app

Frontend:

```
cd artifacts/mockup-sandbox
pnpm run dev
```

Backend:

```
cd scripts
pnpm run dev
```

---

## ⚠️ Notes

* Built initially in a Linux (Replit) environment — minor adjustments needed for Windows
* Backend and frontend run separately
* Requires API key + database to function fully

---

## 🎯 Use Cases

* Legal tech platforms
* Case analysis tools
* Law students & researchers
* Automated document processing systems

---

## 🌱 Future Improvements

* 🧾 Case law retrieval (RAG pipeline)
* 🔗 Cross-document linking
* 📊 Advanced legal analytics
* 🌍 Multi-country legal support
* 🧠 Fine-tuned legal LLM

---

## 👩‍💻 Author

**Limnisha Changkakati**
AI/ML Enthusiast • Full Stack Developer

---

## ⭐ If you like this project

Give it a star ⭐ and feel free to fork!
