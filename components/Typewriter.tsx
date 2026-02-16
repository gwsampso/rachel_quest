import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onChar?: () => void;
  className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 30, onComplete, onChar, className }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    // Only type if we haven't reached the end
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
        if (onChar) onChar();
      }, speed);
      return () => clearTimeout(timeoutId);
    } else if (index === text.length && text.length > 0 && displayedText === text) {
      // Trigger complete only once after full display and matching content
      if (onComplete) {
        onComplete();
      }
    }
  }, [index, text, speed, onComplete, onChar, displayedText]);

  return (
    <div className={className}>
      {displayedText}
      {index < text.length && <span className="animate-pulse">_</span>}
    </div>
  );
};

export default Typewriter;