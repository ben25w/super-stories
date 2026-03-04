const SHEET_ID = '1SsA-novHL6gokBSpv6xZ39ClFC4MYfUS-OnRfGV4F1A';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const grid = document.getElementById('videoGrid');
const overlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const player = document.getElementById('videoPlayer');
const closeBtn = document.getElementById('modalClose');

// -----------------------------------------------------------------------
// Animated star background
// -----------------------------------------------------------------------

(function initStars() {
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.4 + 0.3,
        alpha: Math.random(),
        speed: Math.random() * 0.004 + 0.001,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
      star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(timestamp * star.speed + star.phase));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  createStars(180);
  requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); createStars(180); });
})();

// -----------------------------------------------------------------------
// Sheet data loading
// -----------------------------------------------------------------------

async function loadVideos() {
  try {
    const response = await fetch(CSV_URL);
    const csv = await response.text();
    const videos = parseCSV(csv);
    displayVideos(videos);
  } catch (error) {
    console.error('Error loading videos:', error);
    grid.innerHTML = '<p class="loading">Sorry, the stories could not be loaded right now.</p>';
  }
}

// Extract a Google Drive file ID from any common Drive URL format
function extractFileId(url) {
  if (!url) return null;
  const slashMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (slashMatch) return slashMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return null;
}

// Parse a timestamp like "04/03/2026 21:10:47" into a month name
function parseMonth(timestamp) {
  if (!timestamp) return '';
  // Expect DD/MM/YYYY or MM/DD/YYYY - we treat first two digits as day (DD/MM/YYYY)
  const parts = timestamp.split(' ')[0].split('/');
  if (parts.length < 3) return '';
  // parts: [DD, MM, YYYY]
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(year)) return '';
  const date = new Date(year, month, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function parseCSV(csv) {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

  const timestampIdx = headers.findIndex(h => h.includes('timestamp'));
  const nameIdx      = headers.findIndex(h => h.includes('name'));
  const videoIdx     = headers.findIndex(h => h.includes('video'));
  const imageIdx     = headers.findIndex(h => h.includes('photo') || h.includes('image') || h.includes('thumbnail'));

  if (nameIdx === -1 || videoIdx === -1 || imageIdx === -1) {
    console.error('Could not find expected columns. Headers found:', headers);
    return [];
  }

  const videos = [];

  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g);
    if (!cols) return;
    const clean = cols.map(s => s.trim().replace(/^"|"$/g, ''));

    const name      = clean[nameIdx]  || '';
    const videoLink = clean[videoIdx] || '';
    const imageLink = clean[imageIdx] || '';
    const timestamp = timestampIdx !== -1 ? (clean[timestampIdx] || '') : '';

    if (name && videoLink && imageLink) {
      videos.push({ name, videoLink, imageLink, timestamp });
    }
  });

  return videos;
}

function displayVideos(videos) {
  grid.innerHTML = '';

  if (videos.length === 0) {
    grid.innerHTML = '<p class="loading">No stories yet. Check back soon!</p>';
    return;
  }

  // Find the most recent timestamp to mark the newest story
  let newestIndex = 0;
  let newestTime = 0;
  videos.forEach((video, i) => {
    if (video.timestamp) {
      const parts = video.timestamp.split(' ')[0].split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY -> comparable number YYYYMMDD
        const t = parseInt(parts[2] + parts[1].padStart(2,'0') + parts[0].padStart(2,'0'), 10);
        if (t > newestTime) { newestTime = t; newestIndex = i; }
      }
    }
  });

  videos.forEach((video, index) => {
    const imageId = extractFileId(video.imageLink);
    if (!imageId) return;

    const imageSrc = `/.netlify/functions/proxy?id=${imageId}`;
    const isNewest = index === newestIndex;
    const monthLabel = parseMonth(video.timestamp);

    const card = document.createElement('div');
    card.className = 'card' + (isNewest ? ' newest' : '');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Watch ${video.name}`);

    card.innerHTML = `
      ${isNewest ? '<span class="newest-badge">New</span>' : ''}
      <img class="card-thumb" src="${imageSrc}" alt="${video.name}">
      <div class="card-info">
        <div class="card-title">${video.name}</div>
        ${monthLabel ? `<div class="card-date">${monthLabel}</div>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openModal(video));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openModal(video);
    });

    grid.appendChild(card);
  });
}

function openModal(video) {
  const fileId = extractFileId(video.videoLink);
  if (!fileId) return;
  player.src = `https://drive.google.com/file/d/${fileId}/preview`;
  modalTitle.textContent = video.name;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}

function closeModal() {
  overlay.classList.remove('open');
  player.src = '';
  document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

loadVideos();
