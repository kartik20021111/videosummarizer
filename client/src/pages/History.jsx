import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ResultsDisplay from '../components/ResultsDisplay';
import './History.css';

const History = () => {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vsHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to parse history', err);
    }
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire analysis history? This cannot be undone.')) {
      localStorage.removeItem('vsHistory');
      setHistory([]);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredHistory = history.filter(item => 
    (item.videoTitle || item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.channelName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="history-page animate-fade-in">
        <div className="history-header">
          <h1 className="history-title">History</h1>
          {history.length > 0 && (
            <button className="clear-history-btn" onClick={handleClearHistory}>
              Clear History
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <>
            <div className="search-bar-wrapper">
              <input 
                type="text" 
                className="history-search" 
                placeholder="Search history by title or channel..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="history-list">
              {filteredHistory.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`history-card ${expandedId === item.id ? 'expanded' : ''}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="history-card-header" onClick={() => toggleExpand(item.id)}>
                    <img src={item.thumbnailUrl} alt="Thumbnail" className="history-thumb" />
                    <div className="history-info">
                      <h3 className="history-item-title">{item.videoTitle || item.title}</h3>
                      <div className="history-meta-row">
                        <span className="history-meta-item">{item.channelName}</span>
                        <span className="history-meta-divider">•</span>
                        <span className="history-meta-item">
                          {new Date(item.dateAnalyzed).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="history-preview">{item.executiveSummary}</p>
                    </div>
                  </div>
                  
                  {/* Expanded block with transition */}
                  <div className={`history-expanded-wrapper ${expandedId === item.id ? 'open' : ''}`}>
                    <div className="history-expanded-inner">
                      <ResultsDisplay data={item} />
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredHistory.length === 0 && (
                <div className="history-empty-state">
                  <p className="empty-text-main">No matching history found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="history-empty-state">
            <div className="empty-clock-wrapper">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="history-empty-clock">
                <circle cx="32" cy="32" r="28" fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1.5" />
                <line x1="32" y1="32" x2="32" y2="16" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" className="clock-hand-hour" />
                <line x1="32" y1="32" x2="44" y2="32" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" className="clock-hand-minute" />
              </svg>
            </div>
            <h2 className="empty-text-main">No videos analyzed yet</h2>
            <p className="empty-text-sub">Summarize some videos and they will automatically appear here.</p>
            <button className="btn-primary empty-go-btn" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
