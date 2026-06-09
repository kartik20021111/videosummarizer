import React from 'react';

const ErrorState = ({ errorMessage, onReset }) => {
  return (
    <div className="stitch-error">
      <div className="stitch-error-card">
        <div className="stitch-error-content">
          <div className="stitch-error-icon">⚠</div>
          <div className="stitch-error-text">{errorMessage}</div>
        </div>
        <button className="stitch-error-btn" onClick={onReset}>TRY AGAIN</button>
      </div>
    </div>
  );
};

export default ErrorState;