import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { List, Clock, Compass } from 'lucide-react';
import ResultsDisplay from '../components/ResultsDisplay';
import './Dashboard.css';

const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to about section if directed from other routes
  useEffect(() => {
    if (location.state?.scrollToAbout) {
      setTimeout(() => {
        const el = document.getElementById('about-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const saveToHistory = (resultData, originalUrl) => {
    try {
      const historyJson = localStorage.getItem('vsHistory');
      let history = historyJson ? JSON.parse(historyJson) : [];
      
      const newEntry = {
        id: Date.now(),
        videoId: resultData.videoId,
        videoTitle: resultData.title,
        thumbnailUrl: resultData.thumbnailUrl,
        videoUrl: originalUrl,
        channelName: resultData.channelName,
        duration: resultData.duration,
        executiveSummary: resultData.executiveSummary,
        keyPoints: resultData.keyPoints,
        people: resultData.people || [],
        context: resultData.context || '',
        timestamps: resultData.timestamps || [],
        recommendations: resultData.recommendations || [],
        dateAnalyzed: new Date().toISOString()
      };
      
      history.unshift(newEntry);
      
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      localStorage.setItem('vsHistory', JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save history', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus('loading');
    setData(null);
    setErrorMsg('');

    try {
      const preferences = JSON.parse(localStorage.getItem('contentPreferences') || '[]');
      const summaryLength = localStorage.getItem('vsSummaryLength') || 'Standard';
      
      const response = await axios.post('/api/summarize', {
        url,
        contentPreferences: preferences,
        summaryLength: summaryLength
      });

      setData(response.data);
      setStatus('success');
      saveToHistory(response.data, url);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setUrl('');
    setData(null);
    setStatus('idle');
  };

  const handlePrefill = (category, sampleUrl) => {
    setUrl(sampleUrl);
    setActiveTooltip(category);
    setTimeout(() => {
      setActiveTooltip(null);
    }, 2000);
  };

  return (
    <div className="page-wrapper">
      <div className="dashboard-page animate-fade-in">
        
        {/* Breathing animated radial glow behind the search section */}
        <div className="hero-radial-glow"></div>

        <div className="search-section">
          <div className="search-label">PASTE A YOUTUBE URL</div>
          <form className="search-form" onSubmit={handleSubmit}>
            <input 
              type="text" 
              className="dashboard-input" 
              placeholder="Paste a YouTube video URL..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'loading'}
            />
            <button type="submit" className="dashboard-submit-btn" disabled={status === 'loading'}>
              Summarize
            </button>
          </form>
          <div className="search-banner">
            This is a personal project with limited daily capacity — 3 summaries per visitor per day.
          </div>
        </div>

        {status === 'idle' && (
          <div className="landing-content">
            
            {/* Stat cards row */}
            <div className="stat-cards-row">
              <div className="stat-card">
                <List size={20} className="stat-card-icon" />
                <h3 className="stat-card-heading">Key Points</h3>
                <p className="stat-card-desc">Get the core takeaways of any video instantly.</p>
              </div>
              <div className="stat-card">
                <Clock size={20} className="stat-card-icon" />
                <h3 className="stat-card-heading">Timestamps</h3>
                <p className="stat-card-desc">Jump straight to the parts that matter most.</p>
              </div>
              <div className="stat-card">
                <Compass size={20} className="stat-card-icon" />
                <h3 className="stat-card-heading">Recommendations</h3>
                <p className="stat-card-desc">Discover tailored topics to explore next.</p>
              </div>
            </div>

            {/* Popular Topics prefill pills */}
            <div className="prefill-categories-section">
              <span className="prefill-label">POPULAR TOPICS</span>
              <div className="prefill-pills-row">
                <div className="prefill-pill-container">
                  <button type="button" className="prefill-pill" onClick={() => handlePrefill('Technology', 'https://www.youtube.com/watch?v=zjkBMFhNj_g')}>
                    Technology
                  </button>
                  {activeTooltip === 'Technology' && <span className="prefill-tooltip">Try this example</span>}
                </div>
                <div className="prefill-pill-container">
                  <button type="button" className="prefill-pill" onClick={() => handlePrefill('Science', 'https://www.youtube.com/watch?v=h7S2yZzE9vU')}>
                    Science
                  </button>
                  {activeTooltip === 'Science' && <span className="prefill-tooltip">Try this example</span>}
                </div>
                <div className="prefill-pill-container">
                  <button type="button" className="prefill-pill" onClick={() => handlePrefill('Finance', 'https://www.youtube.com/watch?v=wXw2w15wI_k')}>
                    Finance
                  </button>
                  {activeTooltip === 'Finance' && <span className="prefill-tooltip">Try this example</span>}
                </div>
              </div>
            </div>

            {/* Decorative video player mockup */}
            <div className="video-player-mockup">
              <div className="mockup-logo-container">
                <svg width="64" height="45" viewBox="0 0 64 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="youtube-logo-svg">
                  <rect width="64" height="45" rx="10" fill="#FF0000" />
                  <path d="M26 15L43 22.5L26 30V15Z" fill="#FFFFFF" />
                </svg>
                <div className="mockup-support-label">Supports any public YouTube video</div>
              </div>
              
              <div className="mockup-chapter-labels">
                <span className="chapter-label">Intro</span>
                <span className="chapter-label">Setup</span>
                <span className="chapter-label">Details</span>
                <span className="chapter-label">Demo</span>
                <span className="chapter-label">Summary</span>
              </div>

              <div className="mockup-progress-container">
                <div className="mockup-chapter-dots">
                  <div className="chapter-dot" style={{ left: '0%' }}></div>
                  <div className="chapter-dot" style={{ left: '25%' }}></div>
                  <div className="chapter-dot" style={{ left: '50%' }}></div>
                  <div className="chapter-dot" style={{ left: '75%' }}></div>
                  <div className="chapter-dot" style={{ left: '100%' }}></div>
                </div>
                <div className="mockup-progress-track">
                  <div className="mockup-progress-fill-anim"></div>
                  <div className="mockup-playhead-dot"></div>
                </div>
              </div>
            </div>

            {/* How It Works section */}
            <div className="how-it-works">
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">A seamless pipeline converting pixels and audio into highly structured insights.</p>
              
              <div className="steps-container">
                <div className="steps-connector-line"></div>
                <div className="steps-grid">
                  <div className="step-card">
                    <div className="step-number-circle">1</div>
                    <h4 className="step-card-heading">URL Submitted</h4>
                    <p className="step-card-desc">Paste any public video link into the search bar.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number-circle">2</div>
                    <h4 className="step-card-heading">Metadata Fetch</h4>
                    <p className="step-card-desc">We extract captions, duration, and channel details securely.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number-circle">3</div>
                    <h4 className="step-card-heading">AI Analysis</h4>
                    <p className="step-card-desc">Llama 3.3 70B instantly analyzes the transcript context.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-number-circle">4</div>
                    <h4 className="step-card-heading">Structured view</h4>
                    <p className="step-card-desc">Results are formatted with timestamps and recommendations.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* About Section Footer */}
            <section className="about-videosummarizer" id="about-section">
              <h2 className="about-title-heading">About VideoSummarizer</h2>
              <p className="about-paragraph">
                VideoSummarizer was built out of a simple frustration — too many videos, too little time. Instead of spending 20 minutes watching a video just to find out if it was worth watching, this tool gives you the full picture in seconds. Every key point, every important moment, every recommendation — extracted and structured by AI so you can decide what actually deserves your attention. Built entirely using Google Antigravity for development, Google Stitch for design, Groq AI with Llama for summarization, and the YouTube Data API for content. A solo project by Kartik Sharma — kartik111102@gmail.com.
              </p>
              <div className="about-divider"></div>
              <div className="about-pills-row">
                <span className="about-badge-pill">Built with Antigravity</span>
                <span className="about-badge-pill">Powered by Groq</span>
                <span className="about-badge-pill">YouTube Data API</span>
              </div>
            </section>
          </div>
        )}

        {status === 'loading' && (
          <div className="loading-state">
            <div className="loading-dots">
              <div className="loading-dot dot-1"></div>
              <div className="loading-dot dot-2"></div>
              <div className="loading-dot dot-3"></div>
            </div>
            <p className="loading-text">Fetching and summarizing your video</p>
            <LoadingDelayedWarning />
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
          <ResultsDisplay data={data} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

// Component to handle showing the delayed warning message after 20 seconds
const LoadingDelayedWarning = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarning(true);
    }, 20000);
    return () => clearTimeout(timer);
  }, []);

  if (!showWarning) return null;
  return (
    <p className="loading-warning-text">
      This is taking longer than usual, please wait
    </p>
  );
};

export default Dashboard;
