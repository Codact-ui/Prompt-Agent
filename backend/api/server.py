"""FastAPI server for ADK backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.routes import router
from config.settings import get_settings
from database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    print("Initializing database...")
    await init_db()
    print("✅ Database initialized!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="Prompt Engineering ADK API",
    description="Google ADK-powered backend for prompt engineering agents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation Error: {exc.errors()}")
    print(f"Request Headers: {request.headers}")
    try:
        body = await request.body()
        print(f"Raw Request Body: {body.decode('utf-8')}")
    except Exception as e:
        print(f"Could not read request body: {e}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# Include API routes
from api.data_routes import router as data_router
app.include_router(router, prefix="/api")
app.include_router(data_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Prompt Engineering ADK API",
        "version": "1.0.0",
        "framework": "Google ADK",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "framework": "Google ADK",
        "environment": settings.environment
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.api.server:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development"
    )
