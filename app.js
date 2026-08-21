const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const viewer = document.getElementById('viewer');
const viewerImg = document.getElementById('viewerImg');
const closeViewer = document.getElementById('closeViewer');
const modes = document.querySelectorAll('#modes button');
const photoInput = document.getElementById('photoInput');
const uploadStatus = document.getElementById('uploadStatus');

let photos = [];
let current = 0;

function photoUrl(name) {
  return `photos/${encodeURIComponent(name).replace(/%2F/g, '/')}`;
}

function render() {
  grid.innerHTML = '';
  empty.classList.toggle('hidden', photos.length !== 0);
  photos.forEach((name, index) => {
    const img = document.createElement('img');
    img.loading = index < 12 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = photoUrl(name);
    img.alt = name;
    img.addEventListener('click', () => openViewer(index));
    grid.appendChild(img);
  });
}

function openViewer(index) {
  current = index;
  viewerImg.src = photoUrl(photos[current]);
  viewerImg.alt = photos[current];
  viewer.classList.remove('hidden');
}
function close() {
  viewer.classList.add('hidden');
  viewerImg.src = '';
}
function move(delta) {
  if (!photos.length) return;
  current = (current + delta + photos.length) % photos.length;
  viewerImg.src = photoUrl(photos[current]);
  viewerImg.alt = photos[current];
}

closeViewer.addEventListener('click', close);
viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
document.addEventListener('keydown', event => {
  if (viewer.classList.contains('hidden')) return;
  if (event.key === 'Escape') close();
  if (event.key === 'ArrowLeft') move(-1);
  if (event.key === 'ArrowRight') move(1);
});

let startX = 0;
viewer.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, {passive:true});
viewer.addEventListener('touchend', event => {
  const dx = event.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1);
}, {passive:true});

modes.forEach(button => {
  button.addEventListener('click', () => {
    modes.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    grid.style.setProperty('--cols', button.dataset.cols);
  });
});
grid.style.setProperty('--cols', '4');

// Compress photos locally before they ever leave the phone.
// Long edge is capped at 1800px and JPEG quality is 0.78.
// This normally cuts phone-camera files down dramatically while staying sharp on phones.
async function optimisePhoto(file) {
  const bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'}).catch(() => null);
  if (!bitmap) return file;

  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {alpha:false});
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
  return new File([blob], `${base}.jpg`, {type:'image/jpeg', lastModified:Date.now()});
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

photoInput.addEventListener('change', async () => {
  const files = [...photoInput.files].filter(file => file.type.startsWith('image/'));
  if (!files.length) return;

  uploadStatus.textContent = `optimising 0/${files.length}…`;
  const optimised = [];
  let originalBytes = 0;
  let outputBytes = 0;

  for (let i = 0; i < files.length; i++) {
    originalBytes += files[i].size;
    const result = await optimisePhoto(files[i]);
    outputBytes += result.size;
    optimised.push(result);
    uploadStatus.textContent = `optimising ${i + 1}/${files.length}…`;
  }

  // GitHub's normal web uploader is the only safe way to authenticate without
  // putting a GitHub token in this public site. Create a local download bundle
  // containing the optimised files so they can be uploaded in one batch.
  uploadStatus.textContent = `${files.length} ready · ${formatBytes(originalBytes)} → ${formatBytes(outputBytes)}`;

  if (optimised.length === 1) {
    const url = URL.createObjectURL(optimised[0]);
    const a = document.createElement('a');
    a.href = url;
    a.download = optimised[0].name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    // Download each optimised file. Safari will place them in Downloads.
    // They can then all be selected together in GitHub's upload picker.
    for (const file of optimised) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      await new Promise(resolve => setTimeout(resolve, 120));
      URL.revokeObjectURL(url);
    }
  }

  uploadStatus.textContent += ' · optimised files saved — upload them to GitHub';
  photoInput.value = '';
});

async function loadPhotos() {
  try {
    const response = await fetch(`photos/photos.json?v=${Date.now()}`, {cache:'no-store'});
    if (!response.ok) throw new Error(`manifest ${response.status}`);
    photos = await response.json();
    if (!Array.isArray(photos)) throw new Error('invalid manifest');
    render();
  } catch (error) {
    console.error('Could not load photo manifest:', error);
    photos = [];
    render();
  }
}
loadPhotos();
