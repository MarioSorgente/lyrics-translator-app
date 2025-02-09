// backend/server.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Translate } = require('@google-cloud/translate').v2;
const deepspeech = require('deepspeech');
const fs = require('fs');
const Wav = require('node-wav');

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
    // Build the search query (you can adjust the query string as needed)
    const query = `${artist} ${title} official music video`;
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`;
    const youtubeResponse = await axios.get(youtubeUrl);
    if (youtubeResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'No video found.' });
    }
    const videoId = youtubeResponse.data.items[0].id.videoId;

    // Use Lyrics.ovh API to fetch lyrics (no API key required)
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
 * STEP 6: Translation Endpoint using Google Cloud Translation API
 * - Expects a JSON body with: text and targetLang.
 * - Translates the provided text to the target language.
 */
const translate = new Translate();
app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and targetLang are required.' });
  }
  try {
    let [translations] = await translate.translate(text, targetLang);
    res.json({ translatedText: translations });
  } catch (error) {
    console.error('Error in /api/translate:', error);
    res.status(500).json({ error: 'Error translating text.' });
  }
});

/**
 * STEP 7: Speech Recognition Endpoint using Mozilla DeepSpeech
 * - Expects a JSON body with a base64-encoded WAV audio (mono, 16kHz recommended).
 * - Uses the DeepSpeech model to transcribe the audio.
 */

// Load DeepSpeech Model
let dsModel;
try {
  const MODEL_PATH = './deepspeech-models'; // Ensure your model files are here
  const modelFilePath = MODEL_PATH + '/deepspeech-0.9.3-models.pbmm';
  const scorerPath = MODEL_PATH + '/deepspeech-0.9.3-models.scorer';
  dsModel = new deepspeech.Model(modelFilePath);
  dsModel.enableExternalScorer(scorerPath);
  console.log('DeepSpeech model loaded successfully.');
} catch (e) {
  console.error('Error loading DeepSpeech model:', e);
}

app.post('/api/speech', async (req, res) => {
  const { audioData } = req.body;
  if (!audioData) {
    return res.status(400).json({ error: 'audioData is required.' });
  }
  if (!dsModel) {
    return res.status(500).json({ error: 'DeepSpeech model not loaded.' });
  }
  try {
    // Convert base64 string to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    // Decode WAV file
    const result = Wav.decode(audioBuffer);
    // Use the first channel (assumes mono; adjust if stereo)
    const audioFloat32 = result.channelData[0];
    const transcription = dsModel.stt(audioFloat32);
    res.json({ transcription });
  } catch (error) {
    console.error('Error in /api/speech:', error);
    res.status(500).json({ error: 'Error processing audio data.' });
  }
});

/**
 * Feedback Endpoint (no changes needed here)
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
