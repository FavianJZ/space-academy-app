import React, { useEffect, useState } from 'react';
import type { EmoteType } from './InteractiveSpaceman';

interface SpeechBubbleProps {
  message: string;
  type?: 'robot' | 'spaceman';
  duration?: number;
  onDone?: () => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  type = 'robot',
  duration = 3000,
  onDone,
}) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setVisible(true);
    setExiting(false);

    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 400);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [message, duration, onDone]);

  if (!visible || !message) return null;

  return (
    <div className={`speech-bubble speech-bubble-${type} ${exiting ? 'speech-exit' : 'speech-enter'}`}>
      <div className="speech-bubble-content">
        <span className="speech-text">{message}</span>
      </div>
      <div className="speech-bubble-tail" />
    </div>
  );
};

export const robotMessages = {
  idle: [
    "Click me! I'm bored 🤖",
    "Hey there, cadet! 👋",
    "Need a hint? Just ask! 💡",
    "You're doing amazing! 🌟",
    "Keep up the great work! 💪",
    "I believe in you! ⭐",
  ],
  correct: [
    "Excellent work! 🎉",
    "That's correct! You're a genius! 🧠",
    "Perfect answer! ✨",
    "You nailed it! 🎯",
    "Outstanding, cadet! 🌟",
    "Brilliant! Keep it up! 💫",
  ],
  incorrect: [
    "Don't give up! Try again! 💪",
    "Mistakes help us learn! 📚",
    "Almost there! Think again 🤔",
    "You'll get it next time! 🔄",
    "Not quite... but don't stop! 🚀",
    "Every error is a lesson! 📖",
  ],
  thinking: [
    "Hmm, let me think... 🤔",
    "Processing... beep boop 🤖",
    "Interesting question... 💭",
  ],
};

export const spacemanMessages: Record<EmoteType, string[]> = {
  idle: [
    "Just floating around... 🌌",
    "Space is so peaceful ✨",
    "Click me for a trick! 🚀",
  ],
  wave: [
    "Hi there, cadet! 👋",
    "Hello from space! 🌌",
    "Greetings, explorer! 🚀",
  ],
  flip: [
    "Wheee! Zero gravity! 🌀",
    "Watch this trick! ✨",
    "I can do flips in space! 🤸",
  ],
  jump: [
    "To infinity and beyond! 🚀",
    "Jumping through stars! ⭐",
    "Catch me if you can! 🌟",
  ],
  dance: [
    "Space dance party! 💃",
    "Feel the cosmic rhythm! 🎶",
    "Dancing among the stars! 🌠",
  ],
};

export const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};
