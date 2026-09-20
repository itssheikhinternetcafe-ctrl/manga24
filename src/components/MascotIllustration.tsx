import React from 'react';

interface MascotProps {
  size?: number;
  mood?: 'happy' | 'reading' | 'confused' | 'ninja';
  className?: string;
}

export const MascotIllustration: React.FC<MascotProps> = ({
  size = 180,
  mood = 'reading',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4D6D" />
            <stop offset="100%" stopColor="#FF9F1C" />
          </linearGradient>
          <linearGradient id="glowViolet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CFF" />
            <stop offset="100%" stopColor="#FF4D6D" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#FF4D6D" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Soft shadow base */}
        <ellipse cx="100" cy="180" rx="60" ry="12" fill="#000000" opacity="0.4" />

        {/* Ink Spirit Body */}
        <path
          d="M60 160C45 140 40 105 55 75C70 45 130 45 145 75C160 105 155 140 140 160C125 175 75 175 60 160Z"
          fill="url(#bodyGrad)"
          filter="url(#softShadow)"
        />

        {/* Spirit ears / horns */}
        <path d="M62 70L40 32C40 32 60 42 74 58Z" fill="#FF4D6D" />
        <path d="M138 70L160 32C160 32 140 42 126 58Z" fill="#FF9F1C" />

        {/* Ear insides */}
        <path d="M60 65L46 40C46 40 58 48 68 58Z" fill="#FAF7FF" opacity="0.8" />
        <path d="M140 65L154 40C154 40 142 48 132 58Z" fill="#FAF7FF" opacity="0.8" />

        {/* Big expressive anime eyes */}
        {mood === 'confused' ? (
          <>
            <circle cx="80" cy="95" r="10" stroke="#0E0A14" strokeWidth="4" fill="none" />
            <path d="M115 90L130 105M130 90L115 105" stroke="#0E0A14" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="80" cy="95" rx="11" ry="15" fill="#0E0A14" />
            <ellipse cx="120" cy="95" rx="11" ry="15" fill="#0E0A14" />
            {/* Eye glints */}
            <circle cx="83" cy="90" r="5" fill="#FFFFFF" />
            <circle cx="77" cy="100" r="2.5" fill="#FFFFFF" />
            <circle cx="123" cy="90" r="5" fill="#FFFFFF" />
            <circle cx="117" cy="100" r="2.5" fill="#FFFFFF" />
          </>
        )}

        {/* Cute blush */}
        <ellipse cx="65" cy="108" rx="8" ry="4" fill="#FF1E56" opacity="0.6" />
        <ellipse cx="135" cy="108" rx="8" ry="4" fill="#FF1E56" opacity="0.6" />

        {/* Mouth */}
        {mood === 'confused' ? (
          <path d="M94 118Q100 114 106 118" stroke="#0E0A14" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d="M93 114Q100 124 107 114" fill="#0E0A14" />
        )}

        {/* Manga book being read */}
        <g id="manga-book" transform="translate(60, 125)">
          <path d="M10 32C22 25 38 25 40 32C42 25 58 25 70 32V62C58 55 42 55 40 62C38 55 22 55 10 62Z" fill="#FAF7FF" stroke="#2C2340" strokeWidth="2" />
          <path d="M40 32V62" stroke="#FF4D6D" strokeWidth="2" />
          {/* Manga panels on page */}
          <rect x="15" y="36" width="18" height="8" rx="2" fill="#8B5CFF" opacity="0.4" />
          <rect x="15" y="47" width="18" height="8" rx="2" fill="#8B5CFF" opacity="0.4" />
          <rect x="47" y="36" width="18" height="19" rx="2" fill="#FF9F1C" opacity="0.4" />
        </g>

        {/* Speed / aura lines */}
        <path d="M30 95C22 92 18 85 24 78" stroke="#FF9F1C" strokeWidth="3" strokeLinecap="round" />
        <path d="M170 95C178 92 182 85 176 78" stroke="#FF4D6D" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};
