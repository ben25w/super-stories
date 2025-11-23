const SHEET_ID = '1SsA-novHL6gokBSpv6xZ39ClFC4MYfUS-OnRfGV4F1A';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

async function loadVideos() {
  try {
    const response = await fetch(CSV_URL);
    const csv = await response.text();
    const videos = parseCSV(csv);
    displayVideos(videos);
    
    if (videos.length > 0) {
      playVideo(videos[0]);
    }
  } catch (error) {
    console.error('Error loading videos:', error);
    document.getElementById('videoList').innerHTML = '<p>Error loading videos</p>';
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
  const listDiv = document.getElementById('videoList');
  listDiv.innerHTML = '';
  
  videos.forEach((video, index) => {
    const imageId = video

.imageLink.match(/\/d\/([^\/]+)/)[1];
    const imageSrc = `/.netlify/functions/proxy?id=${imageId}`;
    
    const item = document.createElement('div');
    item.className = 'video-item' + (index === 0 ? ' active' : '');
    item.innerHTML = `
      <img src="${imageSrc}" alt="${video.name}">
      <div class='video-item-title'>${video.name}</div>
    `;
    item.onclick = () => playVideo(video, index, videos);
    listDiv.appendChild(item);
  });
}

function playVideo(video, index, videos) {
  const fileId = video.videoLink.match(/\/d\/([^\/]+)/)[1];
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  document.getElementById('videoPlayer').src = embedUrl;
  
  if (videos) {
    document.querySelectorAll('.video-item').forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  }
}

loadVideos();
