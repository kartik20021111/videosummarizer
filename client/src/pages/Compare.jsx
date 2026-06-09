import React, { useState } from 'react';
import axios from 'axios';
import ResultsDisplay from '../components/ResultsDisplay';
import './Compare.css';

const Compare = () => {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url1.trim() || !url2.trim()) return;

    setStatus('loading');
    setData(null);
    setErrorMsg('');

    try {
      const response = await axios.post('/api/compare', {
        url1,
        url2
      });
      setData(response.data);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to compare videos.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setUrl1('');
    setUrl2('');
    setData(null);
    setStatus('idle');
  };

  return (
    <div className="page-wrapper">
      <div className="compare-page animate-fade-in">
        <h1 className="compare-title">Compare Videos</h1>

        <div className="compare-search-section">
          <form className="compare-form" onSubmit={handleSubmit}>
            <div className="compare-inputs-row">
              <input 
                type="text" 
                className="dashboard-input compare-input" 
                placeholder="First YouTube URL..." 
                value={url1}
                onChange={(e) => setUrl1(e.target.value)}
                disabled={status === 'loading'}
              />
              <div className={`compare-vs-badge ${!url1.trim() && !url2.trim() ? 'pulse' : ''}`}>VS</div>
              <input 
                type="text" 
                className="dashboard-input compare-input" 
                placeholder="Second YouTube URL..." 
                value={url2}
                onChange={(e) => setUrl2(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>
            <button 
              type="submit" 
              className="dashboard-submit-btn compare-submit-btn" 
              disabled={status === 'loading' || !url1 || !url2}
            >
              Compare
            </button>
          </form>
        </div>

        {status === 'loading' && (
          <div className="loading-state">
            <div className="loading-dots">
              <div className="loading-dot dot-1"></div>
              <div className="loading-dot dot-2"></div>
              <div className="loading-dot dot-3"></div>
            </div>
            <p className="loading-text">Analyzing and comparing both transcripts</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-container">
            <div className="error-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" className="error-icon">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="error-message">{errorMsg}</div>
              <button className="btn-primary error-retry-btn" onClick={handleReset}>Try Again</button>
            </div>
          </div>
        )}

        {status === 'success' && data && (
          <div className="compare-results-container">
            <div className="similarity-card card">
              <h3 className="similarity-heading">AI Observation</h3>
              <p className="similarity-text">{data.similarityNote}</p>
            </div>

            <div className="compare-columns-grid">
              <div className="compare-col">
                <ResultsDisplay data={data.video1} />
              </div>
              <div className="compare-col">
                <ResultsDisplay data={data.video2} />
              </div>
            </div>
            
            <div className="compare-actions-row">
              <button className="btn-primary" onClick={handleReset}>
                Compare Other Videos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
