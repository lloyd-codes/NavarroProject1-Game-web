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

// Game data
const games = [
  { id:1, title:'SHADOW PROTOCOL', genre:'action', emoji:'🥷', desc:'High-octane stealth action in a dystopian megacity. Infiltrate, eliminate, disappear.', rating:'9.2', badge:'hot' },
  { id:2, title:'REALM OF ETERNITY', genre:'rpg', emoji:'🧙', desc:'An expansive fantasy RPG with over 200 hours of lore-rich exploration and branching narratives.', rating:'9.5', badge:'top' },
  { id:3, title:'IRON CITADEL', genre:'strategy', emoji:'🏰', desc:'Build your empire, command armies, and crush your rivals in this award-winning grand strategy.', rating:'9.1', badge:'top' },
  { id:4, title:'DREAD MANOR', genre:'horror', emoji:'👻', desc:'A psychological horror masterpiece set in a Victorian mansion. Fear has never been so beautiful.', rating:'8.8', badge:'new' },
  { id:5, title:'NITRO DRIFT X', genre:'racing', emoji:'🏎️', desc:'Push the limits of speed through neon-lit circuits and gravity-defying tracks worldwide.', rating:'8.7', badge:'hot' },
  { id:6, title:'QUANTUM BREAK', genre:'puzzle', emoji:'🧩', desc:'Bend the laws of physics to solve mind-bending puzzles across fractured dimensions.', rating:'8.4', badge:'new' },
  { id:7, title:'STELLAR VOID', genre:'action', emoji:'🌌', desc:'Command fleets and forge alliances in an epic open-world space saga that spans galaxies.', rating:'9.4', badge:'top' },
  { id:8, title:'CURSED LEGACY', genre:'rpg', emoji:'⚔️', desc:'A dark fantasy RPG where your bloodline determines your fate across three epic generations.', rating:'8.9', badge:'new' },
  { id:9, title:'CHROME RACER', genre:'racing', emoji:'🚗', desc:'Futuristic anti-gravity racing with fully destructible environments and a killer soundtrack.', rating:'8.3', badge:'new' },
  { id:10, title:'PIXEL JUMP', genre:'platformer', emoji:'🎮', desc:'A retro-inspired platformer with tight controls and devious level design. Pure platforming perfection.', rating:'8.6', badge:'new' },
  { id:11, title:'SOCCER LEGENDS 26', genre:'sports', emoji:'⚽', desc:'The most realistic soccer simulation ever. Build your dream team and dominate the league.', rating:'8.5', badge:'hot' },
  { id:12, title:'WARZONE ELITE', genre:'shooter', emoji:'🔫', desc:'Tactical FPS action with destructible environments and strategic team-based gameplay.', rating:'9.0', badge:'hot' },
  { id:13, title:'NEBULA QUEST', genre:'sci-fi', emoji:'🌌', desc:'Explore alien worlds and uncover ancient technologies in this sci-fi adventure epic.', rating:'8.7', badge:'new' },
  { id:14, title:'DRAGON KINGDOMS', genre:'fantasy', emoji:'🐉', desc:'Summon mythical beasts and wield powerful magic in this epic fantasy adventure.', rating:'9.2', badge:'top' },
  { id:15, title:'BEAT MASTER', genre:'rhythm', emoji:'🎵', desc:'Test your rhythm skills with thousands of tracks across every genre. Feel the beat!', rating:'8.8', badge:'hot' },
];

function renderCards(filter = 'all') {
  const grid = document.getElementById('gamesGrid');
  const filtered = filter === 'all' ? games : games.filter(g => g.genre === filter);
  grid.innerHTML = filtered.map(g => `
    <div class="game-card" data-genre="${g.genre}">
      <div class="card-thumb-wrap">
        <div class="card-thumb" style="background:linear-gradient(135deg,rgba(5,5,8,1) 0%,rgba(15,15,30,1) 100%)">${g.emoji}</div>
        <div class="card-overlay">
          <button class="play-btn">Explore ▶</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-genre">${g.genre.toUpperCase()}</div>
        <div class="card-title">${g.title}</div>
        <div class="card-desc">${g.desc}</div>
        <div class="card-meta">
          <div class="rating">★ ${g.rating}</div>
          <span class="badge badge-${g.badge}">${g.badge.toUpperCase()}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Re-attach hover for cursor
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
  renderCards(genre);
}

renderCards();

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
