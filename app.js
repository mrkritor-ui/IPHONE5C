const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const viewer = document.getElementById('viewer');
const viewerImg = document.getElementById('viewerImg');
const closeViewer = document.getElementById('closeViewer');
const modes = document.querySelectorAll('#modes button');

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
viewer.addEventListener('click', event => {
  if (event.target === viewer) close();
});

document.addEventListener('keydown', event => {
  if (viewer.classList.contains('hidden')) return;
  if (event.key === 'Escape') close();
  if (event.key === 'ArrowLeft') move(-1);
  if (event.key === 'ArrowRight') move(1);
});

let startX = 0;
viewer.addEventListener('touchstart', event => {
  startX = event.changedTouches[0].clientX;
}, {passive: true});
viewer.addEventListener('touchend', event => {
  const dx = event.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1);
}, {passive: true});

modes.forEach(button => {
  button.addEventListener('click', () => {
    modes.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    grid.style.setProperty('--cols', button.dataset.cols);
  });
});

grid.style.setProperty('--cols', '4');

async function loadPhotos() {
  try {
    const response = await fetch(`photos/photos.json?v=${Date.now()}`, {cache: 'no-store'});
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
