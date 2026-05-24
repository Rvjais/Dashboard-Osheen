const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { User } = require('../models');
const { google } = require('googleapis');

// Get Google Calendar auth URL
router.get('/auth-url', auth, async (req, res) => {
  try {
    const { client } = require('../middleware/google');
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'email',
        'profile',
        'openid'
      ],
      prompt: 'consent',
      state: req.userId
    });
    res.json({ authUrl });
  } catch (error) {
    console.error('Calendar auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Handle OAuth callback
router.post('/callback', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const { client } = require('../middleware/google');
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Store refresh token
    if (tokens.refresh_token) {
      await User.update(
        { googleAccessToken: JSON.stringify(tokens) },
        { where: { id: req.userId } }
      );
    }

    res.json({ message: 'Calendar connected successfully' });
  } catch (error) {
    console.error('Calendar callback error:', error);
    res.status(500).json({ error: 'Failed to connect calendar' });
  }
});

// Fetch upcoming events
router.get('/events', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user.googleAccessToken) {
      return res.status(400).json({ error: 'Calendar not connected' });
    }

    const { client } = require('../middleware/google');
    const tokens = JSON.parse(user.googleAccessToken);
    client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items.map((event) => ({
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description || '',
    }));

    res.json({ events });
  } catch (error) {
    console.error('Calendar events error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

module.exports = router;
