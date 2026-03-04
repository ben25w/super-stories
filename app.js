const SHEET_ID = '1SsA-novHL6gokBSpv6xZ39ClFC4MYfUS-OnRfGV4F1A';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const grid = document.getElementById('videoGrid');
const overlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const player = document.getElementById('videoPlayer');
const closeBtn = document.getElementById('modalClose');

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

// Extract a Google Drive file ID from any common Drive URL format:
//   https://drive.google.com/file/d/FILE_ID/view
//   https://drive.google.com/open?id=FILE_ID
//   https://drive.google.com/uc?id=FILE_ID
function extractFileId(url) {
  if (!url) return null;
  // Match /d/FILE_ID
  const slashMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (slashMatch) return slashMatch[1];
  // Match ?id=FILE_ID or &id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return null;
}

function parseCSV(csv) {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  // Read the header row to find column positions dynamically
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

  const nameIdx   = headers.findIndex(h => h.includes('name'));
  const videoIdx  = headers.findIndex(h => h.includes('video'));
  const imageIdx  = headers.findIndex(h => h.includes('photo') || h.includes('image') || h.includes('thumbnail'));

  if (nameIdx === -1 || videoIdx === -1 || imageIdx === -1) {
    console.error('Could not find expected columns. Headers found:', headers);
    return [];
  }

  const videos = [];

  lines.slice(1).forEach(line => {
    if (!line.trim()) return;

    // Handle quoted CSV fields that may contain commas
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g);
    if (!cols) return;

    const clean = cols.map(s => s.trim().replace(/^"|"$/g, ''));

    const name       = clean[nameIdx]  || '';
    const videoLink  = clean[videoIdx] || '';
    const imageLink  = clean[imageIdx] || '';

    if (name && videoLink && imageLink) {
      videos.push({ name, videoLink, imageLink });
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

  videos.forEach(video => {
    const imageId = extractFileId(video.imageLink);
    if (!imageId) return;

    const imageSrc = `/.netlify/functions/proxy?id=${imageId}`;

    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Watch ${video.name}`);

    card.innerHTML = `
      <img class="card-thumb" src="${imageSrc}" alt="${video.name}">
      <div class="card-title">${video.name}</div>
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

overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

loadVideos();
