# Prompt Optimizer Agent

A powerful, intelligent workspace designed to iteratively create, enhance, evaluate, and optimize prompts for Large Language Models (LLMs). Inspired by a minimalist, Notion-like UI, this application features a **Google ADK (Agent Development Kit)** powered backend with true multi-agent orchestration.

## 🏗️ Architecture

### **Frontend** (React + TypeScript + Vite)
Beautiful, responsive UI with 5 specialized agent interfaces and modern tooling

### **Backend** (Python + Google ADK) ✨
Production-ready multi-agent system with:
- 6 ADK-powered agents (Creator, Enhancer, Evaluator, Optimizer, Playground + Coordinator)
- FastAPI server with async/streaming support
- Type-safe API with Pydantic models
- SQLite database for prompt management
- Deployment-ready (Docker, Cloud Run)
- MCP (Model Context Protocol) server integration support

**[📖 Backend Documentation](backend/README.md)** | **[🚀 Quick Start](#-quick-start)**

---

## 🚀 Features

The application consists of five specialized agents and a suite of productivity tools:

### 🤖 The Agents

1.  **Creator Agent**
    *   **Goal:** Turn simple intents into structured prompts.
    *   **Functionality:** Takes a goal, audience, and constraints to generate a comprehensive prompt using best practices.
    *   **Capabilities:** Supports **Google Search Grounding** to fetch up-to-date information for prompt generation.
    *   **Backend:** Powered by ADK `LlmAgent` with optional Google Search tool

2.  **Enhancer Agent**
    *   **Goal:** Improve structure and clarity.
    *   **Functionality:** Analyzes an existing prompt and breaks it down into clear, logical blocks (Role, Task, Context, etc.).
    *   **Features:** Live **Diff Viewer** to compare changes and an \"Auto-Generate Examples\" feature for few-shot learning.
    *   **Backend:** ADK agent specialized in prompt structure analysis

3.  **Evaluator Agent**
    *   **Goal:** Score and risk-assess prompts.
    *   **Functionality:** Grades your prompt (0-100) based on customizable criteria (e.g., Clarity, Specificity, Safety).
    *   **Visuals:** Provides a Radar Chart visualization and identifies specific risks and weaknesses.
    *   **Backend:** Uses Gemini thinking mode for deep analysis

4.  **Optimizer Agent**
    *   **Goal:** Evolution and refinement.
    *   **Functionality:** Takes feedback from the Evaluator and generates multiple improved variations of your prompt.
    *   **Workflow:** Allows you to iterate rapidly until you find the perfect version.
    *   **Backend:** ADK agent with thinking mode for optimization strategies

5.  **Playground Agent**
    *   **Goal:** Testing and Verification.
    *   **Functionality:** Run your prompts against the actual model with real variables.
    *   **Features:** **A/B Testing (Compare Mode)** to run two prompts side-by-side to verify improvements.
    *   **Backend:** Variable interpolation with secure server-side execution

### 🛠️ Productivity Tools

*   **Prompt Library:** A robust management system to tag, search, sort, and edit your prompt templates.
*   **Session History:** Automatically saves every generation, evaluation, and test run.
*   **Markdown Support:** Rich text rendering for all model outputs.
*   **Data Management:** Full Import/Export capabilities for your templates and history (JSON format).
*   **Dark Mode:** Fully responsive UI with light and dark themes.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and **pnpm** (recommended) or npm
- **Python** 3.11+
- **Gemini API Key** (get it from [Google AI Studio](https://aistudio.google.com/)) OR Google Cloud credentials

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run automated setup script
python setup.py
```

The setup script will:
- Create a Python virtual environment
- Install all dependencies
- Guide you through API key configuration
- Initialize the database
- Start the server on `http://localhost:8000`

**Manual Setup** (if you prefer):
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt

# Create .env file with your API key
echo "GOOGLE_API_KEY=your_api_key_here" > .env

# Initialize database
python init_db.py

# Start server
uvicorn api.server:app --reload
```

### 2. Frontend Setup

```bash
# From project root
pnpm install  # or npm install

# Create .env file
echo "VITE_ADK_BACKEND_URL=http://localhost:8000/api" > .env
echo "VITE_USE_ADK_BACKEND=true" >> .env

# Start development server
pnpm dev  # or npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

### 3. Verify Setup

1. Open the Creator Agent
2. Enter a simple goal (e.g., "Create a blog post about AI")
3. Click "Generate Prompt"
4. If you see a formatted prompt response, you're all set! 🎉

## ⚙️ Configuration

### Backend Setup (ADK)

**Quick Start**:
```bash
cd backend
python setup.py
```

See [backend/README.md](backend/README.md) for detailed setup instructions.

**Requirements**:
- Python 3.11+
- Gemini API key OR Google Cloud credentials

### Frontend Setup

**Requirements**:
- Node.js 16+
- Backend server running (or direct API key for legacy mode)

### Global Settings
Access the **Settings** panel to configure:
*   **Model Selection:** Switch between `gemini-2.5-flash` (Fast) and `gemini-3-pro-preview` (Reasoning).
*   **Temperature:** Control the creativity of the agents.
*   **Custom Rubrics:** Define your own evaluation criteria for the Evaluator Agent.

### API Key
The application can run in two modes:
*   **ADK Backend Mode** (Recommended): Frontend connects to ADK backend server
*   **Legacy Mode**: Direct Gemini API integration via `process.env.API_KEY`

## 📦 Tech Stack

### Frontend
*   **Framework:** React 19, TypeScript
*   **Styling:** Tailwind CSS (Notion-inspired design system)
*   **Visualization:** Recharts
*   **Utilities:** `diff-match-patch`, `react-markdown`

### Backend (Google ADK) ✨ NEW!
*   **Framework:** Google Agent Development Kit (ADK) Python
*   **Server:** FastAPI with async/streaming support
*   **AI Models:** Gemini 2.0 Flash (standard) + Gemini 2.0 Flash Thinking (analysis)
*   **Type Safety:** Pydantic models throughout
*   **Deployment:** Docker, Cloud Run ready
*   **Tools:** Google Search, Variable Interpolation

## 📖 Usage Guide

1.  **Start in the Creator:** Define what you want.
2.  **Move to Enhancer:** If the result is unstructured, let the Enhancer organize it.
3.  **Check in Evaluator:** Get a score. If it's low, check the suggestions.
4.  **Refine in Optimizer:** Use those suggestions to generate better versions.
5.  **Test in Playground:** Verify the output with real inputs and variables (e.g., `{{topic}}`).
6.  **Save to Library:** Store the winner for future use.

## 🤝 Contributing

This project is a full-stack application with separate frontend and backend.

### Frontend (React)
*   **Agents UI** are located in `components/agents/`
*   **Services** for API interaction are in `services/geminiService.ts`
*   **Global State** is managed via React Context (`SettingsContext`, `ThemeContext`)

### Backend (Python ADK)
*   **Agents** are in `backend/agents/` - Each agent is a separate LlmAgent implementation
*   **API Routes** are in `backend/api/routes.py`
*   **Tools** are in `backend/tools/`
*   See `backend/README.md` for development setup

## 🗂️ Project Structure

```
Prompt-Agent/
├── components/              # React UI components
│   ├── agents/             # Agent-specific interfaces
│   ├── AppBar.tsx          # Top navigation
│   ├── PromptLibrary.tsx   # Template management
│   └── ...
│
├── services/               # API integration layer
│   ├── adkService.ts       # ADK backend client
│   └── geminiService.ts    # Legacy Gemini client
│
├── contexts/               # React Context providers
│   ├── SettingsContext.tsx # Global settings
│   └── ThemeContext.tsx    # Dark/light mode
│
├── backend/                # ✨ Python ADK backend
│   ├── agents/             # ADK LlmAgent implementations
│   │   ├── creator_agent.py
│   │   ├── enhancer_agent.py
│   │   ├── evaluator_agent.py
│   │   ├── optimizer_agent.py
│   │   └── playground_agent.py
│   ├── api/                # FastAPI server & routes
│   │   ├── server.py       # Main FastAPI app
│   │   ├── routes.py       # Agent endpoints
│   │   └── data_routes.py  # Database CRUD
│   ├── database/           # SQLite ORM & models
│   ├── tools/              # Utility tools
│   ├── config/             # Configuration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── .env.example            # Environment template
├── package.json
└── README.md               # This file
```

## 🚀 Deployment

### Docker Deployment

Build and run with Docker:

```bash
# Backend
cd backend
docker build -t prompt-agent-backend .
docker run -p 8000:8000 --env-file .env prompt-agent-backend

# Frontend (create Dockerfile first)
# TODO: Add frontend Dockerfile
```

### Google Cloud Run

Deploy the backend to Cloud Run:

```bash
cd backend

# Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/prompt-agent-backend

# Deploy to Cloud Run
gcloud run deploy prompt-agent-backend \
  --image gcr.io/YOUR_PROJECT_ID/prompt-agent-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your_key_here
```

### Environment Variables

#### Backend (.env in `backend/`)
```bash
GOOGLE_API_KEY=your_gemini_api_key
PORT=8000  # Optional, defaults to 8000
```

#### Frontend (.env in root)
```bash
VITE_ADK_BACKEND_URL=http://localhost:8000/api
VITE_USE_ADK_BACKEND=true
```

## 📚 Resources

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Backend Setup Guide](backend/README.md)
- [Implementation Plan](docs/implementation_plan.md)
- [Gemini API Documentation](https://ai.google.dev/)

## 📄 License

MIT License
