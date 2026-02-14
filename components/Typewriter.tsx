import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onChar?: () => void; // Added for sound effects
  className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 30, onComplete, onChar, className }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
        if (onChar) onChar();
      }, speed);
      return () => clearTimeout(timeoutId);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, text, speed]);

  return (
    <div className={className}>
      {displayedText}
      <span className="animate-pulse">_</span>
    </div>
  );
};

export default Typewriter;