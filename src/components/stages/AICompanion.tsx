import React, { useEffect, useState } from 'react';
import './AICompanion.css';

interface AICompanionProps {
  visible: boolean;
  message: string;
  onComplete?: () => void;
}

export const AICompanion: React.FC<AICompanionProps> = ({
  visible,
  message,
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!visible || !message) {
      setDisplayedText('');
      return;
    }

    setDisplayedText(''); // Reset teks sebelum mulai
    let currentIndex = 0;
    
    // Simpan string secara akumulatif ke variabel lokal agar tidak ada masalah dengan prev state React
    let currentText = '';

    const typingInterval = setInterval(() => {
      if (currentIndex < message.length) {
        currentText += message.charAt(currentIndex);
        setDisplayedText(currentText);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 40);

    return () => {
      clearInterval(typingInterval);
    };
  }, [visible, message]);

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
        <p id="ai-text">
          {displayedText}
        </p>
      </div>
    </div>
  );
};

export default AICompanion;
