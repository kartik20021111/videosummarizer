require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const Groq = require('groq-sdk');
const { YoutubeTranscript } = require('youtube-transcript');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log('YOUTUBE_API_KEY exists:', !!process.env.YOUTUBE_API_KEY);
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);

const app = express();

// ✅ CORS — locked to your domain only
const allowedOrigins = [
  'https://videosummarizer-brown.vercel.app',
  'http://localhost:5173' // for local dev only
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// ✅ Rate limiting — 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '10kb' })); // ✅ Body size limit — prevents large payload attacks

// ✅ YouTube URL validator
function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.length > 200) return false; // ✅ Long input DoS protection
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
  return pattern.test(url);
}

const summarizeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: { error: 'Daily limit reached. This app is a personal project with limited API capacity. Please try again tomorrow. This protects the Groq API quota from being used up by a single user' },
  standardHeaders: true,
  legacyHeaders: false,
});

function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Unknown duration';
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  let parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' ') : 'Unknown duration';
}

function parseDurationToSeconds(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 300;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

async function generateSummaryData(url, summaryLength = 'Standard', contentPreferences = []) {
  // ✅ Strict YouTube URL validation
  if (!isValidYouTubeUrl(url)) {
    throw { status: 400, message: 'Please provide a valid YouTube URL.' };
  }

  if (!url.includes('youtube.com/watch') && !url.includes('youtu.be')) {
    throw { status: 400, message: 'Currently only YouTube links are supported.' };
  }

  let videoId = null;
  if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
  else if (url.includes('youtube.com/watch')) videoId = new URL(url).searchParams.get('v');

  // ✅ Validate video ID format
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    throw { status: 400, message: 'Could not read this YouTube URL. Please check it and try again.' };
  }

  if (!YOUTUBE_API_KEY) throw { status: 500, message: 'Service configuration error.' }; // ✅ No key details exposed

  const videoListResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: { part: 'snippet,contentDetails', id: videoId, key: YOUTUBE_API_KEY },
    timeout: 10000 // ✅ 10 second timeout on external calls
  });

  if (!videoListResponse.data.items || videoListResponse.data.items.length === 0) {
    throw { status: 400, message: 'This video could not be found. It may be private or deleted.' };
  }

  const snippet = videoListResponse.data.items[0].snippet;
  const contentDetails = videoListResponse.data.items[0].contentDetails;
  const title = snippet.title;
  const channelName = snippet.channelTitle;
  const thumbnails = snippet.thumbnails;
  const thumbnailUrl = (thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default).url;
  const duration = parseDuration(contentDetails.duration);

  let plainText = '';
  let timedSegments = [];
  try {
    const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
    plainText = transcriptList.map(item => item.text).join(' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"');

    const totalSegments = transcriptList.length;
    const step = Math.max(1, Math.floor(totalSegments / 15));
    const selectedList = [];
    for (let i = 0; i < totalSegments; i += step) {
      selectedList.push(transcriptList[i]);
      if (selectedList.length >= 15) break;
    }

    timedSegments = selectedList.map(item => ({
      seconds: Math.floor(item.offset / 1000),
      text: item.text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    }));
  } catch (error) {
    console.error('Transcript error:', error.message, error.stack);
    if (error.response?.data) {
      console.error('Transcript error axios details:', error.response.data);
    }
    const fallbackText = (snippet.title + " " + (snippet.description || "")).trim();
    if (fallbackText.length >= 20) {
      plainText = `Video Title: ${snippet.title}\n\nDescription:\n${snippet.description || 'No description available.'}`;
      const durationInSeconds = parseDurationToSeconds(contentDetails.duration);
      timedSegments = [
        { seconds: 0, text: "Introduction" },
        { seconds: Math.floor(durationInSeconds * 0.2), text: "Key Concepts" },
        { seconds: Math.floor(durationInSeconds * 0.4), text: "Deep Dive" },
        { seconds: Math.floor(durationInSeconds * 0.6), text: "Detailed Analysis" },
        { seconds: Math.floor(durationInSeconds * 0.8), text: "Further Discussion" },
        { seconds: Math.max(0, durationInSeconds - 2), text: "Conclusion" }
      ];
    } else {
      throw { status: 400, message: 'This video does not have captions available. Try a different video.' };
    }
  }

  if (plainText.length < 30) throw { status: 400, message: 'This video transcript is too short to summarize.' };

  if (!GROQ_API_KEY) throw { status: 500, message: 'Service configuration error.' }; // ✅ No key details exposed

  // ✅ Sanitize contentPreferences — only allow strings, max 5 items, max 50 chars each
  const safePreferences = Array.isArray(contentPreferences)
    ? contentPreferences
        .filter(p => typeof p === 'string')
        .slice(0, 5)
        .map(p => p.substring(0, 50).replace(/[<>\"']/g, ''))
    : [];

  const preferencesStr = safePreferences.length > 0 ? safePreferences.join(', ') : 'general interest';

  let lengthSpec = '';
  if (summaryLength === 'Brief') {
    lengthSpec = `1. "executiveSummary": string, exactly 2 to 3 sentences.
2. "mainTopic": string, one sentence.
3. "keyPoints": array of strings. Exactly 3 to 4 points. Each key point must be 1 to 2 sentences long. Total word count across all key points must be 200 to 300 words.
4. "context": string, full paragraph of exactly 2 to 3 sentences explaining broader background (do NOT use the word "insights").`;
  } else if (summaryLength === 'Comprehensive') {
    lengthSpec = `1. "executiveSummary": string, exactly 5 to 6 sentences.
2. "mainTopic": string, one sentence.
3. "keyPoints": array of strings. Exactly 10 to 12 points. Each key point must be 3 sentences long. Total word count across all key points must be 800 to 900 words.
4. "context": string, full paragraph of exactly 5 to 6 sentences explaining broader background (do NOT use the word "insights").`;
  } else {
    lengthSpec = `1. "executiveSummary": string, exactly 3 to 4 sentences.
2. "mainTopic": string, one sentence.
3. "keyPoints": array of strings. Exactly 5 to 6 points. Each key point must be 2 sentences long. Total word count across all key points must be 400 to 500 words.
4. "context": string, full paragraph of exactly 3 to 4 sentences explaining broader background (do NOT use the word "insights").`;
  }

  const systemPrompt = `You are an expert video analyst. Given a transcript, return ONLY a raw JSON object containing the detailed video analysis.
YOU MUST STRICTLY FOLLOW THE WORD COUNT AND SENTENCE COUNT REQUIREMENTS SPECIFIED BELOW. DO NOT RETURN FEWER WORDS THAN SPECIFIED. EACH KEY POINT MUST BE SUBSTANTIVE AND DETAILED.
The JSON object must have exactly the following keys:
${lengthSpec}
5. "people": array of strings, full names of people mentioned in the video (if none, return empty array).
6. "exploreNext": array of strings. Exactly 3 strings suggesting concepts/topics the user should explore next.
7. "timestamps": array of 6 to 8 objects with keys "seconds" (number, start time in seconds, which MUST match one of the seconds from the provided Timed Caption Segments exactly) and "label" (string, short description).
8. "recommendations": array of exactly 5 objects with keys "title" (string, title of recommendation) and "searchQuery" (string, search query to find relevant content on YouTube). Tailor these closely to these viewer preferences: ${preferencesStr}.

Return NOTHING except the raw JSON object. Do not include markdown code blocks.`;

  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Timed Caption Segments (spaced across the video for timestamps):\n${JSON.stringify(timedSegments)}\n\nFull Transcript:\n${plainText.substring(0, 15000)}`
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: "json_object" }
  });

  let resultData;
  try {
    let rawText = completion.choices[0]?.message?.content || '{}';
    rawText = rawText.replace(/^```json/m, '').replace(/^```/m, '').trim();
    if (rawText.endsWith('```')) rawText = rawText.slice(0, -3).trim();
    resultData = JSON.parse(rawText);
  } catch (error) {
    console.error('JSON Parse Error:', error.message); // ✅ Only logs message, not full stack
    throw { status: 500, message: 'Failed to generate a properly structured summary.' };
  }

  return { videoId, title, channelName, thumbnailUrl, duration, ...resultData };
}

// ✅ /api/summarize — with full input validation and rate limiting
app.post('/api/summarize', summarizeLimiter, async (req, res) => {
  try {
    const { url, contentPreferences, summaryLength } = req.body;

    // ✅ Input length checks
    if (!url || typeof url !== 'string' || url.length > 200) {
      return res.status(400).json({ error: 'Invalid URL provided.' });
    }

    let resolvedLength = summaryLength || 'Standard';
    if (!['Brief', 'Standard', 'Comprehensive'].includes(resolvedLength)) {
      resolvedLength = 'Standard'; // ✅ Whitelist allowed values
    }

    const data = await generateSummaryData(url, resolvedLength, contentPreferences);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Summarize API Error:', error.message, error.stack);
    if (error.response?.data) {
      console.error('Summarize API Axios Error Data:', error.response.data);
    }
    if (error.status) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again in a moment.' });
  }
});

// ✅ /api/compare — with input validation
app.post('/api/compare', async (req, res) => {
  try {
    const { url1, url2 } = req.body;

    if (!url1 || !url2) return res.status(400).json({ error: 'Please provide both URLs.' });
    if (typeof url1 !== 'string' || typeof url2 !== 'string') return res.status(400).json({ error: 'Invalid input.' });
    if (url1.length > 200 || url2.length > 200) return res.status(400).json({ error: 'URL too long.' });

    const [video1, video2] = await Promise.all([
      generateSummaryData(url1, 'Standard', []),
      generateSummaryData(url2, 'Standard', [])
    ]);
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an AI assistant. Given summaries of two videos, write exactly one concise sentence observing how they relate to each other, compare, or contrast.' },
        { role: 'user', content: `Video 1: ${video1.title} - ${video1.executiveSummary}\n\nVideo 2: ${video2.title} - ${video2.executiveSummary}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3
    });
    const similarityNote = completion.choices[0]?.message?.content?.trim() || 'These videos offer interesting comparative insights.';
    return res.status(200).json({ video1, video2, similarityNote });
  } catch (error) {
    console.error('Compare API Error:', error.message, error.stack);
    if (error.response?.data) {
      console.error('Compare API Axios Error Data:', error.response.data);
    }
    if (error.status) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'Something went wrong while comparing the videos.' });
  }
});

// ✅ /api/channel — with input validation
app.get('/api/channel', async (req, res) => {
  try {
    const { channelUrl } = req.query;
    if (!channelUrl) return res.status(400).json({ error: 'Please provide a channel URL.' });
    if (typeof channelUrl !== 'string' || channelUrl.length > 200) return res.status(400).json({ error: 'Invalid channel URL.' });
    if (!channelUrl.includes('youtube.com')) return res.status(400).json({ error: 'Only YouTube channel URLs are supported.' });

    let channelId = null, handle = null;
    if (channelUrl.includes('/channel/')) channelId = channelUrl.split('/channel/')[1].split('/')[0].split('?')[0];
    else if (channelUrl.includes('/@')) handle = channelUrl.split('/@')[1].split('/')[0].split('?')[0];
    else if (channelUrl.includes('/c/')) handle = channelUrl.split('/c/')[1].split('/')[0].split('?')[0];

    // ✅ Validate extracted ID/handle format
    if (channelId && !/^[\w-]{1,50}$/.test(channelId)) return res.status(400).json({ error: 'Invalid channel ID.' });
    if (handle && !/^[\w-]{1,50}$/.test(handle)) return res.status(400).json({ error: 'Invalid channel handle.' });

    if (!YOUTUBE_API_KEY) return res.status(500).json({ error: 'Service configuration error.' });

    let channelData = null;
    if (channelId) {
      const resp = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'snippet,statistics', id: channelId, key: YOUTUBE_API_KEY },
        timeout: 10000
      });
      if (resp.data.items && resp.data.items.length > 0) channelData = resp.data.items[0];
    } else if (handle) {
      const searchResp = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', type: 'channel', q: '@' + handle, maxResults: 1, key: YOUTUBE_API_KEY },
        timeout: 10000
      });
      if (searchResp.data.items && searchResp.data.items.length > 0) {
        const foundChannelId = searchResp.data.items[0].id.channelId;
        const resp = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'snippet,statistics', id: foundChannelId, key: YOUTUBE_API_KEY },
          timeout: 10000
        });
        if (resp.data.items && resp.data.items.length > 0) channelData = resp.data.items[0];
      }
    }

    if (!channelData) return res.status(404).json({ error: 'Channel not found.' });

    const resolvedChannelId = channelData.id;
    const name = channelData.snippet.title;
    const description = channelData.snippet.description;
    const avatarUrl = channelData.snippet.thumbnails?.high?.url || channelData.snippet.thumbnails?.default?.url;
    const subscriberCount = channelData.statistics.subscriberCount;
    const viewCount = channelData.statistics.viewCount;
    const videoCount = channelData.statistics.videoCount;

    const recentVideosResp = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', channelId: resolvedChannelId, order: 'date', type: 'video', maxResults: 10, key: YOUTUBE_API_KEY },
      timeout: 10000
    });

    const recentVideos = (recentVideosResp.data.items || []).map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url
    }));

    return res.status(200).json({ id: resolvedChannelId, name, description, avatarUrl, subscriberCount, viewCount, videoCount, recentVideos });
  } catch (error) {
    console.error('Channel Analyzer Error:', error.message, error.stack);
    if (error.response?.data) {
      console.error('Channel Analyzer Axios Error Data:', error.response.data);
    }
    return res.status(500).json({ error: 'Failed to analyze channel.' });
  }
});

module.exports = app;
export default app;
