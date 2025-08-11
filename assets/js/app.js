import { getContent } from './storage.js';

let content = null;
let isEditing = false;

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderAbout(container, data) {
  const { profile } = data;
  const headshot = profile.headshot ? `<img src="${escapeHtml(profile.headshot)}" alt="Headshot of ${escapeHtml(profile.name)}" class="avatar" loading="lazy" />` : '<div class="avatar" aria-hidden="true" style="background: rgba(0,0,0,0.06);"></div>';
  container.innerHTML = `
    <div>${headshot}</div>
    <div>
      <h1>${escapeHtml(profile.name || 'Your Name')}</h1>
      ${profile.tagline ? `<p class="muted">${escapeHtml(profile.tagline)}</p>` : ''}
      ${profile.summary ? `<p>${escapeHtml(profile.summary)}</p>` : ''}
      <p class="muted">${[profile.location, profile.availability].filter(Boolean).map(escapeHtml).join(' • ')}</p>
    </div>
  `;
  const footerName = document.getElementById('footerName');
  if (footerName) footerName.textContent = profile.name || 'Your Name';
  const resumeTop = document.getElementById('resumeTop');
  if (resumeTop) {
    const url = profile?.social?.resumeUrl || '#';
    resumeTop.href = url;
  }
}

function renderExperience(container, data) {
  const items = data.experience || [];
  container.innerHTML = items.map((item, idx) => `
    <article class="card" data-section="experience" data-index="${idx}">
      <h3>${escapeHtml(item.role || '')} · ${escapeHtml(item.company || '')}</h3>
      <p class="muted">${escapeHtml(item.startDate || '')} – ${escapeHtml(item.endDate || 'Present')} ${item.location ? '· ' + escapeHtml(item.location) : ''}</p>
      ${item.summaryBullets && item.summaryBullets.length ? `<ul>${item.summaryBullets.filter(Boolean).map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
      ${item.link ? `<p><a class="link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Learn more</a></p>` : ''}
      ${item.tags && item.tags.length ? `<div class="tags">${item.tags.slice(0,5).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      <div class="actions edit-only">
        <button class="icon-btn" data-action="move-up" aria-label="Move up">⬆️</button>
        <button class="icon-btn" data-action="move-down" aria-label="Move down">⬇️</button>
        <button class="icon-btn" data-action="edit" aria-label="Edit item">✏️</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete item">🗑️</button>
      </div>
    </article>
  `).join('');
}

function renderProjects(container, data) {
  const items = data.projects || [];
  container.innerHTML = items.map((item, idx) => `
    <article class="card" data-section="projects" data-index="${idx}">
      <h3>${escapeHtml(item.title || '')}</h3>
      ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ''}
      ${item.highlights && item.highlights.length ? `<ul>${item.highlights.filter(Boolean).map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
      <p>
        ${item.repoUrl ? `<a class="link" href="${escapeHtml(item.repoUrl)}" target="_blank" rel="noopener noreferrer">Repo</a>` : ''}
        ${item.demoUrl ? ` · <a class="link" href="${escapeHtml(item.demoUrl)}" target="_blank" rel="noopener noreferrer">Demo</a>` : ''}
      </p>
      <div class="actions edit-only">
        <button class="icon-btn" data-action="move-up" aria-label="Move up">⬆️</button>
        <button class="icon-btn" data-action="move-down" aria-label="Move down">⬇️</button>
        <button class="icon-btn" data-action="edit" aria-label="Edit item">✏️</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete item">🗑️</button>
      </div>
    </article>
  `).join('');
}

function renderEducation(container, data) {
  const items = data.education || [];
  container.innerHTML = items.map((item, idx) => `
    <article class="card" data-section="education" data-index="${idx}">
      <h3>${escapeHtml(item.institution || '')}</h3>
      <p class="muted">${escapeHtml(item.degree || '')}${item.field ? ' · ' + escapeHtml(item.field) : ''}</p>
      <p class="muted">${escapeHtml(item.startDate || '')} – ${escapeHtml(item.endDate || '')}${item.location ? ' · ' + escapeHtml(item.location) : ''}</p>
      ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}
      ${item.link ? `<p><a class="link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Program page</a></p>` : ''}
      <div class="actions edit-only">
        <button class="icon-btn" data-action="move-up" aria-label="Move up">⬆️</button>
        <button class="icon-btn" data-action="move-down" aria-label="Move down">⬇️</button>
        <button class="icon-btn" data-action="edit" aria-label="Edit item">✏️</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete item">🗑️</button>
      </div>
    </article>
  `).join('');
}

function renderCertifications(container, data) {
  const items = data.certifications || [];
  container.innerHTML = items.map((item, idx) => `
    <article class="card" data-section="certifications" data-index="${idx}">
      <h3>${escapeHtml(item.name || '')}</h3>
      <p class="muted">${escapeHtml(item.issuer || '')}${item.issueDate ? ' · ' + escapeHtml(item.issueDate) : ''}${item.credentialId ? ' · ID ' + escapeHtml(item.credentialId) : ''}</p>
      ${item.verifyUrl ? `<p><a class="link" href="${escapeHtml(item.verifyUrl)}" target="_blank" rel="noopener noreferrer">View credential</a></p>` : ''}
      <div class="actions edit-only">
        <button class="icon-btn" data-action="move-up" aria-label="Move up">⬆️</button>
        <button class="icon-btn" data-action="move-down" aria-label="Move down">⬇️</button>
        <button class="icon-btn" data-action="edit" aria-label="Edit item">✏️</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete item">🗑️</button>
      </div>
    </article>
  `).join('');
}

function renderArt(container, data) {
  const items = data.art || [];
  container.innerHTML = items.map((item, idx) => `
    <article class="card" data-section="art" data-index="${idx}">
      <h3>${escapeHtml(item.title || 'Artwork')}</h3>
      ${item.caption ? `<p>${escapeHtml(item.caption)}</p>` : ''}
      <div class="art-images">
        ${item.image1 ? `<img src="${escapeHtml(item.image1)}" alt="${escapeHtml(item.image1Alt || 'Artwork image 1')}" loading="lazy" />` : ''}
        ${item.image2 ? `<img src="${escapeHtml(item.image2)}" alt="${escapeHtml(item.image2Alt || 'Artwork image 2')}" loading="lazy" />` : ''}
      </div>
      <div class="actions edit-only">
        <button class="icon-btn" data-action="move-up" aria-label="Move up">⬆️</button>
        <button class="icon-btn" data-action="move-down" aria-label="Move down">⬇️</button>
        <button class="icon-btn" data-action="edit" aria-label="Edit item">✏️</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete item">🗑️</button>
      </div>
    </article>
  `).join('');
}

function renderPublications(container, data) {
  const items = data.publications || [];
  const section = document.getElementById('publications');
  if (section) section.style.display = items.length ? '' : 'none';
  container.innerHTML = items.map((item, idx) => `
    <article class="card" data-section="publications" data-index="${idx}">
      <h3>${escapeHtml(item.title || '')}</h3>
      <p class="muted">${escapeHtml(item.venue || '')}${item.year ? ' · ' + escapeHtml(item.year) : ''}</p>
      ${item.link ? `<p><a class="link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Read</a></p>` : ''}
      ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}
      <div class="actions edit-only">
        <button class="icon-btn" data-action="move-up" aria-label="Move up">⬆️</button>
        <button class="icon-btn" data-action="move-down" aria-label="Move down">⬇️</button>
        <button class="icon-btn" data-action="edit" aria-label="Edit item">✏️</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete item">🗑️</button>
      </div>
    </article>
  `).join('');
}

function renderCourses(container, data) {
  const items = data.courses || [];
  const section = document.getElementById('courses');
  if (section) section.style.display = items.length ? '' : 'none';
  container.innerHTML = items.map((item, idx) => `
    <article class="card" data-section="courses" data-index="${idx}">
      <h3>${escapeHtml(item.name || '')}</h3>
      <p class="muted">${escapeHtml(item.provider || '')}${item.date ? ' · ' + escapeHtml(item.date) : ''}</p>
      ${item.link ? `<p><a class="link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">View</a></p>` : ''}
      <div class="actions edit-only">
        <button class="icon-btn" data-action="move-up" aria-label="Move up">⬆️</button>
        <button class="icon-btn" data-action="move-down" aria-label="Move down">⬇️</button>
        <button class="icon-btn" data-action="edit" aria-label="Edit item">✏️</button>
        <button class="icon-btn" data-action="delete" aria-label="Delete item">🗑️</button>
      </div>
    </article>
  `).join('');
}

function renderContact(container, data) {
  const s = data.profile?.social || {};
  const parts = [];
  if (s.email) parts.push(`<a class="link" href="mailto:${escapeHtml(s.email)}">Email</a>`);
  if (s.github) parts.push(`<a class="link" href="${escapeHtml(s.github)}" target="_blank" rel="noopener">GitHub</a>`);
  if (s.linkedin) parts.push(`<a class="link" href="${escapeHtml(s.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
  if (s.instagram) parts.push(`<a class="link" href="${escapeHtml(s.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  if (s.resumeUrl) parts.push(`<a class="link" href="${escapeHtml(s.resumeUrl)}" target="_blank" rel="noopener">Resume (PDF)</a>`);
  container.innerHTML = parts.join(' · ');
}

function renderAll() {
  document.body.classList.toggle('editing', isEditing);
  const aboutEl = document.getElementById('aboutContent');
  const expEl = document.getElementById('experienceList');
  const projEl = document.getElementById('projectsList');
  const eduEl = document.getElementById('educationList');
  const certEl = document.getElementById('certificationsList');
  const artEl = document.getElementById('artList');
  const pubEl = document.getElementById('publicationsList');
  const crsEl = document.getElementById('coursesList');
  const contactEl = document.getElementById('contactContent');

  renderAbout(aboutEl, content);
  renderExperience(expEl, content);
  renderProjects(projEl, content);
  renderEducation(eduEl, content);
  renderCertifications(certEl, content);
  renderArt(artEl, content);
  renderPublications(pubEl, content);
  renderCourses(crsEl, content);
  renderContact(contactEl, content);
}

async function init() {
  try {
    content = await getContent();
  } catch (e) {
    console.error('Failed to load content', e);
    content = { profile: { name: 'Your Name', social: {} }, experience: [], projects: [], education: [], certifications: [], publications: [], courses: [] };
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Smooth scrolling for in-page links (reduced motion respected)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const animateScrollTo = (toY, durationMs = 1200) => {
      const startY = window.pageYOffset;
      const deltaY = toY - startY;
      const startTime = performance.now();
      function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const eased = easeInOutCubic(t);
        window.scrollTo(0, startY + deltaY * eased);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href.length <= 1) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const headerOffset = 76; // match CSS scroll-margin-top
        const rect = target.getBoundingClientRect();
        const targetY = rect.top + window.pageYOffset - headerOffset;
        animateScrollTo(targetY, 1200);
      });
    });
  }

  renderAll();
}

window.addEventListener('contentUpdated', (e) => {
  content = e.detail;
  renderAll();
});

window.addEventListener('editModeChanged', (e) => {
  isEditing = !!e.detail;
  renderAll();
});

window.addEventListener('DOMContentLoaded', init);