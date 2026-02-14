import React from 'react';

interface PixelAvatarProps {
  name: string;
  stage?: 'baby' | 'child_blonde' | 'child_brown' | 'adult';
  size?: number;
}

const PixelAvatar: React.FC<PixelAvatarProps> = ({ name, stage = 'adult', size = 40 }) => {
  // DiceBear Pixel Art Seeds
  // We use specific seeds that approximate the look we want.
  
  let seed = name;
  let backgroundColor = 'bg-indigo-900';
  let showDummy = false;

  if (name === 'Rachel') {
    seed = 'Rachel_LongHair'; 
  } else if (name === 'Glenn') {
    seed = 'Glenn_ShortHair';
  } else {
    // Children Logic
    if (stage === 'baby') {
      seed = 'Baby_Generic_V1'; // Shared seed for both babies so they look identical
      backgroundColor = 'bg-blue-300';
      showDummy = true; // We will overlay a pixel dummy
    } else if (stage === 'child_blonde') {
      seed = 'Boy_Blonde_V2'; // Specific seed for blonde look
      backgroundColor = 'bg-indigo-800';
    } else if (stage === 'child_brown') {
      seed = 'Boy_Brown_V3'; // Specific seed for brown hair look
      backgroundColor = 'bg-indigo-800';
    }
  }

  // API URL
  const scale = stage === 'baby' ? 90 : 120;
  const url = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}&scale=${scale}`;

  return (
    <div 
      className={`inline-block border-2 border-white ${backgroundColor} overflow-hidden relative shrink-0`} 
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      title={name}
    >
      <img src={url} alt={name} className="w-full h-full object-cover" />
      
      {/* Pixel Art Dummy Overlay for Babies */}
      {showDummy && (
        <div className="absolute bottom-[30%] left-[45%] transform -translate-x-1/2 flex items-center justify-center">
            {/* Simple CSS shape for a dummy */}
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full border border-white z-10"></div>
            <div className="w-2 h-1 bg-white absolute top-[-1px] rounded-full z-0"></div>
        </div>
      )}
    </div>
  );
};

export default PixelAvatar;