import React from 'react';

interface ItemIconProps {
  name: string;
  size?: number;
}

const ItemIcon: React.FC<ItemIconProps> = ({ name, size = 32 }) => {
  // Map item names to Emoji or specialized content that looks like pixel art
  let icon = '❓';
  
  switch (name) {
    case 'Empty Wallet': icon = '💸'; break;
    case 'Cool Runners': icon = '👟'; break;
    case 'Mortgage': icon = '📜'; break;
    case 'Nice Tiles': icon = '🧱'; break;
    case 'Tan': icon = '☀️'; break;
    case 'Good Sandwich': icon = '🥪'; break;
    case 'Dream Home': icon = '🏰'; break;
    case 'The Ring': icon = '💍'; break;
    default: icon = '📦';
  }

  return (
    <div 
      className="flex items-center justify-center bg-gray-800 border-2 border-gray-600 rounded shrink-0 relative group cursor-help"
      style={{ width: size, height: size }}
    >
      <span className="text-xl leading-none filter drop-shadow-md grayscale-[0.2] contrast-125 hover:grayscale-0 transition-all">
        {icon}
      </span>
      {/* Tooltip */}
      <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-[10px] p-1 whitespace-nowrap border border-white z-50">
        {name}
      </span>
    </div>
  );
};

export default ItemIcon;