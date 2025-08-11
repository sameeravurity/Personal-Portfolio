const CONTENT_PATH = 'assets/data/content.json';

let baseContentCache = null;

async function loadBaseContent() {
  if (baseContentCache) return baseContentCache;
  try {
    const res = await fetch(CONTENT_PATH, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load content.json: ${res.status}`);
    baseContentCache = await res.json();
    return baseContentCache;
  } catch (err) {
    console.error(err);
    baseContentCache = {
      profile: { name: 'Your Name', tagline: '', summary: '', location: '', availability: '', headshot: '', social: { email: '', github: '', linkedin: '', instagram: '', resumeUrl: '', resumeDataUrl: '' } },
      experience: [], projects: [], education: [], certifications: [], skills: []
    };
    return baseContentCache;
  }
}

function getSavedContent() {
  try {
    const raw = localStorage.getItem('portfolio_content');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Could not parse saved content from localStorage');
    return null;
  }
}

export async function getContent() {
  const base = await loadBaseContent();
  const saved = getSavedContent();
  return saved || base;
}

export function saveContent(content) {
  try {
    localStorage.setItem('portfolio_content', JSON.stringify(content, null, 2));
  } catch (e) {
    alert('Unable to save changes locally. Check storage settings.');
  }
}

export function clearLocalEdits() {
  localStorage.removeItem('portfolio_content');
}

export function exportContent(content) {
  const data = content || getSavedContent() || baseContentCache || {};
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'content.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importContentFromFile(file) {
  const text = await file.text();
  const json = JSON.parse(text);
  if (!json || typeof json !== 'object') throw new Error('Invalid JSON');
  // Very light validation
  const requiredKeys = ['profile', 'experience', 'projects', 'education', 'certifications', 'skills'];
  for (const key of requiredKeys) {
    if (!(key in json)) throw new Error(`Missing key: ${key}`);
  }
  saveContent(json);
  return json;
}