# Prompt Engineering ADK Backend

Google ADK-powered backend for the Prompt Optimizer Agent application.

## Features

- **Multi-Agent Architecture**: Specialized agents for prompt creation, enhancement, evaluation, optimization, and testing
- **Google ADK Framework**: Built on Google's Agent Development Kit for robust agent orchestration
- **FastAPI Server**: High-performance async API with automatic documentation
- **Streaming Support**: Real-time streaming responses for better UX
- **Type-Safe**: Full type safety with Pydantic models

## Architecture

### Agents

1. **Creator Agent** (`agents/creator_agent.py`)
   - Generates comprehensive prompts from goals, audience, and constraints
   - Optional Google Search grounding for factual prompts

2. **Enhancer Agent** (`agents/enhancer_agent.py`)
   - Structures prompts into logical blocks (ROLE, TASK, INSTRUCTION, etc.)
   - Provides rationales for structural improvements

3. **Evaluator Agent** (`agents/evaluator_agent.py`)
   - Scores prompts against customizable criteria
   - Identifies risks and provides optimization suggestions
   - Uses Gemini's thinking mode for deep analysis

4. **Optimizer Agent** (`agents/optimizer_agent.py`)
   - Generates improved prompt variations based on feedback
   - Creates distinct approaches addressing different concerns

5. **Playground Agent** (`agents/playground_agent.py`)
   - Tests prompts with variable interpolation
   - Returns natural LLM responses

6. **Coordinator Agent** (`agents/coordinator.py`)
   - Parent agent orchestrating all specialized agents
   - Enables complex multi-agent workflows

## Setup

### Prerequisites

- Python 3.11 or higher
- Google Cloud account (for production) OR Gemini API key (for development)

### Installation

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   # Copy example env file
   copy .env.example .env  # Windows
   # cp .env.example .env  # macOS/Linux
   
   # Edit .env with your credentials
   ```

### Environment Variables

**Option 1: Google Cloud (Production)**
```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

**Option 2: Gemini API Key (Development)**
```env
GEMINI_API_KEY=your-gemini-api-key
```

**API Configuration**
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=8000
ENVIRONMENT=development
```

## Running the Server

### Development Mode

```bash
# With auto-reload
uvicorn api.server:app --reload --port 8000

# Or use Python directly
python -m api.server
```

The server will start at `http://localhost:8000`

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### Production Mode

```bash
# Using Docker
docker build -t prompt-agent-adk .
docker run -p 8000:8000 --env-file .env prompt-agent-adk

# Or directly with uvicorn
uvicorn api.server:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### POST `/api/agents/create`
Create a new prompt from goals and constraints.

**Request**:
```json
{
  "goal": "Generate a marketing slogan",
  "audience": "Tech-savvy millennials",
  "constraints": "Under 10 words, mention AI",
  "use_search": false
}
```

**Response**: Streaming text

---

### POST `/api/agents/enhance`
Structure a prompt into logical blocks.

**Request**:
```json
{
  "prompt": "Write a story about a robot"
}
```

**Response**:
```json
{
  "blocks": [
    {
      "id": "...",
      "type": "ROLE",
      "content": "...",
      "rationale": "..."
    }
  ]
}
```

---

### POST `/api/agents/evaluate`
Evaluate a prompt against criteria.

**Request**:
```json
{
  "prompt": "...",
  "custom_rubric": "Clarity, Creativity, Safety"
}
```

**Response**:
```json
{
  "scores": [...],
  "risks": [...],
  "suggestions": [...]
}
```

---

### POST `/api/agents/optimize`
Generate improved prompt variations.

**Request**:
```json
{
  "prompt": "...",
  "count": 3,
  "suggestions": ["Add examples", "Be more specific"]
}
```

**Response**:
```json
{
  "variations": [
    {
      "id": "...",
      "prompt": "...",
      "rationale": "..."
    }
  ]
}
```

---

### POST `/api/agents/test`
Test a prompt with variables.

**Request**:
```json
{
  "prompt": "Write a {{genre}} story about {{topic}}",
  "variables": {
    "genre": "sci-fi",
    "topic": "time travel"
  }
}
```

**Response**: Streaming text

## Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_agents.py

# Run with coverage
pytest --cov=backend
```

## Deployment

### Deploy to Google Cloud Run

```bash
# Build and deploy
gcloud run deploy prompt-agent-adk \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production

# Update CORS origins after deployment
gcloud run services update prompt-agent-adk \
  --set-env-vars CORS_ORIGINS=https://your-frontend.com
```

### Deploy to Vertex AI Agent Engine

See [ADK Deployment Guide](https://google.github.io/adk-docs/deploy/) for detailed instructions.

## Project Structure

```
backend/
├── agents/           # ADK agent implementations
│   ├── creator_agent.py
│   ├── enhancer_agent.py
│   ├── evaluator_agent.py
│   ├── optimizer_agent.py
│   ├── playground_agent.py
│   └── coordinator.py
├── api/              # FastAPI server and routes
│   ├── server.py
│   ├── routes.py
│   └── models.py
├── config/           # Configuration management
│   └── settings.py
├── tools/            # Utility tools
│   └── variable_tool.py
├── tests/            # Test suite
├── requirements.txt
├── Dockerfile
└── README.md
```

## Troubleshooting

### Import Errors

If you see `ModuleNotFoundError`:
```bash
# Ensure you're in the backend directory
cd backend

# Or add parent directory to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/path/to/Prompt-Agent"
```

### Google Cloud Authentication

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Create service account key
gcloud iam service-accounts keys create key.json \
  --iam-account=YOUR_SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com
```

### CORS Issues

Update `CORS_ORIGINS` in `.env` to match your frontend URL:
```env
CORS_ORIGINS=http://localhost:5173,https://your-frontend.com
```

## Resources

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

## License

MIT License - see main project README
