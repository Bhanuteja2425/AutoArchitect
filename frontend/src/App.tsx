import { useState } from "react";
import { MermaidCanvas } from "./components/MermaidCanvas";

type DiagramResponse = {
  mermaid: string;
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [mermaidCode, setMermaidCode] = useState("graph TD\n   A[Start] --> B[End]");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("");

  const generateDiagram = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/diagram/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DiagramResponse = await res.json();
      setMermaidCode(data.mermaid);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  };

  const refineDiagram = async () => {
    if (!refineInstruction.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/diagram/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          current_mermaid: mermaidCode, 
          instruction: refineInstruction 
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DiagramResponse = await res.json();
      setMermaidCode(data.mermaid);
      setRefineInstruction("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to refine diagram");
    } finally {
      setLoading(false);
    }
  };

  const downloadSVG = () => {
    const container = document.getElementById("mermaid-diagram-container");
    const svgElement = container?.querySelector("svg");

    if (svgElement) {
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `architecture-${Date.now()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    } else {
      alert("No diagram found to download!");
    }
  };

  const colors = {
    bgApp: "#1a1c23",
    bgSidebar: "#111217",
    bgCard: "#242731",
    border: "#3a3f4b",
    textMain: "#e5e7eb",
    textMuted: "#9ca3af",
    accentBlue: "#2563eb", 
    accentGreen: "#10b981"
  };

  const cardStyle = {
    backgroundColor: colors.bgCard,
    borderRadius: "12px",
    padding: "1.25rem",
    border: `1px solid ${colors.border}`,
    marginBottom: "1.5rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
  };

  const textareaStyle = {
    width: "100%",
    backgroundColor: "#111217",
    color: colors.textMain,
    borderRadius: "8px",
    padding: "12px",
    border: `1px solid ${colors.border}`,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as "border-box",
    resize: "vertical" as "vertical"
  };

  const buttonStyle = (bgColor: string) => ({
    width: "100%",
    marginTop: "0.75rem",
    padding: "12px",
    backgroundColor: bgColor,
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "opacity 0.2s"
  });

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: colors.bgApp, color: colors.textMain, fontFamily: "system-ui", overflow: "hidden" }}>
      
      {/* Left Panel: Sidebar */}
      <div style={{ flex: "0 0 380px", padding: "2rem", borderRight: `1px solid ${colors.border}`, overflowY: "auto", backgroundColor: colors.bgSidebar }}>
        
        <div style={{ display: "flex", alignItems: "center", marginBottom: "2.5rem" }}>
          <div style={{ 
            width: "35px", 
            height: "35px", 
            backgroundColor: colors.accentBlue, 
            borderRadius: "8px", 
            marginRight: "12px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontWeight: "bold",
            color: "white",
            fontSize: "14px",
            boxShadow: `0 0 15px ${colors.accentBlue}66` 
          }}>
            AA
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: "800", margin: 0, color: "white", letterSpacing: "-0.025em" }}>AutoArchitect</h1>
        </div>
        
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: colors.textMuted, fontSize: "12px", fontWeight: "bold", marginRight: "8px", border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 6px" }}>01</span>
            <h3 style={{ margin: 0, fontSize: "0.95rem", color: "white" }}>Generate Base</h3>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe system requirements..."
            style={{ ...textareaStyle, height: "100px" }}
          />
          <button 
            style={buttonStyle(colors.accentBlue)}
            onClick={generateDiagram} 
            disabled={loading || !prompt.trim()}
          >
            {loading ? "Thinking..." : "Create Blueprint"}
          </button>
        </div>

        <div style={{ ...cardStyle, borderLeft: `4px solid ${colors.accentGreen}` }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: colors.accentGreen, fontSize: "12px", fontWeight: "bold", marginRight: "8px", border: `1px solid ${colors.accentGreen}44`, borderRadius: "4px", padding: "2px 6px" }}>02</span>
            <h3 style={{ margin: 0, fontSize: "0.95rem", color: "white" }}>Refine Design</h3>
          </div>
          <textarea
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            placeholder="e.g., Add a database node..."
            style={{ ...textareaStyle, height: "80px" }}
          />
          <button 
            style={buttonStyle(colors.accentGreen)}
            onClick={refineDiagram} 
            disabled={loading || !refineInstruction.trim()}
          >
            {loading ? "Refining..." : "Update Design"}
          </button>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: "14px", marginBottom: "1rem" }}>{error}</div>}

        <h3 style={{ fontSize: "0.9rem", color: colors.textMuted, marginBottom: "0.5rem" }}>Manual Editor</h3>
        <textarea
          value={mermaidCode}
          onChange={(e) => setMermaidCode(e.target.value)}
          style={{ ...textareaStyle, height: "120px", fontFamily: "monospace", fontSize: "11px", opacity: 0.7 }}
        />
      </div>

      {/* Right Panel: Visualization Canvas */}
      <div style={{ 
        flex: 1, 
        padding: "2rem", // CHANGED: Reduced from 12rem to 2rem
        display: "flex", 
        flexDirection: "column", 
        position: "relative", 
        minWidth: 0,
        height: "100vh" // Ensure full viewport height
      }}>
        
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "1.5rem", 
          zIndex: 10,
          width: "100%" 
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "white" }}>Architecture Preview</h2>
            <p style={{ margin: 0, fontSize: "14px", color: colors.textMuted }}>Interactive system visualization</p>
          </div>
          <button 
            onClick={downloadSVG}
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: `1px solid ${colors.border}`, 
              backgroundColor: colors.bgCard, 
              color: "white", 
              fontSize: "14px", 
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}>
            Download SVG
          </button>
        </div>
        
        {/* Canvas Area */}
        <div style={{ 
          flex: 1, // CHANGED: This makes the box expand to the bottom of the screen
          backgroundColor: "#ffffff05", 
          borderRadius: "24px", 
          border: `1px solid ${colors.border}`, 
          position: "relative",
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", // Changed to center for better focus
          overflow: "auto",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)",
          padding: "20px"
        }}>
          
          <div style={{
            position: "absolute",
            fontSize: "clamp(100px, 20vw, 250px)", // Responsive size
            fontWeight: "900",
            color: "white",
            opacity: 0.03,
            pointerEvents: "none",
            userSelect: "none",
            transform: "translate(-50%, -50%) rotate(-15deg)", // Modern centering
            top: "50%",
            left: "50%",
            zIndex: 0
          }}>
            ARCH
          </div>

          <div style={{ 
            zIndex: 2, 
            transform: "scale(1.1)", 
            minWidth: "fit-content",
            padding: "40px"
          }}>
            <MermaidCanvas code={mermaidCode} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;