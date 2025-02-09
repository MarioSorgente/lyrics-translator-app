// backend/server.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * STEP 5: YouTube Song & Lyrics Endpoint
 * - Expects query parameters: artist and title.
 * - Searches YouTube for the song video using the YouTube Data API.
 * - Fetches lyrics from the Lyrics.ovh API.
 */
app.get('/api/song', async (req, res) => {
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
    console.error('Error in /api/song:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching song data.' });
  }
});

/**
 * STEP 6: Translation Endpoint using LibreTranslate
 * - Expects a JSON body with: text, targetLang, and (optionally) sourceLang.
 * - Translates the provided text to the target language.
 */
app.post('/api/translate', async (req, res) => {
  const { text, targetLang, sourceLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and targetLang are required.' });
  }
  try {
    // Use 'auto' for source language if not provided.
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
    console.error('Error in /api/translate:', error.message);
    res.status(500).json({ error: 'Error translating text.' });
  }
});

/**
 * Feedback Endpoint
 */
app.post('/api/feedback', async (req, res) => {
  const { email, feedback } = req.body;
  console.log(`Feedback received from ${email}: ${feedback}`);
  res.json({ message: 'Feedback received.' });
});

/**
 * Basic test route
 */
app.get('/', (req, res) => {
  res.send('Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
