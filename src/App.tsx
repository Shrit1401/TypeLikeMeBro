import "./App.css";
import { useEffect, useState } from "react";

const master_key =
  "$2b$10$HLrygU67KxPLcjmcmFCc0.SI2kNigaxDP.rBx9oDxGsm3Wfw014bO";

const bin_id = "682fa7088a456b7966a3f4e5";

function App() {
  const [isTwitter, setIsTwitter] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState("naval");
  const [isLoading, setIsLoading] = useState(false);
  const [limitChars, setLimitChars] = useState(true);
  const [nonTwitterInput, setNonTwitterInput] = useState("");
  const [nonTwitterOutput, setNonTwitterOutput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setIsTwitter(url.includes("twitter.com") || url.includes("x.com"));
    });
  }, []);

  const personaPrompts = {
    farza: `Rewrite this tweet in Farza's writing style:

    Style guidelines:
    - Speaks like a builder in the trenches — raw, scrappy, and shipping fast
    - Tone is casual, unfiltered, high-energy — like a bro hyping his builder friends
    - Loves slang: "bro", "dude", "lol", "yo", "wtf", etc.
    - Grammar is relaxed — uses lowercase often, skips punctuation when it vibes
    - Tweets feel like group chat energy or tech bro therapy
    - Not polished, but always real — emotionally charged and anti-pretentious
    - Likes exaggeration and memespeak for comic relief
    - Encourages action, momentum, and building over thinking
    - No hashtags, @ mentions, or corporate speak
    - Keep the SAME topic/message, just change the style
    
    Original: "{userTweet}"
    
    Rewrite in Farza's style${limitChars ? " (max 280 chars)" : ""}:`,

    naval: `Rewrite this tweet in Naval Ravikant's writing style:

Style guidelines:
- Strips ideas down to their essence — minimal words, maximal depth
- Speaks in timeless truths or personal philosophy
- Uses clear, simple words to express complex ideas
- No fluff, no filler — every sentence feels like a quote
- Tone is calm, reflective, and wise — rarely emotional
- Often drops standalone thoughts — not long chains or paragraphs
- Occasionally uses emojis to soften or punctuate wisdom (but not excessively)
- No hashtags, @ mentions, or rhetorical flourishes
- Makes the reader pause and say, "That's true"
- Keep the SAME topic/message, just change the style

Original: "{userTweet}"

Rewrite in Naval's style${limitChars ? " (max 280 chars)" : ""}:`,

    paras: `Rewrite this tweet in Paras Chopra's writing style:

Style guidelines:
- Shares clear, insightful thoughts often based on personal observations
- Uses simple yet precise language to explain complex ideas
- Often zooms out to reveal a system-level or behavioral insight
- Tone is calm, curious, and analytical — not emotional or performative
- Rarely uses rhetorical questions — prefers direct conclusions or reflections
- Condenses big ideas into a compact, tweet-sized format
- Avoids fluff, line breaks, and over-explaining
- Often makes you pause and reflect — "That's a smart take"
- No hashtags, @ mentions, or bullet points
- Keep the SAME topic/message, just change the style

Original: "{userTweet}"

Rewrite in Paras Chopra's style${limitChars ? " (max 280 chars)" : ""}:`,
  };

  const transformTweet = async (userTweet: string) => {
    const prompt = personaPrompts[
      selectedPersona as keyof typeof personaPrompts
    ].replace("{userTweet}", userTweet);

    try {
      const response = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...(limitChars
              ? [
                  {
                    role: "system",
                    content:
                      "Never exceed 280 characters in your response. If the rewrite would be longer, make it shorter and concise. Do not explain, just rewrite.",
                  },
                ]
              : []),
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling Hack Club AI:", error);
      throw error;
    }
  };

  const updateJsonBin = async () => {
    try {
      // First get the current data
      const response = await fetch(`https://api.jsonbin.io/v3/b/${bin_id}`, {
        headers: {
          "X-Master-Key": master_key,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to fetch JSONBin data:", response.status);
        return;
      }

      const data = await response.json();
      const currentData = data.record || {
        total: 0,
        farza: 0,
        naval: 0,
        paras: 0,
      };

      // Update the counts
      const updatedData = {
        total: (currentData.total || 0) + 1,
        farza: currentData.farza || 0,
        naval: currentData.naval || 0,
        paras: currentData.paras || 0,
        [selectedPersona]: (currentData[selectedPersona] || 0) + 1,
      };

      // Update the bin
      const updateResponse = await fetch(
        `https://api.jsonbin.io/v3/b/${bin_id}`,
        {
          method: "PUT",
          headers: {
            "X-Master-Key": master_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!updateResponse.ok) {
        console.warn("Failed to update JSONBin data:", updateResponse.status);
      }
    } catch (error) {
      // Just log the error but don't throw it
      console.warn("Error updating JSONBin:", error);
    }
  };

  const handleTransform = async () => {
    let [tab] = await chrome.tabs.query({ active: true });

    setIsLoading(true);

    try {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id! },
          func: () => {
            const tweetBox = document.querySelector(
              '[data-testid="tweetTextarea_0"][contenteditable="true"]'
            );
            if (tweetBox) {
              const textSpans = tweetBox.querySelectorAll(
                'span[data-text="true"]'
              );
              if (textSpans.length > 0) {
                let tweetText = Array.from(textSpans)
                  .map((span) => span.textContent || "")
                  .join("");
                return tweetText.trim();
              } else {
                let tweetText = tweetBox.innerHTML
                  .replace(/<div[^>]*>/gi, "\n")
                  .replace(/<br\s*\/?>/gi, "\n")
                  .replace(/<\/div>/gi, "")
                  .replace(/<[^>]*>/g, "")
                  .replace(/&nbsp;/g, " ")
                  .trim();

                return tweetText;
              }
            } else {
              throw new Error("Tweet box not found!");
            }
          },
        },
        async (results) => {
          try {
            const originalTweet = results[0].result;

            if (!originalTweet) {
              alert("No text found!");
              setIsLoading(false);
              return;
            }

            const transformedTweet = await transformTweet(originalTweet);

            // Update JSONBin after successful transformation
            // Don't await this - let it run in the background
            updateJsonBin().catch(() => {
              // Silently handle any errors
              console.warn(
                "JSONBin update failed, but continuing with transformation"
              );
            });

            // Clean up the response - remove quotes and extra formatting
            const cleanedTweet = transformedTweet
              .replace(/^["']|["']$/g, "") // Remove quotes at start/end
              .replace(/"/g, "") // Remove all remaining quotes
              .replace(/'/g, "'") // Replace smart quotes with regular apostrophes
              .trim();

            chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              func: (newText) => {
                const tweetBox = document.querySelector(
                  '[data-testid="tweetTextarea_0"][contenteditable="true"]'
                );
                if (tweetBox) {
                  const textSpans = tweetBox.querySelectorAll(
                    'span[data-text="true"]'
                  );

                  if (textSpans.length > 0) {
                    textSpans.forEach((span) => (span.textContent = ""));
                    if (textSpans[0]) {
                      textSpans[0].textContent = newText;
                    }
                  } else {
                    tweetBox.innerHTML = newText.replace(/\n/g, "<div></div>");
                  }

                  tweetBox.dispatchEvent(new Event("input", { bubbles: true }));
                  tweetBox.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                  (tweetBox as HTMLElement).focus();
                }
              },
              args: [cleanedTweet],
            });

            setIsLoading(false);
          } catch (error: any) {
            console.error("Error:", error);
            alert("Error: " + error.message);
            setIsLoading(false);
          }
        }
      );
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error: " + error.message);
      setIsLoading(false);
    }
  };

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "add_new") {
      window.location.href =
        "mailto:shrit1401@gmail.com?subject=New Persona Suggestion";
    } else {
      setSelectedPersona(value);
    }
  };

  if (!isTwitter) {
    return (
      <div className="twitter-extension">
        <img src="./icons/icon96.png" alt="Type Like Me Bro" className="logo" />
        <h2 className="title">Type Like Me Bro</h2>
        <textarea
          className="non-twitter-textarea"
          placeholder="Paste or write your text here..."
          value={nonTwitterInput}
          onChange={(e) => setNonTwitterInput(e.target.value)}
          rows={4}
        />
        <div className="helper-text">
          Paste or write your text above, select a persona, and click Generate.
        </div>
        <div
          className="persona-selector"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <img
            src={
              selectedPersona === "farza"
                ? "/farza.png"
                : selectedPersona === "naval"
                ? "/naval.png"
                : "/paras.png"
            }
            alt={
              selectedPersona === "farza"
                ? "Farza"
                : selectedPersona === "naval"
                ? "Naval"
                : "Paras Chopra"
            }
            className="persona-avatar"
          />
          <select
            className="persona-dropdown"
            value={selectedPersona}
            onChange={handlePersonaChange}
          >
            <option value="naval">Naval</option>
            <option value="farza">Farza</option>
            <option value="paras">Paras Chopra</option>
            <option value="add_new">+ Add New Persona</option>
          </select>
        </div>
        <div className="options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={limitChars}
              onChange={(e) => setLimitChars(e.target.checked)}
            />
            Limit to 280 characters
          </label>
        </div>
        <button
          className="transform-button"
          onClick={async () => {
            setIsLoading(true);
            setNonTwitterOutput("");
            setCopied(false);
            try {
              const result = await transformTweet(nonTwitterInput);
              setNonTwitterOutput(result.trim());
            } catch (e) {
              setNonTwitterOutput("Error generating output");
            }
            setIsLoading(false);
          }}
          disabled={isLoading || !nonTwitterInput.trim()}
        >
          {isLoading ? (
            <div className="loading">
              <span className="spinner"></span>
              Generating...
            </div>
          ) : (
            "Generate"
          )}
        </button>
        {nonTwitterOutput && (
          <div className="output-section">
            <textarea
              className="non-twitter-output"
              value={nonTwitterOutput}
              readOnly
              rows={4}
            />
            <button
              className={`transform-button${copied ? " copy-success" : ""}`}
              onClick={() => {
                navigator.clipboard.writeText(nonTwitterOutput);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              disabled={!nonTwitterOutput}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="twitter-extension">
      <h2>Type Like Me Bro</h2>
      <div
        className="persona-selector"
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        <img
          src={
            selectedPersona === "farza"
              ? "/farza.png"
              : selectedPersona === "naval"
              ? "/naval.png"
              : "/paras.png"
          }
          alt={
            selectedPersona === "farza"
              ? "Farza"
              : selectedPersona === "naval"
              ? "Naval"
              : "Paras Chopra"
          }
          className="persona-avatar"
        />
        <select
          className="persona-dropdown"
          value={selectedPersona}
          onChange={handlePersonaChange}
        >
          <option value="naval">Naval</option>
          <option value="farza">Farza</option>
          <option value="paras">Paras Chopra</option>
          <option value="add_new">+ Add New Persona</option>
        </select>
      </div>
      <div className="options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={limitChars}
            onChange={(e) => setLimitChars(e.target.checked)}
          />
          Limit to 280 characters
        </label>
      </div>
      <button
        className="transform-button"
        onClick={handleTransform}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="loading">
            <span className="spinner"></span>
            Transforming...
          </div>
        ) : (
          "Transform Tweet"
        )}
      </button>
    </div>
  );
}

export default App;
