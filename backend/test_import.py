import sys
import os
print(f"CWD: {os.getcwd()}")
print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not Set')}")
try:
    from backend.agents.coordinator import create_coordinator_agent
    print("Import successful!")
except ImportError as e:
    print(f"Import failed: {e}")

try:
    from agents.coordinator import create_coordinator_agent
    print("Relative-ish import successful!")
except ImportError as e:
    print(f"Relative-ish import failed: {e}")
