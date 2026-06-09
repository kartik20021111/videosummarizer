import React from 'react';

const LoadingState = () => {
  return (
    <div className="stitch-loading">
      <div className="stitch-dots">
        <div className="stitch-dot"></div>
        <div className="stitch-dot"></div>
        <div className="stitch-dot"></div>
      </div>
      <div className="stitch-loading-text">Fetching and summarizing your video...</div>
    </div>
  );
};

export default LoadingState;