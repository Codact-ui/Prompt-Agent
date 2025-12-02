# Prompt Optimizer Agent

A powerful, intelligent workspace designed to iteratively create, enhance, evaluate, and optimize prompts for Large Language Models (LLMs). Inspired by a minimalist, Notion-like UI, this application now features a **Google ADK (Agent Development Kit)** powered backend with true multi-agent orchestration.

## 🏗️ Architecture

### **Frontend** (React + TypeScript)
Beautiful, responsive UI with 5 specialized agent interfaces

### **Backend** (Python + Google ADK) ✨ NEW!
Production-ready multi-agent system with:
- 6 ADK-powered agents (Creator, Enhancer, Evaluator, Optimizer, Playground + Coordinator)
- FastAPI server with streaming support
- Type-safe API with Pydantic models
- Deployment-ready (Docker, Cloud Run)

**[📖 Backend Documentation](backend/README.md)** | **[🚀 Quick Start](backend/README.md#setup)**

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
├── frontend/                 # React TypeScript application
│   ├── components/
│   │   └── agents/          # Agent UI components
│   ├── services/            # API integration
│   └── ...
│
├── backend/                 # ✨ NEW: Python ADK backend
│   ├── agents/              # ADK LlmAgent implementations
│   ├── api/                 # FastAPI server & routes
│   ├── tools/               # Utility tools
│   ├── config/              # Configuration management
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md           # Backend documentation
│
└── README.md               # This file
```

## 📚 Resources

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Backend Setup Guide](backend/README.md)
- [Implementation Plan](docs/implementation_plan.md)
- [Gemini API Documentation](https://ai.google.dev/)

## 📄 License

MIT License
