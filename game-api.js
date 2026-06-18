// Game API Integration - RAWG Video Games Database
// Free API: https://rawg.io/

const RAWG_API_KEY = 'your_api_key_here'; // Get free key from https://rawg.io/api/
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// For now, using a public/open endpoint (no key required for basic requests)
class GameAPIManager {
  constructor() {
    this.cache = {};
    this.cacheExpiry = 3600000; // 1 hour
  }

  async fetchGames(filters = {}) {
    try {
      const cacheKey = JSON.stringify(filters);
      
      // Check cache
      if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheExpiry) {
        return this.cache[cacheKey].data;
      }

      // Build query parameters
      const params = new URLSearchParams({
        ordering: filters.ordering || '-rating,-metacritic',
        page_size: filters.pageSize || 20,
        parent_platforms: filters.platforms || '',
        genres: filters.genres || '',
        ...filters
      });

      // Remove empty parameters
      params.forEach((value, key) => {
        if (!value) params.delete(key);
      });

      const response = await fetch(`${RAWG_BASE_URL}/games?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the results
      this.cache[cacheKey] = {
        data: data.results || [],
        timestamp: Date.now()
      };

      return data.results || [];
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  async getGameDetails(gameId) {
    try {
      const response = await fetch(`${RAWG_BASE_URL}/games/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching game details:', error);
      return null;
    }
  }

  async searchGames(query) {
    try {
      const params = new URLSearchParams({
        search: query,
        page_size: 20
      });

      const response = await fetch(`${RAWG_BASE_URL}/games?${params}`);
      if (!response.ok) throw new Error('Search failed');
      
      return await response.json();
    } catch (error) {
      console.error('Error searching games:', error);
      return { results: [] };
    }
  }

  async getGamesByGenre(genreId, limit = 20) {
    return this.fetchGames({
      genres: genreId,
      pageSize: limit
    });
  }

  async getTrendingGames(limit = 20) {
    return this.fetchGames({
      ordering: '-popularity,-rating',
      pageSize: limit
    });
  }

  async getTopRatedGames(limit = 20) {
    return this.fetchGames({
      ordering: '-metacritic',
      pageSize: limit
    });
  }

  formatGameData(game) {
    return {
      id: game.id,
      title: game.name,
      image: game.background_image || 'https://via.placeholder.com/300x400?text=No+Image',
      rating: game.rating ? (game.rating * 20).toFixed(0) : 'N/A',
      metacritic: game.metacritic || 'N/A',
      genres: game.genres ? game.genres.map(g => g.name).join(', ') : 'Unknown',
      platforms: game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'Unknown',
      releaseDate: game.released || 'TBA',
      developer: game.developers ? game.developers[0]?.name || 'Unknown' : 'Unknown',
      publishers: game.publishers ? game.publishers.map(p => p.name).join(', ') : 'Unknown',
      description: game.description_raw || 'No description available',
      website: game.website || '',
      stores: game.stores ? game.stores.map(s => s.store.name).join(', ') : 'Unknown'
    };
  }
}

// Initialize API manager
const gameAPI = new GameAPIManager();

// Render games function
async function renderGames(container, games, template = 'grid') {
  if (!games || games.length === 0) {
    container.innerHTML = '<p style="color: var(--dim); text-align: center; padding: 40px;">No games found</p>';
    return;
  }

  container.innerHTML = '';

  for (const game of games) {
    const formattedGame = gameAPI.formatGameData(game);
    
    if (template === 'featured') {
      container.innerHTML += createFeaturedCard(formattedGame);
    } else if (template === 'side') {
      container.innerHTML += createSideCard(formattedGame);
    } else {
      container.innerHTML += createGameCard(formattedGame);
    }
  }
}

function createGameCard(game) {
  return `
    <div class="game-card" data-game-id="${game.id}">
      <div class="game-image">
        <img src="${game.image}" alt="${game.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400?text=${encodeURIComponent(game.title)}'">
        <div class="game-overlay">
          <div class="rating-badge">${game.rating}%</div>
          <button class="play-btn">▶ Play Now</button>
        </div>
      </div>
      <div class="game-info">
        <h3>${game.title}</h3>
        <div class="genres">${game.genres}</div>
        <div class="meta">
          <span>⭐ ${game.metacritic !== 'N/A' ? game.metacritic : game.rating}</span>
          <span>${new Date(game.releaseDate).getFullYear()}</span>
        </div>
        <div class="platforms">${game.platforms}</div>
      </div>
    </div>
  `;
}

function createFeaturedCard(game) {
  return `
    <div class="featured-main" data-game-id="${game.id}">
      <div class="featured-bg" style="background-image: url('${game.image}'); background-size: cover; background-position: center;">
        <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(5,5,8,0.8) 0%, rgba(5,5,8,0.4) 100%);"></div>
      </div>
      <div class="featured-content">
        <span class="featured-tag">⚡ FEATURED GAME</span>
        <h3 class="featured-title">${game.title}</h3>
        <p class="featured-desc">${game.genres}</p>
        <div style="display:flex;gap:12px;align-items:center">
          <a href="#" class="btn-primary" onclick="window.open('${game.website}', '_blank'); return false;">Play Now</a>
          <span style="color:var(--gold);font-family:'Orbitron',monospace;font-size:1rem;font-weight:900;">★ ${game.metacritic !== 'N/A' ? game.metacritic : game.rating}</span>
        </div>
      </div>
    </div>
  `;
}

function createSideCard(game) {
  return `
    <div class="side-card" data-game-id="${game.id}">
      <img src="${game.image}" alt="${game.title}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px;">
      <div class="side-info">
        <div class="side-genre">${game.genres.split(',')[0]}</div>
        <div class="side-title">${game.title.substring(0, 30)}</div>
        <div class="side-rating">★ ${game.metacritic !== 'N/A' ? game.metacritic : game.rating}</div>
      </div>
    </div>
  `;
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchBars = document.querySelectorAll('.search-bar-hero input, .search-bar input');
  const searchButtons = document.querySelectorAll('.search-bar-hero button, .search-bar button');

  searchBars.forEach((input, index) => {
    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await performSearch(input.value);
      }
    });
  });

  searchButtons.forEach((btn, index) => {
    btn.addEventListener('click', async () => {
      const input = btn.previousElementSibling;
      await performSearch(input.value);
    });
  });
});

async function performSearch(query) {
  if (!query.trim()) return;
  
  console.log('Searching for:', query);
  const results = await gameAPI.searchGames(query);
  
  // Display results - you can update this to show in a modal or dedicated section
  console.log('Search results:', results.results);
  
  // Option: Update featured section with results
  if (results.results && results.results.length > 0) {
    const featuredContainer = document.querySelector('.featured-side');
    if (featuredContainer) {
      await renderGames(featuredContainer, results.results.slice(0, 3), 'side');
    }
  }
}

// Load games on page load
async function initializeGames() {
  try {
    // Load featured/trending games
    const trendingGames = await gameAPI.getTrendingGames(1);
    const featuredContainer = document.querySelector('.featured-main');
    if (featuredContainer && trendingGames.length > 0) {
      featuredContainer.innerHTML = createFeaturedCard(gameAPI.formatGameData(trendingGames[0]));
    }

    // Load side cards (top rated)
    const topRated = await gameAPI.getTopRatedGames(3);
    const sideContainer = document.querySelector('.featured-side');
    if (sideContainer && topRated.length > 0) {
      await renderGames(sideContainer, topRated, 'side');
    }

    // Load main game grid
    const allGames = await gameAPI.getTrendingGames(20);
    const gamesContainer = document.querySelector('.games-grid');
    if (gamesContainer && allGames.length > 0) {
      await renderGames(gamesContainer, allGames, 'grid');
    }

    console.log('✓ Games loaded successfully');
  } catch (error) {
    console.error('Error initializing games:', error);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGames);
} else {
  initializeGames();
}
