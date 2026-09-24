# 🎉 BookMyDecor — PR Decorations Booking & AI Chat Platform

> A full-stack event decoration booking system with an AI-powered RAG chatbot, built for **PR Decorations**.

[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-FastAPI-blue?logo=python)](https://fastapi.tiangolo.com)
[![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-orange)](https://www.trychroma.com)
[![Groq](https://img.shields.io/badge/LLM-Groq%20LLaMA3-purple)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Local Development Setup](#-local-development-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [AI Chatbot & RAG System](#-ai-chatbot--rag-system)
- [Contributing](#-contributing)

---

## 🌟 Overview

**BookMyDecor** is an end-to-end decoration booking platform for **PR Decorations**. Customers can browse decoration packages, check availability, place bookings, and chat with an AI assistant powered by a Retrieval-Augmented Generation (RAG) pipeline trained on PR Decorations' knowledge base.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│              Vercel (Static Frontend)           │
│         HTML + Vanilla JS + CSS                 │
│  config.js → auto-detects prod vs. dev URL      │
└──────────────────┬──────────────────────────────┘
                   │ REST API calls
                   ▼
┌─────────────────────────────────────────────────┐
│         Render — Node.js Express API            │
│              (bookmydecor-node-api)             │
│  • /services  • /addons  • /availability        │
│  • /booking   • /gallery • /api/chat (proxy)    │
└──────────────────┬──────────────────────────────┘
                   │ Internal fetch (FASTAPI_SERVICE_URL)
                   ▼
┌─────────────────────────────────────────────────┐
│         Render — Python FastAPI (RAG)           │
│             (bookmydecor-ai-service)            │
│  • /ask   — RAG pipeline answer endpoint        │
│  • /health — vector store readiness check       │
│  ChromaDB (pre-built, committed to repo)        │
│  Embeddings: all-MiniLM-L6-v2                  │
│  LLM: Groq LLaMA-3.3-70b-versatile             │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
BookMyDecor/
├── frontend/                     # Static frontend (deployed on Vercel)
│   ├── index.html                # Main landing & booking page
│   ├── payment.html              # Payment confirmation page
│   ├── admin-gallery.html        # Admin gallery management
│   ├── app.js                    # Core frontend logic
│   ├── config.js                 # Dynamic API base URL (dev ↔ prod)
│   ├── styles.css                # Global stylesheet
│   ├── faqs.json                 # FAQ data for chatbot training
│   └── assets/
│       └── images/               # Static image assets
│
├── backend/                      # Node.js + Python backend (deployed on Render)
│   ├── server.js                 # Express entry point, CORS, routes
│   ├── package.json              # Node.js dependencies
│   │
│   ├── routes/                   # Express route handlers
│   │   ├── services.js           # GET /services
│   │   ├── addons.js             # GET /addons
│   │   ├── availability.js       # GET /availability
│   │   ├── bookings.js           # POST/GET/PATCH /booking
│   │   └── gallery.js            # GET/POST /gallery
│   │
│   ├── data/                     # JSON file-based data store
│   │   ├── services.json         # Decoration packages & pricing
│   │   ├── addons.json           # Add-on items
│   │   ├── bookings.json         # Booking records
│   │   └── gallery.json          # Gallery image metadata
│   │
│   ├── api.py                    # FastAPI app (RAG endpoints)
│   ├── chatbot.py                # Groq LLM integration
│   ├── prompt.py                 # System prompt template
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment variable template
│   │
│   ├── rag/                      # RAG pipeline module
│   │   ├── __init__.py
│   │   ├── loader.py             # Knowledge base document loader
│   │   ├── embeddings.py         # Sentence-Transformer embedding wrapper
│   │   ├── vectorstore.py        # ChromaDB build & query logic
│   │   └── retriever.py          # Top-K chunk retrieval
│   │
│   ├── chroma_db/                # Pre-built ChromaDB vector store
│   │   └── chroma.sqlite3        # Committed so Render doesn't need to rebuild
│   │
│   └── uploads/                  # Runtime file uploads (git-ignored)
│
└── data/                         # Shared RAG knowledge base source files
    └── rag_knowledge/
        └── PR_Decorations_RAG/   # .txt files used to build the vector store
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **Service Catalog** | Browse all decoration packages with pricing |
| 📅 **Availability Checker** | Check date availability before booking |
| 📝 **Online Booking** | Submit, confirm, and track bookings |
| 💳 **Payment Status** | Mark bookings as paid |
| 🖼 **Gallery** | Browse and upload decoration photos |
| 🤖 **AI Chatbot** | RAG-powered assistant answering business questions |
| 🔄 **Admin Panel** | Gallery management via dedicated admin page |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| HTML5 / CSS3 | Structure & styling |
| Vanilla JavaScript | Business logic, API calls |
| Google Fonts (Outfit) | Typography |

### Backend — Node.js
| Technology | Purpose |
|------------|---------|
| Express.js | HTTP server & routing |
| cors | Cross-origin request handling |
| multer | File upload handling |
| JSON files | Lightweight data store |

### Backend — Python (AI/RAG)
| Technology | Purpose |
|------------|---------|
| FastAPI | REST API framework |
| uvicorn[standard] | ASGI production server |
| ChromaDB | Vector database |
| sentence-transformers | `all-MiniLM-L6-v2` embeddings |
| Groq SDK | LLaMA-3.3-70b-versatile LLM |
| python-dotenv | Environment variable loading |
| pydantic | Request/response validation |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A **Groq API key** (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/sanjay11082006/bookmydecor-ai-service.git
cd bookmydecor-ai-service
```

### 2. Set Up the Node.js Backend

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
# Then edit .env and fill in your GROQ_API_KEY
```

### 3. Set Up the Python Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Build the Vector Store (first time only)

```bash
# From the backend/ directory, with venv activated
python -m rag.vectorstore
```

Expected output:
```
Loaded 18 chunks from ...
Embedding 18 chunks ...
Vector store built: 18 documents in 'pr_decorations' collection.
Persisted at: .../chroma_db
```

> **Note:** The `chroma_db/` is already committed in this repo — skip this step unless you've updated the knowledge base files in `data/rag_knowledge/`.

### 5. Start Both Servers

**Terminal 1 — Python FastAPI (port 8000):**
```bash
cd backend
venv\Scripts\activate   # or source venv/bin/activate
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Node.js Express (port 3000):**
```bash
cd backend
npm run dev
```

**Open your browser:**  
→ `http://localhost:3000` — Booking platform  
→ `http://localhost:8000/docs` — FastAPI Swagger UI

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ─── Groq LLM ─────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# ─── Production only (set in Render dashboard) ────────────────────
# PORT=10000                         # Automatically set by Render
# FASTAPI_SERVICE_URL=http://...     # Internal URL of the Python service on Render
```

> ⚠️ **Never commit your `.env` file.** It is git-ignored. Use the Render dashboard to set production secrets.

---

## 📡 API Reference

Base URL (production): `https://bookmydecor-node-api.onrender.com`

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/services` | List all decoration packages |
| `GET` | `/services/:id` | Get a single service by ID |

### Add-ons

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/addons` | List all available add-ons |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/availability?month=9&year=2026` | Check booked dates for a month |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/booking` | Create a new booking |
| `GET` | `/booking/:id` | Get booking status |
| `PATCH` | `/booking/:id/payment` | Mark booking as paid |

### Gallery

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/gallery` | List gallery images |
| `POST` | `/gallery` | Upload a new gallery image |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a question to the RAG chatbot |

**Chat request body:**
```json
{
  "message": "What decoration packages do you offer?"
}
```

**Chat response:**
```json
{
  "answer": "PR Decorations offers...",
  "chunks": [
    { "text": "...", "source": "packages.txt", "category": "services", "distance": 0.12 }
  ]
}
```

---

## ☁️ Deployment

### Render — Python FastAPI Service

| Setting | Value |
|---------|-------|
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
| **Root Directory** | `backend` |

**Environment Variables (set in Render dashboard):**
```
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

### Render — Node.js Express Service

| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Root Directory** | `backend` |

**Environment Variables:**
```
FASTAPI_SERVICE_URL=https://<your-python-service>.onrender.com
```

### Vercel — Static Frontend

| Setting | Value |
|---------|-------|
| **Framework Preset** | Other |
| **Root Directory** | `frontend` |
| **Build Command** | *(leave empty — pure static)* |
| **Output Directory** | `.` |

`config.js` automatically detects the Vercel hostname and switches to the Render API URL — no manual config needed.

---

## 🤖 AI Chatbot & RAG System

The chatbot uses a **Retrieval-Augmented Generation (RAG)** pipeline:

```
User Question
     │
     ▼
┌─────────────────┐
│   Embeddings    │  all-MiniLM-L6-v2 converts question to vector
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    ChromaDB     │  Top-K cosine-similarity search against knowledge base
└────────┬────────┘
         │  Retrieved chunks (context)
         ▼
┌─────────────────┐
│   Groq LLaMA3   │  LLM generates a grounded answer from context
└────────┬────────┘
         │
         ▼
     Answer + Source Chunks
```

### Updating the Knowledge Base

1. Add or edit `.txt` files in `data/rag_knowledge/PR_Decorations_RAG/`
2. Rebuild the vector store:
   ```bash
   cd backend
   python -m rag.vectorstore
   ```
3. Commit the updated `chroma_db/` files and push

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

ISC License © PR Decorations

---

<p align="center">Built with ❤️ for PR Decorations</p>
