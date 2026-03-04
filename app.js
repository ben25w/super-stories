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

function parseCSV(csv) {
  const lines = csv.split('\n').slice(1);
  const videos = [];

  lines.forEach(line => {
    if (line.trim()) {
      const [name, videoLink, imageLink] = line.split(',').map(s => s.trim());
      if (name && videoLink && imageLink) {
        videos.push({
          name: name.replace(/"/g, ''),
          videoLink: videoLink.replace(/"/g, ''),
          imageLink: imageLink.replace(/"/g, '')
        });
      }
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
    const imageId = video.imageLink.match(/\/d\/([^\/]+)/)[1];
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
  const fileId = video.videoLink.match(/\/d\/([^\/]+)/)[1];
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
