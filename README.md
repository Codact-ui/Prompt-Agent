# Prompt Optimizer Agent

A powerful, intelligent workspace designed to iteratively create, enhance, evaluate, and optimize prompts for Large Language Models (LLMs). Inspired by a minimalist, Notion-like UI, this application leverages the **Google Gemini API** to act as your personal prompt engineering team.

## 🚀 Features

The application consists of five specialized agents and a suite of productivity tools:

### 🤖 The Agents

1.  **Creator Agent**
    *   **Goal:** Turn simple intents into structured prompts.
    *   **Functionality:** Takes a goal, audience, and constraints to generate a comprehensive prompt using best practices.
    *   **Capabilities:** Supports **Google Search Grounding** to fetch up-to-date information for prompt generation.

2.  **Enhancer Agent**
    *   **Goal:** Improve structure and clarity.
    *   **Functionality:** Analyzes an existing prompt and breaks it down into clear, logical blocks (Role, Task, Context, etc.).
    *   **Features:** Live **Diff Viewer** to compare changes and an "Auto-Generate Examples" feature for few-shot learning.

3.  **Evaluator Agent**
    *   **Goal:** Score and risk-assess prompts.
    *   **Functionality:** Grades your prompt (0-100) based on customizable criteria (e.g., Clarity, Specificity, Safety).
    *   **Visuals:** Provides a Radar Chart visualization and identifies specific risks and weaknesses.

4.  **Optimizer Agent**
    *   **Goal:** Evolution and refinement.
    *   **Functionality:** Takes feedback from the Evaluator and generates multiple improved variations of your prompt.
    *   **Workflow:** Allows you to iterate rapidly until you find the perfect version.

5.  **Playground Agent**
    *   **Goal:** Testing and Verification.
    *   **Functionality:** Run your prompts against the actual model with real variables.
    *   **Features:** **A/B Testing (Compare Mode)** to run two prompts side-by-side to verify improvements.

### 🛠️ Productivity Tools

*   **Prompt Library:** A robust management system to tag, search, sort, and edit your prompt templates.
*   **Session History:** Automatically saves every generation, evaluation, and test run.
*   **Markdown Support:** Rich text rendering for all model outputs.
*   **Data Management:** Full Import/Export capabilities for your templates and history (JSON format).
*   **Dark Mode:** Fully responsive UI with light and dark themes.

## ⚙️ Configuration

### Global Settings
Access the **Settings** panel to configure:
*   **Model Selection:** Switch between `gemini-2.5-flash` (Fast) and `gemini-3-pro-preview` (Reasoning).
*   **Temperature:** Control the creativity of the agents.
*   **Custom Rubrics:** Define your own evaluation criteria for the Evaluator Agent.

### API Key
The application requires a **Google Gemini API Key**.
*   The key is loaded via `process.env.API_KEY`.
*   Ensure your environment is configured with a valid key that has access to the Gemini API.

## 📦 Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (Notion-inspired design system)
*   **AI Integration:** `@google/genai` SDK
*   **Visualization:** Recharts
*   **Utilities:** `diff-match-patch`, `react-markdown`

## 📖 Usage Guide

1.  **Start in the Creator:** Define what you want.
2.  **Move to Enhancer:** If the result is unstructured, let the Enhancer organize it.
3.  **Check in Evaluator:** Get a score. If it's low, check the suggestions.
4.  **Refine in Optimizer:** Use those suggestions to generate better versions.
5.  **Test in Playground:** Verify the output with real inputs and variables (e.g., `{{topic}}`).
6.  **Save to Library:** Store the winner for future use.

## 🤝 Contributing

This project is a modular React application.
*   **Agents** are located in `components/agents/`.
*   **Services** for AI interaction are in `services/geminiService.ts`.
*   **Global State** is managed via React Context (`SettingsContext`, `ThemeContext`).

## 📄 License

MIT License
