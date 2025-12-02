# End-to-End Testing Guide

## Pre-Test Checklist

### ✅ Backend Ready
- [ ] Backend `.env` file exists with `GEMINI_API_KEY` set
- [ ] Virtual environment created (`backend/venv/`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Backend server starts without errors

### ✅ Frontend Ready
- [ ] Frontend `.env` file exists with `VITE_ADK_BACKEND_URL=http://localhost:8000/api`
- [ ] Node modules installed (`npm install`)
- [ ] Frontend builds without errors

---

## Testing Workflow

### Step 1: Start Backend

```bash
# Terminal 1
cd c:\Users\Tcyber\Documents\PROJECTS\Prompt-Agent\backend
venv\Scripts\activate
python -m api.server
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verify:**
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

---

### Step 2: Start Frontend

```bash
# Terminal 2
cd c:\Users\Tcyber\Documents\PROJECTS\Prompt-Agent
npm run dev
```

**Expected Output:**
```
VITE v6.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

**Verify:**
- Frontend loads at http://localhost:3000
- No console errors in browser DevTools

---

## Feature Testing

### Test 1: Creator Agent ⚡

**Objective:** Generate a prompt from goals using ADK backend

**Steps:**
1. Navigate to **Creator** tab
2. Enter test data:
   - **Goal**: "Write a haiku about artificial intelligence"
   - **Audience**: "Software developers"
   - **Constraints**: "Traditional 5-7-5 syllable format, mention machine learning"
3. Click **Generate Prompt**

**Expected Results:**
✅ Streaming response appears
✅ Well-structured prompt with sections (Role, Task, etc.)
✅ No errors in console
✅ "Save as Template" button works
✅ "Enhance →" button works

**Backend Verification:**
- Check backend terminal for API call log
- Should see `POST /api/agents/create` request

---

### Test 2: Enhancer Agent 📋

**Objective:** Structure a prompt into logical blocks

**Steps:**
1. From Creator, click **Enhance →** (or navigate to Enhancer tab)
2. Prompt should auto-load from Creator
3. Click **Structure Prompt**

**Expected Results:**
✅ Prompt broken into blocks (ROLE, TASK, INSTRUCTION, etc.)
✅ Each block shows type tag and rationale
✅ Live Diff Preview shows comparison
✅ Toggle switches work to include/exclude blocks
✅ Copy and Save buttons functional

**Backend Verification:**
- Check terminal: `POST /api/agents/enhance`
- Response should be JSON with blocks array

---

### Test 3: Evaluator Agent 📊

**Objective:** Score and analyze a prompt

**Steps:**
1. Send enhanced prompt to Evaluator (click **Evaluate →**)
2. Or paste any prompt in Evaluator tab
3. Click **Evaluate Prompt**

**Expected Results:**
✅ Score bars appear for each criterion (Clarity, Specificity, etc.)
✅ Radar chart displays correctly
✅ Potential Risks section populated
✅ Optimization Suggestions listed (2-4 items)
✅ "Optimize with Suggestions →" button enabled

**Backend Verification:**
- Check terminal: `POST /api/agents/evaluate`
- Response has scores, risks, and suggestions

---

### Test 4: Optimizer Agent 🔄

**Objective:** Generate improved variations

**Steps:**
1. From Evaluator, click **Optimize with Suggestions →**
2. Suggestions should auto-load
3. Observe automatic variation generation (or adjust count and regenerate)

**Expected Results:**
✅ 3 variations appear (or specified count)
✅ Each variation has prompt text + rationale
✅ Enhance/Evaluate buttons on each card work
✅ Copy button works
✅ Save as Template works

**Backend Verification:**
- Check terminal: `POST /api/agents/optimize`
- Request includes suggestions array
- Response has variations array

---

### Test 5: Playground Agent 🎮

**Objective:** Test prompts with variable interpolation

**Steps:**
1. Create or paste a prompt with variables: `"Explain {{topic}} to a {{audience}} using {{style}}"`
2. Fill in variable values:
   - **topic**: "quantum computing"
   - **audience**: "high school students"
   - **style**: "simple analogies"
3. Click **Run Prompt**

**Expected Results:**
✅ Variables detected and input fields appear
✅ Streaming response in Result A panel
✅ Output makes sense with interpolated variables
✅ Copy button works
✅ Compare Mode toggle works (runs twice when enabled)

**Backend Verification:**
- Check terminal: `POST /api/agents/test`
- Request includes prompt and variables object

---

### Test 6: Cross-Agent Workflows 🔗

**Objective:** Verify agent-to-agent navigation

**Workflow 1: Creator → Enhancer → Evaluator → Optimizer**
1. ✅ Create prompt in Creator
2. ✅ Send to Enhancer
3. ✅ From Enhancer, send to Evaluator
4. ✅ From Evaluator, optimize with suggestions
5. ✅ Save best variation as template

**Workflow 2: Library → Playground**
1. ✅ Save a prompt as template
2. ✅ Go to Templates panel
3. ✅ Load template into Playground
4. ✅ Test with variables

**Workflow 3: Compare Mode Testing**
1. ✅ Enable Compare Mode in Playground
2. ✅ Run same prompt twice
3. ✅ Verify both Result A and Result B populate
4. ✅ Copy from each independently

---

## Performance Testing

### Streaming Performance
**Test:** Creator Agent with complex goal
- ✅ Streaming starts within 2 seconds
- ✅ Text appears smoothly
- ✅ No UI freezing during streaming

### API Responsiveness
**Test:** Rapid successive requests
- ✅ Click Evaluate → immediate feedback (loading state)
- ✅ Backend handles multiple requests
- ✅ No 500 errors

### Error Handling
**Test:** Invalid scenarios
1. ✅ Empty prompt → Shows validation error
2. ✅ Backend offline → Clear error message to user
3. ✅ Missing variables → Error in Playground

---

## Browser Testing

### Chrome/Edge
- [ ] All features work
- [ ] No console errors
- [ ] Streaming works smoothly

### Firefox
- [ ] All features work
- [ ] No console errors

### Dark Mode
- [ ] Toggle dark mode
- [ ] All components render properly
- [ ] Charts visible in both modes

---

## Backend API Testing (Direct)

Use these curl commands to test backend independently:

### Test Creator Agent
```bash
curl -X POST http://localhost:8000/api/agents/create `
  -H "Content-Type: application/json" `
  -d "{\"goal\":\"Test\",\"audience\":\"Developers\",\"constraints\":\"Brief\"}"
```

### Test Enhancer Agent
```bash
curl -X POST http://localhost:8000/api/agents/enhance `
  -H "Content-Type: application/json" `
  -d "{\"prompt\":\"You are a helpful assistant.\"}"
```

### Test Evaluator Agent
```bash
curl -X POST http://localhost:8000/api/agents/evaluate `
  -H "Content-Type: application/json" `
  -d "{\"prompt\":\"Write a story about robots.\"}"
```

### Test Optimizer Agent
```bash
curl -X POST http://localhost:8000/api/agents/optimize `
  -H "Content-Type: application/json" `
  -d "{\"prompt\":\"Test\",\"count\":2,\"suggestions\":[\"Add examples\"]}"
```

### Test Playground Agent
```bash
curl -X POST http://localhost:8000/api/agents/test `
  -H "Content-Type: application/json" `
  -d "{\"prompt\":\"Hello {{name}}\",\"variables\":{\"name\":\"World\"}}"
```

---

## Troubleshooting

### Backend Won't Start

**Error**: `ModuleNotFoundError: No module named 'fastapi'`
**Solution**:
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

---

**Error**: `API key not configured`
**Solution**: Check `backend/.env` has `GEMINI_API_KEY=your-key`

---

### Frontend Can't Reach Backend

**Error**: `Failed to fetch` or CORS errors
**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `backend/.env` has correct CORS origins:
   ```
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
3. Restart backend after changing .env

---

**Error**: `VITE_ADK_BACKEND_URL is undefined`
**Solution**:
1. Create frontend `.env` file
2. Add: `VITE_ADK_BACKEND_URL=http://localhost:8000/api`
3. Restart frontend (`npm run dev`)

---

### Streaming Not Working

**Symptom**: Long wait, then all text appears at once
**Solution**:
- This is normal for some browsers/connections
- Check Network tab in DevTools
- Should see "Transfer-Encoding: chunked"

---

### Agent Returns Empty/Error Responses

**Check:**
1. Backend logs for errors
2. API key is valid and has quota
3. Model selection in Settings (use gemini-2.0-flash-exp)

---

## Success Criteria

### ✅ Backend
- [x] Server starts without errors
- [x] Health check returns 200
- [x] All 5 endpoints respond correctly
- [x] API docs accessible

### ✅ Frontend  
- [x] App loads without console errors
- [x] All 5 agents accessible
- [x] Streaming works in Creator & Playground
- [x] JSON responses parse correctly
- [x] Navigation between agents works

### ✅ Integration
- [x] Frontend successfully calls backend
- [x] Responses match expected format
- [x] Error handling works
- [x] No CORS issues

### ✅ User Experience
- [x] Workflows feel smooth
- [x] Loading states appear
- [x] Errors are user-friendly
- [x] Save/copy functions work

---

## Production Readiness Checklist

### Before Deploying
- [ ] All tests passing
- [ ] Backend deployed to Cloud Run
- [ ] Frontend `.env` updated with production backend URL
- [ ] CORS configured for production frontend domain
- [ ] API key secured (not in code)
- [ ] Error monitoring setup
- [ ] Usage analytics configured

---

## Testing Log Template

```
Date: ____________
Tester: ____________

Backend Status: [ ] Running  [ ] Issues
Frontend Status: [ ] Running  [ ] Issues

Creator Agent:     [ ] Pass  [ ] Fail - Notes: ____________
Enhancer Agent:    [ ] Pass  [ ] Fail - Notes: ____________
Evaluator Agent:   [ ] Pass  [ ] Fail - Notes: ____________
Optimizer Agent:   [ ] Pass  [ ] Fail - Notes: ____________
Playground Agent:  [ ] Pass  [ ] Fail - Notes: ____________

Cross-Agent Flow:  [ ] Pass  [ ] Fail - Notes: ____________

Issues Found:
1. ____________
2. ____________

Overall: [ ] Ready for Production  [ ] Needs Work
```

---

**Status**: Ready for testing! Follow the steps above to verify the complete integration.
