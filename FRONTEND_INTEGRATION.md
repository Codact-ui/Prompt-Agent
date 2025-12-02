# Frontend Integration Guide

## Overview

This guide explains how to migrate the frontend from direct Gemini API calls to the ADK backend.

## Migration Strategy

We've created a **parallel implementation** approach:
- ✅ New `adkService.ts` created (ADK backend integration)
- ✅ Old `geminiService.ts` still exists (legacy direct API)
- Choose which to use by importing the appropriate service

## Option 1: Quick Switch (Recommended)

### Step 1: Create `.env` file

```bash
# In project root (Prompt-Agent/)
copy .env.example .env
```

Edit `.env`:
```env
VITE_ADK_BACKEND_URL=http://localhost:8000/api
```

### Step 2: Update Imports

Replace `geminiService` imports with `adkService`:

**Before**:
```typescript
import { streamCreatePrompt } from '../services/geminiService';
```

**After**:
```typescript
import { streamCreatePrompt } from '../services/adkService';
```

**Files to Update**:
- `components/agents/CreatorAgent.tsx`
- `components/agents/EnhancerAgent.tsx`
- `components/agents/EvaluatorAgent.tsx`
- `components/agents/OptimizerAgent.tsx`
- `components/agents/PlaygroundAgent.tsx`

### Step 3: Start Backend

```bash
cd backend
venv\Scripts\activate
python -m api.server
```

### Step 4: Start Frontend

```bash
# In project root
npm run dev
```

Visit http://localhost:3000 (or your configured port)

---

## Option 2: Gradual Migration

Keep both services and use a feature flag:

### Create `services/agentService.ts`:

```typescript
import * as adkService from './adkService';
import * as geminiService from './geminiService';

// Feature flag for using ADK backend
const USE_ADK_BACKEND = import.meta.env.VITE_USE_ADK_BACKEND === 'true';

export const streamCreatePrompt = USE_ADK_BACKEND 
  ? adkService.streamCreatePrompt 
  : geminiService.streamCreatePrompt;

export const enhancePrompt = USE_ADK_BACKEND
  ? adkService.enhancePrompt
  : geminiService.enhancePrompt;

// ... export all other functions
```

Then set in `.env`:
```env
VITE_USE_ADK_BACKEND=true  # or false for legacy mode
```

---

## Comparison: ADK vs Direct API

| Feature | Direct Gemini API | ADK Backend |
|---------|-------------------|-------------|
| Setup | Simple | Requires backend server |
| Scalability | Limited | High (multi-agent) |
| Tools | Limited | Extensible |
| Monitoring | Client-side only | Server-side logs |
| Cost Control | Client manages | Server controls |
| Security | API key in client | API key in server |
| Multi-Agent | No | Yes |
| Deployment | Frontend only | Full stack |

---

## Testing the Integration

### 1. Test Creator Agent
1. Go to Creator tab
2. Enter goal: "Write a haiku about coding"
3. Click "Generate Prompt"
4. Verify streaming works

### 2. Test Enhancer Agent
1. Go to Enhancer tab  
2. Paste a prompt
3. Click "Enhance"
4. Verify blocks are returned

### 3. Test Evaluator Agent
1. Go to Evaluator tab
2. Paste a prompt
3. Click "Evaluate"
4. Verify scores, risks, and suggestions appear

### 4. Test Optimizer Agent
1. After evaluation, click "Optimize with Suggestions"
2. Verify multiple variations are generated

### 5. Test Playground Agent
1. Go to Playground tab
2. Enter a prompt with variables: `"Explain {{topic}} to a {{audience}}"`
3. Fill in variables
4. Click "Run"
5. Verify streaming result

---

## Environment Variables Reference

### Frontend `.env`
```env
# ADK Backend URL (required for ADK mode)
VITE_ADK_BACKEND_URL=http://localhost:8000/api

# Legacy Gemini API Key (optional, for direct API mode)
GEMINI_API_KEY=your-api-key-here
```

### Backend `.env`
```env
# Gemini API Key (required)
GEMINI_API_KEY=your-api-key-here

# CORS Origins (include your frontend URL)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Server Port
PORT=8000

# Environment
ENVIRONMENT=development
```

---

## Troubleshooting

### ❌ "Failed to fetch" errors

**Problem**: Frontend can't reach backend

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS origins in `backend/.env`
3. Verify `VITE_ADK_BACKEND_URL` in frontend `.env`

### ❌ CORS errors in browser console

**Problem**: CORS not configured correctly

**Solution**:
Edit `backend/.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```
Restart backend server.

### ❌ "No streaming response" errors

**Problem**: Response body not readable

**Solution**:
- Check backend logs for errors
- Verify endpoint returns StreamingResponse
- Check network tab in browser DevTools

### ❌ Type errors after migration

**Problem**: Types don't match between services

**Solution**:
Both `adkService` and `geminiService` use the same types from `types.ts`, so interfaces should match. If errors persist, check that backend API responses match expected types.

---

## API Endpoint Reference

All ADK backend endpoints (base: `http://localhost:8000/api`):

| Endpoint | Method | Request | Response | Type |
|----------|--------|---------|----------|------|
| `/agents/create` | POST | `{goal, audience, constraints, use_search}` | Text | Stream |
| `/agents/enhance` | POST | `{prompt}` | `{blocks}` | JSON |
| `/agents/evaluate` | POST | `{prompt, custom_rubric?}` | `{scores, risks, suggestions}` | JSON |
| `/agents/optimize` | POST | `{prompt, count, suggestions}` | `{variations}` | JSON |
| `/agents/test` | POST | `{prompt, variables}` | Text | Stream |
| `/agents/few-shot` | POST | `{prompt, count}` | `{examples}` | JSON |

---

## Performance Comparison

### Direct API (geminiService)
- ⏱️ Latency: ~500-1000ms (depends on internet)
- 🔄 Retries: Manual implementation
- 📊 Monitoring: Console logs only
- 🔐 Security: API key exposed client-side

### ADK Backend (adkService)
- ⏱️ Latency: ~600-1200ms (extra hop to backend)
- 🔄 Retries: Handled by ADK framework
- 📊 Monitoring: Server logs, metrics, traces
- 🔐 Security: API key secure on server
- ➕ Bonus: Multi-agent coordination, tool ecosystem

---

## Next Steps

### Immediate
1. ✅ Create frontend `.env` with backend URL
2. ✅ Update one component to use `adkService`
3. ✅ Test that component end-to-end
4. ✅ Repeat for all 5 agents

### Short Term
- Add error boundaries for better error handling
- Add loading states for streaming
- Add retry logic for failed requests
- Add offline detection

### Long Term
- Deploy backend to Cloud Run
- Add authentication/authorization
- Implement rate limiting
- Add usage analytics
- Create admin dashboard

---

## Rollback Plan

If you need to rollback to direct API mode:

1. **Option A**: Change imports back to `geminiService`
2. **Option B**: Use feature flag (set `VITE_USE_ADK_BACKEND=false`)
3. **Option C**: Keep both and let users choose in settings

The old `geminiService.ts` is preserved and functional!

---

## Support

- Backend API Docs: http://localhost:8000/docs
- Backend README: `backend/README.md`
- Implementation Plan: See artifacts
- Quick Start: `backend/QUICKSTART.md`

---

**Status**: Ready for migration! Choose Option 1 or Option 2 and follow the steps.
