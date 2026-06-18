// Custom cursor
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

function animateRing() {
  rx += (mx - rx) * 0.15;
  ry += (my - ry) * 0.15;
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a,button,.game-card,.cat-card,.side-card,.stat').forEach(el => {
  el.addEventListener('mouseenter', () => {
    ring.style.width = '60px';
    ring.style.height = '60px';
    ring.style.borderColor = 'rgba(0,245,255,0.8)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.width = '36px';
    ring.style.height = '36px';
    ring.style.borderColor = 'rgba(0,245,255,0.5)';
  });
});

// Genre mapping for API
const genreMap = {
  'action': 4,
  'rpg': 5,
  'strategy': 10,
  'horror': 40,
  'racing': 1,
  'puzzle': 2,
  'platformer': 83,
  'sports': 15,
  'shooter': 3,
  'sci-fi': 6,
  'fantasy': 40,
  'rhythm': 14
};

// API-based rendering
async function renderCardsFromAPI(genre = 'all') {
  const grid = document.getElementById('gamesGrid');
  grid.innerHTML = '<div style="text-align:center;color:var(--dim);padding:40px;">Loading games...</div>';

  try {
    let games;
    if (genre === 'all') {
      games = await gameAPI.getTrendingGames(20);
    } else {
      const genreId = genreMap[genre];
      if (!genreId) {
        games = await gameAPI.getTrendingGames(20);
      } else {
        games = await gameAPI.getGamesByGenre(genreId, 20);
      }
    }

    if (!games || games.length === 0) {
      grid.innerHTML = '<div style="text-align:center;color:var(--dim);padding:40px;">No games found for this genre</div>';
      return;
    }

    grid.innerHTML = games.map(g => {
      const formatted = gameAPI.formatGameData(g);
      return `
        <div class="game-card" data-game-id="${g.id}" data-genre="${g.genres}">
          <div class="card-thumb-wrap">
            <img src="${formatted.image}" alt="${formatted.title}" class="card-thumb" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400?text=${encodeURIComponent(formatted.title)}'">
            <div class="card-overlay">
              <div class="rating-badge-small">${formatted.rating}%</div>
              <button class="play-btn">Explore ▶</button>
            </div>
          </div>
          <div class="card-body">
            <div class="card-genre">${formatted.genres.split(',')[0].toUpperCase()}</div>
            <div class="card-title">${formatted.title}</div>
            <div class="card-desc">${formatted.platforms}</div>
            <div class="card-meta">
              <div class="rating">★ ${formatted.metacritic !== 'N/A' ? formatted.metacritic : formatted.rating}</div>
              <span class="badge badge-new">${new Date(formatted.releaseDate).getFullYear()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-attach hover effects
    attachGameCardHovers();
  } catch (error) {
    console.error('Error rendering games:', error);
    grid.innerHTML = '<div style="text-align:center;color:var(--dim);padding:40px;">Error loading games</div>';
  }
}

function attachGameCardHovers() {
  document.querySelectorAll('.game-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width = '60px';
      ring.style.height = '60px';
      ring.style.borderColor = 'rgba(0,245,255,0.8)';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width = '36px';
      ring.style.height = '36px';
      ring.style.borderColor = 'rgba(0,245,255,0.5)';
    });
  });
}

function filterGames(genre, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCardsFromAPI(genre);
}

// Initialize with API data on page load
window.addEventListener('DOMContentLoaded', () => {
  renderCardsFromAPI('all');
});

// Scroll animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animation = 'fadeInUp 0.6s ease both';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.cat-card, .stat, .side-card').forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});
