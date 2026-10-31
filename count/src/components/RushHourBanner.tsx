import React from 'react';

interface RushHourBannerProps {
  className?: string;
}

export const RushHourBanner: React.FC<RushHourBannerProps> = ({ className = "w-full max-w-lg" }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#ddb7ff]/30 shadow-[0_0_30px_rgba(221,183,255,0.25)] ${className}`}>
      <svg
        viewBox="0 0 520 150"
        className="w-full h-auto block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Purple grid background pattern */}
          <pattern id="banner-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#ddb7ff" strokeWidth="1" strokeOpacity="0.12" />
          </pattern>

          {/* Right corner radial purple glow */}
          <radialGradient id="right-purple-glow" cx="92%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#ddb7ff" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#9333ea" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#15121c" stopOpacity="0" />
          </radialGradient>

          {/* Soft glow filter for 24 */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base dark canvas */}
        <rect width="520" height="150" fill="#15121c" />

        {/* Purple Grid Overlay */}
        <rect width="520" height="150" fill="url(#banner-grid)" />

        {/* Right Radial Glow */}
        <rect width="520" height="150" fill="url(#right-purple-glow)" />

        {/* Inner subtle border */}
        <rect x="1" y="1" width="518" height="148" fill="none" stroke="#ddb7ff" strokeWidth="1" opacity="0.25" rx="10" />

        {/* Main Title Left: RUSH */}
        <text
          x="28"
          y="96"
          fill="#FFFFFF"
          fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize="84"
          fontWeight="900"
          letterSpacing="0.5"
        >
          RUSH
        </text>

        {/* Main Title Right: HOUR */}
        <text
          x="288"
          y="96"
          fill="#FFFFFF"
          fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize="84"
          fontWeight="900"
          letterSpacing="0.5"
        >
          HOUR
        </text>

        {/* Overlapping Center Accent: 24 */}
        <text
          x="202"
          y="128"
          fill="#ddb7ff"
          filter="url(#neon-glow)"
          fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize="96"
          fontWeight="900"
        >
          24
        </text>

        {/* Subtitle Left: Build Fast */}
        <text
          x="30"
          y="136"
          fill="#e7dfef"
          fontFamily="'Courier New', Courier, monospace"
          fontSize="18"
          fontWeight="bold"
          letterSpacing="0.5"
          opacity="0.9"
        >
          Build Fast
        </text>

        {/* Subtitle Right: BREAK LIMITS */}
        <text
          x="304"
          y="136"
          fill="#e7dfef"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="900"
          letterSpacing="2.5"
          opacity="0.9"
        >
          BREAK LIMITS
        </text>
      </svg>
    </div>
  );
};
