import React, { useState, useEffect } from 'react';
import { THEMES, applyTheme } from '../utils/theme';
import { Check } from 'lucide-react';
import './Settings.css';

const PREFERENCES = [
  'Technology', 'Science', 'Education', 'Business', 'Finance',
  'Health', 'Entertainment', 'Gaming', 'News', 'History',
  'Sports', 'AI and Machine Learning', 'Personal Finance', 'Productivity',
  'Psychology', 'Philosophy', 'Politics', 'Food and Cooking', 'Travel',
  'Fitness', 'Music', 'Cinema and Film', 'Space and Astronomy',
  'Environment and Climate', 'Startups and Entrepreneurship', 'Self Improvement',
  'Parenting', 'Design and Creativity', 'Language Learning', 'True Crime'
];

const THEME_PREVIEWS = [
  { id: 'ink', name: 'Ink', bg: '#0F0E0C', surface: '#1C1A16', accent: '#D4A853' },
  { id: 'midnight', name: 'Midnight', bg: '#080C14', surface: '#0F1520', accent: '#4A9EFF' },
  { id: 'ash', name: 'Ash', bg: '#0C0C0E', surface: '#16161A', accent: '#9B8FFF' },
  { id: 'sage', name: 'Sage', bg: '#0A0F0C', surface: '#111A13', accent: '#5DB87A' },
  { id: 'light', name: 'Light', bg: '#F7F5F0', surface: '#FFFFFF', accent: '#C4922A' }
];

const LENGTH_OPTIONS = [
  { id: 'Brief', label: 'Brief', hint: '200 - 300 words' },
  { id: 'Standard', label: 'Standard', hint: '400 - 500 words' },
  { id: 'Comprehensive', label: 'Comprehensive', hint: '800+ words' }
];

const Settings = () => {
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('vsTheme') || 'ink');
  const [summaryLength, setSummaryLength] = useState(() => localStorage.getItem('vsSummaryLength') || 'Standard');
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('contentPreferences');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSelectTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('vsTheme', themeId);
    applyTheme(themeId);
  };

  const handleLengthChange = (length) => {
    setSummaryLength(length);
    localStorage.setItem('vsSummaryLength', length);
  };

  const togglePreference = (pref) => {
    setPreferences(prev => {
      const newPrefs = prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref];
      localStorage.setItem('contentPreferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  return (
    <div className="page-wrapper">
      <div className="settings-page animate-fade-in">
        <h1 className="settings-title">Settings</h1>
        
        <div className="settings-cards-stack">
          {/* Appearance Section */}
          <section className="settings-card card">
            <h2 className="settings-section-heading">Appearance</h2>
            <div className="swatches-grid">
              {THEME_PREVIEWS.map((preview) => (
                <div key={preview.id} className="swatch-container">
                  <button 
                    type="button" 
                    className={`theme-swatch-btn ${currentTheme === preview.id ? 'active' : ''}`}
                    onClick={() => handleSelectTheme(preview.id)}
                    aria-label={`Select ${preview.name} Theme`}
                  >
                    {/* Tiny preview color strip */}
                    <div className="swatch-preview-strips">
                      <div className="swatch-strip" style={{ backgroundColor: preview.bg }}></div>
                      <div className="swatch-strip" style={{ backgroundColor: preview.surface }}></div>
                      <div className="swatch-strip" style={{ backgroundColor: preview.accent }}></div>
                    </div>
                    {currentTheme === preview.id && (
                      <div className="swatch-checkmark-badge">
                        <Check size={10} className="checkmark-icon" />
                      </div>
                    )}
                  </button>
                  <span className="swatch-name-label">{preview.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Summary Length Section */}
          <section className="settings-card card">
            <h2 className="settings-section-heading">Summary Length</h2>
            <div className="radio-rows-wrapper">
              {LENGTH_OPTIONS.map((option) => (
                <div 
                  key={option.id}
                  className={`summary-radio-row ${summaryLength === option.id ? 'selected' : ''}`}
                  onClick={() => handleLengthChange(option.id)}
                >
                  <div className="radio-row-left">
                    <div className={`custom-radio-dot ${summaryLength === option.id ? 'selected' : ''}`}></div>
                    <span className="radio-row-label">{option.label}</span>
                  </div>
                  <span className="word-count-hint">{option.hint}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Content Preferences Section */}
          <section className="settings-card card">
            <h2 className="settings-section-heading">Content Preferences</h2>
            <p className="settings-hint-text">Select topics to personalize AI recommendations.</p>
            <div className="preferences-pills-wrap">
              {PREFERENCES.map(pref => (
                <button 
                  key={pref} 
                  className={`preference-pill-btn ${preferences.includes(pref) ? 'active' : ''}`}
                  onClick={() => togglePreference(pref)}
                >
                  {pref}
                </button>
              ))}
            </div>
            {/* Helper Caption */}
            <p className="preferences-helper-caption">
              Your preferences personalize the recommendations you see after each video analysis
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
