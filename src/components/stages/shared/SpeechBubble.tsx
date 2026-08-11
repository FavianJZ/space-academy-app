import React, { useEffect, useState } from "react";

interface SpeechBubbleProps {
  message: string;
  type?: "robot" | "spaceman";
  duration?: number;
  onDone?: () => void;
}

type SpeechBubbleCycleProps = Required<
  Pick<SpeechBubbleProps, "message" | "type" | "duration">
> &
  Pick<SpeechBubbleProps, "onDone">;

const SpeechBubbleCycle: React.FC<SpeechBubbleCycleProps> = ({
  message,
  type,
  duration,
  onDone,
}) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, Math.max(0, duration - 400));

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [duration, onDone]);

  if (!visible || !message) return null;

  return (
    <div
      className={`speech-bubble speech-bubble-${type} ${
        exiting ? "speech-exit" : "speech-enter"
      }`}
    >
      <div className="speech-bubble-content">
        <span className="speech-text">{message}</span>
      </div>

      <div className="speech-bubble-tail" />
    </div>
  );
};

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  type = "robot",
  duration = 3000,
  onDone,
}) => {
  return (
    <SpeechBubbleCycle
      key={`${message}:${duration}`}
      message={message}
      type={type}
      duration={duration}
      onDone={onDone}
    />
  );
};
