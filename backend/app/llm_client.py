"""
AutoArchitect LLM Client
Handles Ollama API calls and Mermaid code extraction
"""

import requests
import json
import re
from typing import Optional

# Ollama configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3:mini"  # Change to your model if different

def prompt_to_mermaid(prompt: str) -> str:
    """
    Converts natural language prompt to Mermaid diagram code.
    
    Args:
        prompt (str): User description of system/diagram
        
    Returns:
        str: Valid Mermaid graph TD code
    """
    
    system_prompt = f"""You are a system architecture expert. Convert this description to a Mermaid flowchart:

"{prompt}"

Respond with ONLY valid Mermaid code starting with `graph TD`. 

Example format:
graph TD
A[User] --> B[Frontend]
B --> C[API Gateway]
C --> D[Database]

Rules:
- Use graph TD for flowcharts
- Create 5-8 nodes with clear labels  
- Show realistic connections/arrows
- NO explanations, NO markdown, NO text outside the code block
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": system_prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,      # Low creativity for consistent code
            "top_p": 0.9,
            "num_predict": 1024
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=45)
        response.raise_for_status()
        data = response.json()
        
        mermaid_code = data.get("response", "").strip()
        
        # Extract Mermaid code block
        mermaid_match = re.search(
            r'(graph\s+(?:TD|LR|TB|BT).*?)(?=\n\s*\n|\n\n\n|```|$)', 
            mermaid_code, 
            re.DOTALL | re.IGNORECASE
        )
        
        if mermaid_match:
            code = mermaid_match.group(1).strip()
            # Ensure it starts with graph
            if code.startswith('graph'):
                return code
            else:
                return f"graph TD\n  {code}"
        
        # Fallback: create basic diagram
        return """graph TD
  A[Your System] --> B[Database]
  C[Frontend] --> A
  D[API] --> A"""
            
    except requests.exceptions.Timeout:
        return """graph TD
  A[Timeout] --> B[Ollama slow]
  C[Try again] --> A"""
    
    except requests.exceptions.RequestException as e:
        print(f"Ollama connection error: {e}")
        return """graph TD
  ERROR[Ollama offline]
  START[Start Ollama] --> ERROR"""
    
    except Exception as e:
        print(f"LLM client error: {e}")
        return """graph TD
  A[Error occurred] --> B[Check logs]"""

def test_connection() -> bool:
    """Test if Ollama is running"""
    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        return resp.status_code == 200
    except:
        return False
