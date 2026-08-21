const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const viewer = document.getElementById('viewer');
const viewerImg = document.getElementById('viewerImg');
const closeViewer = document.getElementById('closeViewer');
const modes = document.querySelectorAll('#modes button');
const photoInput = document.getElementById('photoInput');
const uploadStatus = document.getElementById('uploadStatus');

const REPO = 'mrkritor-ui/IPHONE5C';
const BRANCH = 'main';
const API = 'https://api.github.com';
const TOKEN_KEY = 'iphone5c_github_token';

let photos = [];
let current = 0;

function photoUrl(name) { return `photos/${encodeURIComponent(name).replace(/%2F/g, '/')}`; }
function formatBytes(bytes) { if (bytes < 1024*1024) return `${Math.round(bytes/1024)} KB`; return `${(bytes/1024/1024).toFixed(1)} MB`; }
function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

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
function openViewer(index) { current=index; viewerImg.src=photoUrl(photos[current]); viewerImg.alt=photos[current]; viewer.classList.remove('hidden'); }
function close() { viewer.classList.add('hidden'); viewerImg.src=''; }
function move(delta) { if (!photos.length) return; current=(current+delta+photos.length)%photos.length; viewerImg.src=photoUrl(photos[current]); viewerImg.alt=photos[current]; }
closeViewer.addEventListener('click', close);
viewer.addEventListener('click', e => { if (e.target===viewer) close(); });
document.addEventListener('keydown', e => { if(viewer.classList.contains('hidden')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') move(-1); if(e.key==='ArrowRight') move(1); });
let startX=0;
viewer.addEventListener('touchstart', e => { startX=e.changedTouches[0].clientX; }, {passive:true});
viewer.addEventListener('touchend', e => { const dx=e.changedTouches[0].clientX-startX; if(Math.abs(dx)>45) move(dx<0?1:-1); }, {passive:true});
modes.forEach(button => button.addEventListener('click', () => { modes.forEach(b=>b.classList.remove('active')); button.classList.add('active'); grid.style.setProperty('--cols',button.dataset.cols); }));
grid.style.setProperty('--cols','4');

async function optimisePhoto(file) {
  const bitmap = await createImageBitmap(file, {imageOrientation:'from-image'}).catch(()=>null);
  if (!bitmap) return file;
  const maxSide=1800;
  const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.78));
  if(!blob) return file;
  const base=file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]+/g,'_') || 'photo';
  return new File([blob],`${base}.jpg`,{type:'image/jpeg',lastModified:Date.now()});
}

function openUploaderSetup() {
  document.getElementById('uploaderModal').classList.remove('hidden');
  document.getElementById('tokenInput').value='';
  document.getElementById('tokenInput').focus();
}
function closeUploaderSetup() { document.getElementById('uploaderModal').classList.add('hidden'); }

document.getElementById('setupUploader').addEventListener('click', openUploaderSetup);
document.getElementById('cancelUploader').addEventListener('click', closeUploaderSetup);
document.getElementById('saveToken').addEventListener('click', () => {
  const token=document.getElementById('tokenInput').value.trim();
  if(!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  closeUploaderSetup();
  uploadStatus.textContent='Uploader ready';
});
document.getElementById('clearToken').addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  uploadStatus.textContent='Uploader disconnected';
});

async function githubUpload(file, index, total) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary='';
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  const content=btoa(binary);
  const path=`photos/${file.name}`;
  const response=await fetch(`${API}/repos/${REPO}/contents/${path.split('/').map(encodeURIComponent).join('/')}`,{
    method:'PUT',
    headers:{'Accept':'application/vnd.github+json','Authorization':`Bearer ${getToken()}`,'Content-Type':'application/json'},
    body:JSON.stringify({message:`Add ${file.name}`,content,branch:BRANCH})
  });
  if(!response.ok){
    let detail='Upload failed';
    try { const data=await response.json(); detail=data.message || detail; } catch {}
    throw new Error(detail);
  }
  uploadStatus.textContent=`Uploading ${index}/${total} · ${formatBytes(file.size)}`;
}

photoInput.addEventListener('change', async () => {
  const files=[...photoInput.files].filter(f=>f.type.startsWith('image/'));
  if(!files.length) return;
  if(!getToken()) { photoInput.value=''; openUploaderSetup(); return; }

  try {
    let originalBytes=0, outputBytes=0;
    const optimised=[];
    for(let i=0;i<files.length;i++){
      originalBytes+=files[i].size;
      uploadStatus.textContent=`Optimising ${i+1}/${files.length}…`;
      const result=await optimisePhoto(files[i]);
      outputBytes+=result.size;
      optimised.push(result);
    }

    uploadStatus.textContent=`Compressed ${formatBytes(originalBytes)} → ${formatBytes(outputBytes)}`;
    for(let i=0;i<optimised.length;i++) await githubUpload(optimised[i],i+1,optimised.length);
    uploadStatus.textContent=`Uploaded ${optimised.length} photo${optimised.length===1?'':'s'} · updating…`;
    setTimeout(loadPhotos,2500);
  } catch(error) {
    console.error(error);
    uploadStatus.textContent=`Upload failed: ${error.message}`;
  }
  photoInput.value='';
});

async function loadPhotos() {
  try {
    const response=await fetch(`photos/photos.json?v=${Date.now()}`,{cache:'no-store'});
    if(!response.ok) throw new Error(`manifest ${response.status}`);
    photos=await response.json();
    if(!Array.isArray(photos)) throw new Error('invalid manifest');
    render();
  } catch(error) {
    console.error('Could not load photo manifest:',error);
    photos=[];
    render();
  }
}
loadPhotos();
