# Game API Integration Setup Guide

## Overview
Your gaming platform now uses the **RAWG Video Games Database API** to fetch real game data, images, and details in real-time.

## What's Integrated

### 1. **Real Game Data**
- Live game titles, descriptions, and images
- Ratings and metacritic scores
- Release dates and developers
- Genres and platforms
- Store availability

### 2. **Dynamic Game Grid**
- Automatic fetching of trending and top-rated games
- Genre-based filtering (Action, RPG, Strategy, etc.)
- Real game images instead of placeholder emojis
- Responsive grid layout

### 3. **Featured Section**
- Trending games displayed on homepage
- Top-rated games in sidebar
- Real images and detailed information

## API Details

**Service:** RAWG Video Games Database API
**Website:** https://rawg.io/api
**Cost:** FREE (No key required for basic requests)
**Rate Limit:** 20 requests per hour (unregistered), 60+ with key

## Getting an API Key (Optional)

For higher rate limits and better performance:

1. Go to https://rawg.io/api
2. Click "Sign in" (top right)
3. Create a free account
4. Generate API key in dashboard
5. In `game-api.js`, update:
   ```javascript
   const RAWG_API_KEY = 'your_api_key_here';
   ```

## File Structure

- **game-api.js** - API integration and data fetching
- **Gamers_hub.js** - Updated to use API data
- **Gamers_hub.html** - Updated HTML structure

## Key Functions

### GameAPIManager Class

```javascript
// Fetch games with filters
await gameAPI.fetchGames({ ordering: '-rating', pageSize: 20 });

// Get trending games
await gameAPI.getTrendingGames(20);

// Get top-rated games
await gameAPI.getTopRatedGames(20);

// Get games by genre
await gameAPI.getGamesByGenre(genreId, 20);

// Search games
await gameAPI.searchGames('query');
```

## Genre IDs (For API)

- Action: 4
- RPG: 5
- Racing: 1
- Puzzle: 2
- Shooter: 3
- Sci-Fi: 6
- Platformer: 83
- Sports: 15
- Strategy: 10
- Rhythm: 14
- Horror: 40

## Features Implemented

✅ **Real-time Game Data**
✅ **High-Quality Game Images**
✅ **Genre Filtering**
✅ **Search Functionality**
✅ **Rating Display (Metacritic & User)**
✅ **Platform Information**
✅ **Developer/Publisher Details**
✅ **Release Date Tracking**
✅ **Responsive Design**
✅ **Caching (1-hour expiry)**

## Usage Examples

### Display Games in Custom Container
```javascript
const games = await gameAPI.getTrendingGames(10);
await renderGames(document.querySelector('#container'), games, 'grid');
```

### Search Games
```javascript
const results = await gameAPI.searchGames('Cyberpunk');
```

### Filter by Genre
```javascript
const actionGames = await gameAPI.getGamesByGenre(4, 20); // Action games
```

## Customization

### Change Default Sorting
In `game-api.js`, update the `fetchGames()` ordering parameter:
- `-rating` - Highest rated first
- `-released` - Most recently released
- `-popularity` - Most popular
- `-metacritic` - Highest Metacritic score

### Change Cache Duration
In `game-api.js`:
```javascript
this.cacheExpiry = 3600000; // 1 hour (change to your preference)
```

### Change Game Card Layout
Update HTML generation in `createGameCard()` function to customize card design.

## API Response Sample

```json
{
  "id": 3498,
  "name": "Grand Theft Auto V",
  "background_image": "...",
  "rating": 4.5,
  "metacritic": 97,
  "genres": [{"name": "Action"}],
  "platforms": [{"platform": {"name": "PC"}}],
  "released": "2013-09-17",
  "developers": [{"name": "Rockstar North"}],
  "publishers": [{"name": "Rockstar Games"}]
}
```

## Troubleshooting

### Games not loading?
1. Check browser console for errors
2. Verify RAWG API is accessible
3. Check rate limit (20 requests/hour without key)
4. Clear browser cache

### Images not showing?
1. RAWG API may have removed the image
2. Check network tab for 404 errors
3. Fallback placeholder will display

### Rate limit exceeded?
1. Get a free API key from https://rawg.io/api
2. Add to game-api.js
3. Restart the application

## Next Steps

1. ✅ API integration complete
2. 📊 Monitor API usage in browser console
3. 🎮 Add more genres or customize sorting
4. 🔑 Get API key for higher limits (optional)
5. 📱 Test on mobile devices

## Support Resources

- RAWG API Docs: https://rawg.io/api
- API Documentation: https://api.rawg.io/docs/
- GitHub Issues: Report bugs or request features

---

**Last Updated:** 2026-06-18
**Status:** ✅ Active and Running
