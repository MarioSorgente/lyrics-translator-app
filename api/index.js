// api/index.js

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

/**
 * GET /song
 * Expects query parameters: artist and title.
 * Searches YouTube for the song video and fetches lyrics using Lyrics.ovh.
 */
app.get('/song', async (req, res) => {
  const { artist, title } = req.query;
  if (!artist || !title) {
    return res.status(400).json({ error: 'Artist and title query parameters are required.' });
  }
  try {
    // Build the search query for YouTube
    const query = `${artist} ${title} official music video`;
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`;
    const youtubeResponse = await axios.get(youtubeUrl);
    if (youtubeResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'No video found.' });
    }
    const videoId = youtubeResponse.data.items[0].id.videoId;

    // Fetch lyrics using Lyrics.ovh (free, no API key required)
    const lyricsUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const lyricsResponse = await axios.get(lyricsUrl);
    const lyrics = lyricsResponse.data.lyrics;

    res.json({
      videoId,
      title,
      lyrics,
    });
  } catch (error) {
    console.error('Error in /song:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching song data.' });
  }
});

/**
 * POST /translate
 * Expects a JSON body with: text, targetLang, and (optionally) sourceLang.
 * Translates the provided text using LibreTranslate.
 */
app.post('/translate', async (req, res) => {
  const { text, targetLang, sourceLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and targetLang are required.' });
  }
  try {
    const source = sourceLang || 'auto';
    const libreResponse = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: source,
        target: targetLang,
        format: "text"
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    res.json({ translatedText: libreResponse.data.translatedText });
  } catch (error) {
    console.error('Error in /translate:', error.message);
    res.status(500).json({ error: 'Error translating text.' });
  }
});

/**
 * POST /feedback
 * Expects a JSON body with: email and feedback.
 */
app.post('/feedback', async (req, res) => {
  const { email, feedback } = req.body;
  console.log(`Feedback received from ${email}: ${feedback}`);
  res.json({ message: 'Feedback received.' });
});

/**
 * GET /
 * Basic test route.
 */
app.get('/', (req, res) => {
  res.send('Backend is running.');
});

// Export the Express app as a serverless function using serverless-http
module.exports = require('serverless-http')(app);
