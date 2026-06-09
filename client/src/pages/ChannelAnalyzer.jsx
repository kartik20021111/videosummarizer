import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ExternalLink } from 'lucide-react';
import './ChannelAnalyzer.css';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endValue = parseInt(value, 10);
    if (isNaN(endValue)) {
      setDisplayValue(0);
      return;
    }

    const duration = 1200; // 1200ms

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.floor(easeProgress * endValue);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const ChannelAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [channelData, setChannelData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus('loading');
    setChannelData(null);
    setErrorMsg('');

    try {
      const response = await axios.get('/api/channel', {
        params: { channelUrl: url }
      });
      setChannelData(response.data);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to analyze channel.');
      setStatus('error');
    }
  };

  const getMilestone = (subs) => {
    const num = Number(subs);
    if (isNaN(num)) return { next: 1000, progress: 0 };
    if (num < 1000) return { next: 1000, progress: (num / 1000) * 100 };
    if (num < 10000) return { next: 10000, progress: (num / 10000) * 100 };
    if (num < 100000) return { next: 100000, progress: (num / 100000) * 100 };
    if (num < 1000000) return { next: 1000000, progress: (num / 1000000) * 100 };
    const nextMil = Math.ceil(num / 1000000) * 1000000;
    return { next: nextMil, progress: (num / nextMil) * 100 };
  };

  const milestone = channelData ? getMilestone(channelData.subscriberCount) : { next: 1000, progress: 0 };

  return (
    <div className="page-wrapper">
      <div className="channel-analyzer-page animate-fade-in">
        <h1 className="channel-title">Channel Analyzer</h1>
        
        <div className="channel-search-section">
          <form className="channel-form" onSubmit={handleSubmit}>
            <input 
              type="text" 
              className="dashboard-input" 
              placeholder="Paste a YouTube channel URL..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'loading'}
            />
            <button type="submit" className="dashboard-submit-btn" disabled={status === 'loading'}>
              Analyze
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
            <p className="loading-text">Fetching channel statistics</p>
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
            </div>
          </div>
        )}

        {status === 'success' && channelData && (
          <div className="channel-results animate-fade-in">
            {/* Channel Info Card */}
            <div className="channel-header-card card">
              <img src={channelData.avatarUrl} alt="Channel Avatar" className="channel-avatar-img" />
              <div className="channel-info-details">
                <h2 className="channel-header-name">{channelData.name}</h2>
                <p className="channel-header-desc">{channelData.description}</p>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="channel-stats-grid">
              <div className="channel-stat-card card">
                <div className="stat-number">
                  <AnimatedNumber value={channelData.subscriberCount} />
                </div>
                <div className="stat-label">Subscribers</div>
              </div>
              <div className="channel-stat-card card">
                <div className="stat-number">
                  <AnimatedNumber value={channelData.viewCount} />
                </div>
                <div className="stat-label">Total Views</div>
              </div>
              <div className="channel-stat-card card">
                <div className="stat-number">
                  <AnimatedNumber value={channelData.videoCount} />
                </div>
                <div className="stat-label">Total Videos</div>
              </div>
              <div className="channel-stat-card card">
                <div className="stat-number">
                  <AnimatedNumber value={channelData.recentVideos?.length || 0} />
                </div>
                <div className="stat-label">Recent Videos</div>
              </div>
            </div>

            {/* Milestone Card */}
            <div className="milestone-progress-card card">
              <div className="milestone-progress-container">
                <div className="milestone-label-row">
                  <span>Progress to next subscriber milestone ({Number(milestone.next).toLocaleString()})</span>
                  <span>{Math.round(milestone.progress)}%</span>
                </div>
                <div className="milestone-progress-track">
                  <div className="milestone-progress-fill" style={{ width: `${milestone.progress}%` }}></div>
                </div>
              </div>
            </div>

            {/* Videos Grid */}
            <h3 className="channel-section-title">10 Most Recent Videos</h3>
            <div className="recent-videos-grid">
              {channelData.recentVideos.map((vid, idx) => (
                <a 
                  key={vid.videoId} 
                  href={`https://youtube.com/watch?v=${vid.videoId}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="recent-video-card card"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <img src={vid.thumbnailUrl} alt={vid.title} className="recent-video-thumb" />
                  <h4 className="recent-video-title">{vid.title}</h4>
                  <div className="watch-overlay">
                    <ExternalLink size={16} />
                    <span>Watch on YouTube</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelAnalyzer;
