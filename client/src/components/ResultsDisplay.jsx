import React, { useState } from 'react';
import { Copy, FileText, RefreshCw, Search, Clock, User, Book } from 'lucide-react';
import { jsPDF } from 'jspdf';
import './ResultsDisplay.css';

const ResultsDisplay = ({ data, onReset }) => {
  const [isStudyNotesMode, setIsStudyNotesMode] = useState(false);

  if (!data) return null;

  const displayTitle = data.videoTitle || data.title;

  const handleCopy = () => {
    const text = `** Executive Summary **\n${data.executiveSummary}\n\n** Key Points **\n${data.keyPoints.map(p => '- ' + p).join('\n')}`;
    navigator.clipboard.writeText(text);
    alert('Summary copied to clipboard!');
  };

  const addWrappedText = (doc, text, x, yPos, maxWidth, size, isBold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text || '', maxWidth);
    doc.text(lines, x, yPos);
    return yPos + (lines.length * size * 0.4);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    
    y = addWrappedText(doc, displayTitle, 15, y, 180, 16, true) + 10;
    y = addWrappedText(doc, `Channel: ${data.channelName} | Duration: ${data.duration}`, 15, y, 180, 10) + 15;
    
    y = addWrappedText(doc, 'Executive Summary', 15, y, 180, 14, true) + 8;
    y = addWrappedText(doc, data.executiveSummary, 15, y, 180, 12) + 15;

    y = addWrappedText(doc, 'Key Points', 15, y, 180, 14, true) + 8;
    data.keyPoints.forEach(point => {
      if (y > 270) { doc.addPage(); y = 20; }
      y = addWrappedText(doc, '• ' + point, 15, y, 180, 12) + 6;
    });
    
    if (data.people && data.people.length > 0) {
      y += 10;
      if (y > 270) { doc.addPage(); y = 20; }
      y = addWrappedText(doc, 'People Mentioned: ' + data.people.join(', '), 15, y, 180, 12) + 10;
    }

    if (data.context) {
      y += 10;
      if (y > 270) { doc.addPage(); y = 20; }
      y = addWrappedText(doc, 'Context', 15, y, 180, 14, true) + 8;
      y = addWrappedText(doc, data.context, 15, y, 180, 12) + 15;
    }

    doc.save('Video_Summary.pdf');
  };

  const handleExportStudyNotesPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    y = addWrappedText(doc, 'Study Notes: ' + displayTitle, 15, y, 180, 18, true) + 15;

    y = addWrappedText(doc, 'Overview', 15, y, 180, 14, true) + 8;
    y = addWrappedText(doc, data.executiveSummary, 15, y, 180, 12) + 15;

    y = addWrappedText(doc, 'Core Concepts', 15, y, 180, 14, true) + 8;
    data.keyPoints.forEach((point, idx) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const firstSentence = point.split('.')[0] + '.';
      const rest = point.substring(firstSentence.length).trim();
      
      y = addWrappedText(doc, `${idx + 1}. ${firstSentence}`, 15, y, 180, 12, true) + 4;
      if (rest) {
        y = addWrappedText(doc, rest, 15, y, 180, 12) + 8;
      } else {
        y += 4;
      }
    });

    if (data.people && data.people.length > 0) {
      if (y > 270) { doc.addPage(); y = 20; }
      y = addWrappedText(doc, 'Key People', 15, y, 180, 14, true) + 8;
      y = addWrappedText(doc, data.people.join(', '), 15, y, 180, 12) + 15;
    }

    if (data.context) {
      if (y > 270) { doc.addPage(); y = 20; }
      y = addWrappedText(doc, 'Background and Context', 15, y, 180, 14, true) + 8;
      y = addWrappedText(doc, data.context, 15, y, 180, 12) + 15;
    }

    if (data.recommendations && data.recommendations.length > 0) {
      if (y > 270) { doc.addPage(); y = 20; }
      y = addWrappedText(doc, 'Further Exploration', 15, y, 180, 14, true) + 8;
      data.recommendations.forEach((rec, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        y = addWrappedText(doc, `${idx + 1}. ${rec.title}`, 15, y, 180, 12) + 6;
      });
      y += 8;
    }

    if (data.timestamps && data.timestamps.length > 0) {
      if (y > 270) { doc.addPage(); y = 20; }
      y = addWrappedText(doc, 'Key Moments', 15, y, 180, 14, true) + 8;
      data.timestamps.forEach((ts, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        y = addWrappedText(doc, `${idx + 1}. ${formatTimestamp(ts.seconds)} - ${ts.label}`, 15, y, 180, 12) + 6;
      });
    }

    doc.save('Study_Notes.pdf');
  };

  const formatTimestamp = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(Number(seconds))) {
      return '00:00';
    }
    const totalSecs = Math.max(0, Math.floor(Number(seconds)));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getYoutubeId = (url) => {
    if (!url) return '';
    const beMatch = url.match(/youtu\.be\/([\w-]{11})/i);
    if (beMatch) return beMatch[1];
    const vMatch = url.match(/[?&]v=([\w-]{11})/i);
    if (vMatch) return vMatch[1];
    const embedMatch = url.match(/\/(?:embed|v|vi|vi_webp)\/([\w-]{11})/i);
    if (embedMatch) return embedMatch[1];
    const fallbackMatch = url.match(/\/([\w-]{11})(?:\/|\.|\?|$)/);
    if (fallbackMatch) return fallbackMatch[1];
    return '';
  };

  const videoId = data.videoId || getYoutubeId(data.videoUrl) || getYoutubeId(data.thumbnailUrl) || '';

  return (
    <div className="results-display animate-fade-in">
      {/* Video Header Row */}
      <div className="results-header-row">
        <a 
          href={`https://www.youtube.com/watch?v=${videoId}`} 
          target="_blank" 
          rel="noreferrer"
          className="header-thumb-link"
        >
          <img src={data.thumbnailUrl} alt={displayTitle} className="header-thumbnail" />
        </a>
        <div className="header-info-col">
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`} 
            target="_blank" 
            rel="noreferrer"
            className="header-title-link"
          >
            <h2 className="header-video-title">{displayTitle}</h2>
          </a>
          <div className="header-meta-row">
            <span className="header-channel">{data.channelName}</span>
            <span className="duration-badge">{data.duration}</span>
          </div>
        </div>
      </div>

      <div className="results-divider"></div>

      {/* Main Results Stack */}
      <div className="results-sections-stack">
        
        {!isStudyNotesMode ? (
          <>
            {/* Executive Summary */}
            <div className="results-section">
              <div className="section-label">Executive Summary</div>
              <div className="exec-summary-card">
                <p>{data.executiveSummary}</p>
              </div>
            </div>

            {/* Main Topic */}
            <div className="results-section">
              <div className="section-label">Main Topic</div>
              <div className="main-topic-content">
                {data.mainTopic}
              </div>
            </div>

            {/* Key Points */}
            <div className="results-section">
              <div className="section-label">Key Points</div>
              <ul className="key-points-list">
                {data.keyPoints.map((point, idx) => (
                  <li 
                    key={idx} 
                    className="key-point-row" 
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="key-point-bullet"></div>
                    <span className="key-point-text">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quotes (if present) */}
            {data.quotes && data.quotes.length > 0 && (
              <div className="results-section">
                <div className="section-label">Notable Quotes</div>
                <div className="quotes-list">
                  {data.quotes.map((quote, idx) => (
                    <blockquote key={idx} className="results-quote">
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* People Mentioned */}
            {data.people && data.people.length > 0 && (
              <div className="results-section">
                <div className="section-label">People Mentioned</div>
                <div className="people-pills-row">
                  {data.people.map((person, idx) => (
                    <span key={idx} className="people-pill-badge">{person}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Context */}
            {data.context && (
              <div className="results-section">
                <div className="section-label">Context</div>
                <p className="context-paragraph">{data.context}</p>
              </div>
            )}

            {/* Timestamps */}
            {data.timestamps && data.timestamps.length > 0 && (
              <div className="results-section">
                <div className="section-label">Timestamps</div>
                <div className="timestamps-scroll-row">
                  {data.timestamps.map((ts, idx) => (
                    <a 
                      key={idx} 
                      href={`https://www.youtube.com/watch?v=${videoId}&t=${ts.seconds}s`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="timestamp-pill"
                    >
                      <div className="timestamp-time">{formatTimestamp(ts.seconds)}</div>
                      <div className="timestamp-desc">{ts.label}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {data.recommendations && data.recommendations.length > 0 && (
              <div className="results-section">
                <div className="section-label">Recommendations</div>
                <div className="recommendations-scroll-row">
                  {data.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-card">
                      <h4 className="rec-card-title">{rec.title}</h4>
                      <a 
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.searchQuery)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="rec-search-btn"
                      >
                        Search on YouTube
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explore Next Concepts (if present) */}
            {data.exploreNext && data.exploreNext.length > 0 && (
              <div className="results-section">
                <div className="section-label">Explore Next Concepts</div>
                <div className="people-pills-row">
                  {data.exploreNext.map((concept, idx) => (
                    <span key={idx} className="people-pill-badge outline-badge">{concept}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Deep Dive (if present) */}
            {data.deepDive && data.deepDive.length > 0 && (
              <div className="results-section">
                <div className="section-label">Deep Dive Topics</div>
                <div className="people-pills-row">
                  {data.deepDive.map((topic, idx) => (
                    <span key={idx} className="people-pill-badge outline-badge amber-badge">{topic}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Study Notes View */
          <div className="study-notes-container">
            <h2 className="study-title">{displayTitle}</h2>
            
            <section className="study-section">
              <div className="section-label">Overview</div>
              <p className="context-paragraph">{data.executiveSummary}</p>
            </section>

            <section className="study-section">
              <div className="section-label">Core Concepts</div>
              <div className="core-concepts-list">
                {data.keyPoints.map((point, idx) => {
                  const firstSentence = point.split('.')[0] + '.';
                  const rest = point.substring(firstSentence.length).trim();
                  return (
                    <div key={idx} className="concept-item">
                      <h4 className="concept-heading">{idx + 1}. {firstSentence}</h4>
                      {rest && <p className="concept-desc">{rest}</p>}
                    </div>
                  );
                })}
              </div>
            </section>

            {data.people && data.people.length > 0 && (
              <section className="study-section">
                <div className="section-label">Key People</div>
                <div className="people-pills-row">
                  {data.people.map((person, idx) => (
                    <span key={idx} className="people-pill-badge">{person}</span>
                  ))}
                </div>
              </section>
            )}

            {data.context && (
              <section className="study-section">
                <div className="section-label">Background and Context</div>
                <p className="context-paragraph">{data.context}</p>
              </section>
            )}

            {data.recommendations && data.recommendations.length > 0 && (
              <section className="study-section">
                <div className="section-label">Further Exploration</div>
                <ul className="numbered-exploration-list">
                  {data.recommendations.map((rec, idx) => (
                    <li key={idx} className="exploration-item">
                      <strong>{rec.title}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.timestamps && data.timestamps.length > 0 && (
              <section className="study-section">
                <div className="section-label">Key Moments</div>
                <ul className="numbered-exploration-list">
                  {data.timestamps.map((ts, idx) => (
                    <li key={idx} className="exploration-item">
                      <a 
                        href={`https://www.youtube.com/watch?v=${videoId}&t=${ts.seconds}s`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="moment-timestamp-link"
                      >
                        <strong>{formatTimestamp(ts.seconds)}</strong>
                      </a> - {ts.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Row */}
      <div className="results-action-row">
        <button 
          className={`btn-secondary action-btn-secondary ${isStudyNotesMode ? 'active-study-notes' : ''}`} 
          onClick={() => setIsStudyNotesMode(!isStudyNotesMode)}
        >
          <Book size={16}/> Study Notes
        </button>
        <button className="btn-secondary action-btn-secondary" onClick={handleCopy}>
          <Copy size={16}/> Copy Summary
        </button>
        {isStudyNotesMode ? (
          <button className="btn-secondary action-btn-secondary" onClick={handleExportStudyNotesPDF}>
            <FileText size={16}/> Export PDF
          </button>
        ) : (
          <button className="btn-secondary action-btn-secondary" onClick={handleExportPDF}>
            <FileText size={16}/> Export PDF
          </button>
        )}
        {onReset && (
          <button className="dashboard-submit-btn action-btn-primary" onClick={onReset}>
            <RefreshCw size={16}/> Summarize Another
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
