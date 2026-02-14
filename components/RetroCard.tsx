import React from 'react';

interface RetroCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  borderColor?: 'green' | 'red' | 'white' | 'blue' | 'pink';
}

const RetroCard: React.FC<RetroCardProps> = ({ children, className = '', title, borderColor = 'white' }) => {
  const borderClasses = {
    green: 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]',
    red: 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    white: 'border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]',
    blue: 'border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]',
    pink: 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]'
  };

  return (
    <div className={`relative border-4 bg-gray-900 ${borderClasses[borderColor]} p-4 md:p-6 ${className}`}>
      {title && (
        <div className="absolute -top-4 left-4 bg-gray-900 px-2 text-sm md:text-base font-bold tracking-wider uppercase text-white border-l-2 border-r-2 border-current">
          <span className={borderColor === 'pink' ? 'text-pink-400' : 'text-green-400'}>{title}</span>
        </div>
      )}
      {children}
      
      {/* Corner decorations */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-white opacity-50"></div>
      <div className="absolute top-1 right-1 w-2 h-2 bg-white opacity-50"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 bg-white opacity-50"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-white opacity-50"></div>
    </div>
  );
};

export default RetroCard;