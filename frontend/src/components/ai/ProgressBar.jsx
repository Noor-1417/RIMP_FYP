import React from 'react';

/**
 * ProgressBar Component
 * Displays a visual progress bar with percentage
 */
export const ProgressBar = ({ progress = 0, animate = true }) => {
  const circumference = 2 * Math.PI * 45; // Circle radius 45

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress) / 100}
            strokeLinecap="round"
            className={animate ? 'transition-all duration-500' : ''}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-600">{progress}%</span>
        </div>
      </div>

      {/* Linear Progress Bar */}
      <div className="w-full mt-6">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full ${
              animate ? 'transition-all duration-500' : ''
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
