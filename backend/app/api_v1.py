import httpx
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["diagram"])

# --- Models ---
class DiagramRequest(BaseModel):
    prompt: str

class RefineRequest(BaseModel):
    current_mermaid: str
    instruction: str

class DiagramResponse(BaseModel):
    mermaid: str

# --- Endpoints ---

@router.post("/diagram/generate", response_model=DiagramResponse)
async def generate_diagram(req: DiagramRequest):
    system_prompt = (
        "You are a software architect. Convert the requirements into a valid Mermaid.js diagram. "
        "Return ONLY the code starting with 'graph TD', 'graph LR', 'erDiagram', or 'classDiagram'. "
        "No explanations, no conversational filler."
    )
    return await call_ollama(f"{system_prompt}\n\nUser Request: {req.prompt}")

@router.post("/diagram/refine", response_model=DiagramResponse)
async def refine_diagram(req: RefineRequest):
    refine_prompt = (
        "Modify the existing Mermaid code based on the instruction. "
        "Current Code:\n"
        f"```mermaid\n{req.current_mermaid}\n```\n"
        f"Instruction: {req.instruction}\n"
        "Return ONLY the updated code. No explanations."
    )
    return await call_ollama(refine_prompt)

# --- Robust AI Helper Function ---

# Change the model name in your helper function
async def call_ollama(full_prompt: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5-coder:1.5b",  # Updated model name here
                    "prompt": full_prompt,
                    "stream": False
                },
                timeout=45.0 
            )
            # ... keep the rest of your parsing logic the same
            result = response.json()
            raw_content = result.get("response", "").strip()
            
            # --- THE FIX: ROBUST PARSING LOGIC ---
            
            # 1. Search for code inside triple backticks (```mermaid ... ```)
            code_match = re.search(r"```(?:mermaid)?\n?(.*?)```", raw_content, re.DOTALL)
            
            if code_match:
                clean_code = code_match.group(1).strip()
            else:
                # 2. Fallback: Find the first occurrence of a Mermaid keyword
                keywords = ["graph TD", "graph LR", "erDiagram", "classDiagram", "sequenceDiagram"]
                clean_code = raw_content
                for kw in keywords:
                    if kw in raw_content:
                        # Slice from the keyword to the end of the text
                        clean_code = raw_content[raw_content.find(kw):]
                        break
            
            # 3. Clean up trailing "Note:" or "Explanation:" if they exist outside backticks
            clean_code = re.split(r'\n\n[A-Z]', clean_code)[0].strip()

            return DiagramResponse(mermaid=clean_code)
            
    except Exception as e:
        print(f"Ollama Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")