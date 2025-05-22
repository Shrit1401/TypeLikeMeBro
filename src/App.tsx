import "./App.css";
import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState("farza");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleTransform = () => {
    // Sample transformation logic
    let sample;
    switch (persona) {
      case "farza":
        sample = `Bro, ${input} 💥`;
        break;
      case "nawal":
        sample = `Thread: ${input} 🧠`;
        break;
      case "naval":
        sample = `Wisdom: ${input} ✨`;
        break;
      case "elon":
        sample = `Mars says: ${input} 🚀`;
        break;
      default:
        sample = input;
    }
    setOutput(sample);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="twitter-extension" style={{ maxWidth: 400 }}>
      <h2>Type Like Me Bro</h2>
      <textarea
        className="chat-textarea"
        rows={4}
        placeholder="Type your text here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", resize: "vertical", marginBottom: 16 }}
      />
      <div className="persona-selector" style={{ marginBottom: 16 }}>
        <select
          className="persona-dropdown"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
        >
          <option value="farza">Farza</option>
          <option value="nawal">Nawal</option>
          <option value="naval">Naval</option>
          <option value="elon">Elon</option>
        </select>
      </div>
      <button
        className="transform-button"
        onClick={handleTransform}
        style={{ marginBottom: 16 }}
      >
        Rewrite
      </button>
      {output && (
        <div
          className="output-box"
          style={{
            background: "#f8f8f8",
            borderRadius: 8,
            padding: 16,
            marginTop: 8,
          }}
        >
          <div style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {output}
          </div>
          <button
            className="copy-btn"
            onClick={handleCopy}
            style={{ fontSize: 14, padding: "6px 12px" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
