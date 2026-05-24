const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

router.post('/analyze-braindump', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key is not configured on the server' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{
            text: `Analyze the following brain dump and organize it into actionable categories.
Categories should include: Action Items, Key Insights, Questions, and General Notes.
Format the output nicely.

Brain dump:
${text}`
          }]
        }
      ]
    });

    res.json({ analysis: response.text });
  } catch (error) {
    console.error('Gemini analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze brain dump' });
  }
});

router.post('/chat', auth, async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key is not configured on the server' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
});

module.exports = router;
