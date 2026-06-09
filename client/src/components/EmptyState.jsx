import React from 'react';

const EmptyState = () => {
  return (
    <div className="stitch-empty">
      <div className="stitch-crosshair">
        <div className="stitch-crosshair-dot"></div>
      </div>
      <p className="stitch-empty-text">Paste any public video link above to get started.</p>
    </div>
  );
};

export default EmptyState;