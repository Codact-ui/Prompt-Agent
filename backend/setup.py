#!/usr/bin/env python3
"""Setup script for initializing the backend environment."""
import os
import sys
import subprocess
import shutil
from pathlib import Path


def print_step(message: str):
    """Print a step message."""
    print(f"\n{'='*60}")
    print(f"  {message}")
    print(f"{'='*60}\n")


def check_python_version():
    """Check if Python version is 3.11+."""
    if sys.version_info < (3, 11):
        print("❌ Python 3.11 or higher is required!")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")


def create_venv():
    """Create virtual environment."""
    print_step("Creating Virtual Environment")
    
    venv_path = Path("venv")
    if venv_path.exists():
        print("⚠️  Virtual environment already exists. Skipping creation.")
        return
    
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("✅ Virtual environment created successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create virtual environment: {e}")
        sys.exit(1)


def get_venv_python():
    """Get path to Python in virtual environment."""
    if os.name == "nt":  # Windows
        return Path("venv") / "Scripts" / "python.exe"
    else:  # macOS/Linux
        return Path("venv") / "bin" / "python"


def install_dependencies():
    """Install Python dependencies."""
    print_step("Installing Dependencies")
    
    python_path = get_venv_python()
    
    try:
        subprocess.run(
            [str(python_path), "-m", "pip", "install", "--upgrade", "pip"],
            check=True
        )
        subprocess.run(
            [str(python_path), "-m", "pip", "install", "-r", "requirements.txt"],
            check=True
        )
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)


def setup_env_file():
    """Setup .env file from example."""
    print_step("Setting Up Environment Variables")
    
    env_path = Path(".env")
    env_example_path = Path(".env.example")
    
    if env_path.exists():
        print("⚠️  .env file already exists. Skipping creation.")
        print("   Please update it manually with your credentials.")
    else:
        if env_example_path.exists():
            shutil.copy(env_example_path, env_path)
            print("✅ .env file created from .env.example")
            print("\n⚠️  IMPORTANT: Edit .env file with your credentials:")
            print("   - For development: Add GEMINI_API_KEY")
            print("   - For production: Add GOOGLE_CLOUD_PROJECT and credentials")
        else:
            print("❌ .env.example not found!")


def print_next_steps():
    """Print next steps for the user."""
    print_step("Setup Complete! 🎉")
    
    print("Next Steps:\n")
    print("1. Activate the virtual environment:")
    if os.name == "nt":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    
    print("\n2. Configure your .env file:")
    print("   - Open backend/.env in a text editor")
    print("   - Add your GEMINI_API_KEY or Google Cloud credentials")
    
    print("\n3. Run the server:")
    print("   python -m api.server")
    print("   # Or use uvicorn directly:")
    print("   uvicorn api.server:app --reload")
    
    print("\n4. Test the API:")
    print("   Visit http://localhost:8000/docs")
    print("   Or check health: http://localhost:8000/health")
    
    print("\n5. Read the docs:")
    print("   See backend/README.md for detailed information")
    
    print("\n" + "="*60)


def main():
    """Main setup function."""
    print("\n")
    print("╔════════════════════════════════════════════════════════╗")
    print("║   Prompt Engineering ADK Backend Setup                ║")
    print("╚════════════════════════════════════════════════════════╝")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    check_python_version()
    create_venv()
    install_dependencies()
    setup_env_file()
    print_next_steps()


if __name__ == "__main__":
    main()
