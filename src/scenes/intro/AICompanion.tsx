import { useEffect, useState } from "react";
import "./AICompanion.css";

interface AICompanionProps {
  visible: boolean;
  message: string;
  onComplete?: () => void;
}

const AICompanion = ({ visible, message, onComplete }: AICompanionProps) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!visible || !message) return;
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
    }, 32);

    return () => window.clearInterval(typingInterval);
  }, [visible, message, onComplete]);

  if (!visible) return null;

  return (
    <aside className="intro-ai-companion" aria-live="polite">
      <div className="intro-ai-signal" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
      <div className="intro-ai-avatar">
        <img src="/assets/Avatar_AI.svg" alt="Avatar AI" />
      </div>
      <div className="intro-ai-copy">
        <div className="intro-ai-heading">
          <span>AI COMPANION</span>
          <strong>ORBIT // LIVE</strong>
        </div>
        <p>{displayedText}<i className="intro-ai-cursor" aria-hidden="true" /></p>
      </div>
      <span className="intro-ai-channel">CH.01</span>
    </aside>
  );
};

export default AICompanion;
