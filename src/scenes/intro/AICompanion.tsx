import React, { useEffect, useState } from "react";
import "./AICompanion.css";

interface AICompanionProps {
  visible: boolean;
  message: string;
  onComplete?: () => void;
}

const AICompanion: React.FC<AICompanionProps> = ({
  visible,
  message,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!visible || !message) {
      setDisplayedText("");
      return;
    }

    setDisplayedText("");

    let currentIndex = 0;
    let currentText = "";

    const typingInterval = window.setInterval(() => {
      if (currentIndex < message.length) {
        currentText += message.charAt(currentIndex);
        setDisplayedText(currentText);
        currentIndex += 1;
      } else {
        window.clearInterval(typingInterval);
        onComplete?.();
      }
    }, 40);

    return () => {
      window.clearInterval(typingInterval);
    };
  }, [visible, message, onComplete]);

  if (!visible) return null;

  return (
    <div id="ai-companion">
      <div className="ai-avatar">
        <img
          src="/assets/Avatar_AI.svg"
          alt="AI Avatar"
          className="ai-image-core"
        />
        <span>A.I. SYS</span>
      </div>

      <div className="ai-dialogue">
        <p id="ai-text">{displayedText}</p>
      </div>
    </div>
  );
};

export default AICompanion;