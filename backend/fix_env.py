
import os

env_path = '.env'
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    with open(env_path, 'w') as f:
        for line in lines:
            if line.strip().startswith('CORS_ORIGINS='):
                f.write('CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]\n')
            else:
                f.write(line)
    print("Successfully updated .env")
else:
    print(".env file not found")
