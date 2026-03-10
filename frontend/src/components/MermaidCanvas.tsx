import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false });

interface MermaidCanvasProps {
  code: string;
}

export function MermaidCanvas({ code }: MermaidCanvasProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const render = async () => {
      try {
        // We use a static ID "diagram" for the mermaid render
        const { svg } = await mermaid.render("diagram", code);
        ref.current!.innerHTML = svg;
      } catch (err) {
        ref.current!.innerHTML = `<pre style="color:red">Mermaid error:\n${String(
          err
        )}</pre>`;
      }
    };

    render();
  }, [code]);

  return (
    <div
      ref={ref}
      id="mermaid-diagram-container" // Added ID for the download selector
      style={{
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: 8,
        minHeight: 300,
        background: "white",
        overflow: "auto",
      }}
    />
  );
}