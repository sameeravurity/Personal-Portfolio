import { getContent, saveContent, exportContent, importContentFromFile } from './storage.js';

let content = null;
let isEditing = false;
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

const SECTION_SCHEMAS = {
  experience: [
    { key: 'company', label: 'Company', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'text', required: true },
    { key: 'startDate', label: 'Start date', type: 'text', required: true },
    { key: 'endDate', label: 'End date', type: 'text', required: false },
    { key: 'location', label: 'Location', type: 'text', required: false },
    { key: 'link', label: 'Link (URL)', type: 'url', required: false },
    { key: 'bullet1', label: 'Outcome bullet 1', type: 'text', required: false },
    { key: 'bullet2', label: 'Outcome bullet 2', type: 'text', required: false },
    { key: 'bullet3', label: 'Outcome bullet 3', type: 'text', required: false },
    { key: 'tags', label: 'Tags (comma-separated)', type: 'text', required: false },
  ],
  projects: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'summary', label: 'Summary', type: 'text', required: false },
    { key: 'highlight1', label: 'Highlight 1', type: 'text', required: false },
    { key: 'highlight2', label: 'Highlight 2', type: 'text', required: false },
    { key: 'highlight3', label: 'Highlight 3', type: 'text', required: false },
    { key: 'repoUrl', label: 'Repo URL', type: 'url', required: false },
    { key: 'demoUrl', label: 'Demo URL', type: 'url', required: false },
  ],
  education: [
    { key: 'institution', label: 'Institution', type: 'text', required: true },
    { key: 'degree', label: 'Degree', type: 'text', required: true },
    { key: 'field', label: 'Field', type: 'text', required: false },
    { key: 'startDate', label: 'Start date', type: 'text', required: false },
    { key: 'endDate', label: 'End date', type: 'text', required: false },
    { key: 'location', label: 'Location', type: 'text', required: false },
    { key: 'note', label: 'Note', type: 'text', required: false },
    { key: 'link', label: 'Link (URL)', type: 'url', required: false },
  ],
  certifications: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'issuer', label: 'Issuer', type: 'text', required: true },
    { key: 'issueDate', label: 'Issue date', type: 'text', required: false },
    { key: 'credentialId', label: 'Credential ID', type: 'text', required: false },
    { key: 'verifyUrl', label: 'Verify URL (Credly etc.)', type: 'url', required: false },
  ],
  art: [
    { key: 'title', label: 'Title', type: 'text', required: false },
    { key: 'caption', label: 'Caption', type: 'text', required: false },
    { key: 'image1', label: 'Image 1 URL', type: 'url', required: true },
    { key: 'image1Alt', label: 'Image 1 Alt text', type: 'text', required: false },
    { key: 'image2', label: 'Image 2 URL', type: 'url', required: true },
    { key: 'image2Alt', label: 'Image 2 Alt text', type: 'text', required: false },
  ],
  publications: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'venue', label: 'Venue', type: 'text', required: false },
    { key: 'year', label: 'Year', type: 'text', required: false },
    { key: 'link', label: 'Link (URL)', type: 'url', required: false },
    { key: 'note', label: 'Note', type: 'text', required: false },
  ],
  courses: [
    { key: 'name', label: 'Course name', type: 'text', required: true },
    { key: 'provider', label: 'Provider', type: 'text', required: false },
    { key: 'date', label: 'Completion date', type: 'text', required: false },
    { key: 'link', label: 'Link (URL)', type: 'url', required: false },
  ],
};

function dispatchContentUpdated() {
  window.dispatchEvent(new CustomEvent('contentUpdated', { detail: content }));
}

function dispatchEditModeChanged() {
  window.dispatchEvent(new CustomEvent('editModeChanged', { detail: isEditing }));
}

function setEditing(on) {
  // Disallow editing unless owner mode is active
  if (!document.body.classList.contains('owner')) return;
  isEditing = !!on;
  const toggle = document.getElementById('editToggle');
  if (toggle) toggle.setAttribute('aria-pressed', String(isEditing));
  document.body.classList.toggle('editing', isEditing);
  dispatchEditModeChanged();
}

function openDialog(title, fields) {
  const dialog = document.getElementById('editorDialog');
  const titleEl = document.getElementById('dialogTitle');
  const formFields = document.getElementById('formFields');
  const cancelBtn = document.getElementById('cancelDialog');
  titleEl.textContent = title;
  formFields.innerHTML = '';
  for (const field of fields) {
    const id = `f_${field.key}`;
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = field.label + (field.required ? ' *' : '');
    const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    input.id = id;
    input.name = field.key;
    if (field.type !== 'textarea') input.type = field.type;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.value != null) input.value = field.value;
    if (field.required) input.required = true;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    formFields.appendChild(wrapper);
  }
  dialog.returnValue = '';
  dialog.showModal();
  return new Promise((resolve, reject) => {
    const form = document.getElementById('editorForm');
    function onSubmit(e) {
      e.preventDefault();
      const data = new FormData(form);
      const result = {};
      for (const [k, v] of data.entries()) result[k] = v.toString().trim();
      dialog.close('submit');
      form.removeEventListener('submit', onSubmit);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onCancel() {
      dialog.close('cancel');
      form.removeEventListener('submit', onSubmit);
      cancelBtn.removeEventListener('click', onCancel);
      reject(new Error('cancel'));
    }
    form.addEventListener('submit', onSubmit);
    cancelBtn.addEventListener('click', onCancel);
  });
}

async function handleEditProfile() {
  const p = content.profile || { name: '', tagline: '', summary: '', location: '', availability: '', headshot: '', social: {} };
  const s = p.social || {};
  const fields = [
    { key: 'name', label: 'Name', type: 'text', required: true, value: p.name || '' },
    { key: 'tagline', label: 'Tagline', type: 'text', required: false, value: p.tagline || '' },
    { key: 'summary', label: 'About me summary', type: 'textarea', required: false, value: p.summary || '' },
    { key: 'location', label: 'Location', type: 'text', required: false, value: p.location || '' },
    { key: 'availability', label: 'Availability', type: 'text', required: false, value: p.availability || '' },
    { key: 'headshot', label: 'Headshot URL', type: 'url', required: false, value: p.headshot || '' },
    { key: 'email', label: 'Email', type: 'text', required: false, value: s.email || '' },
    { key: 'github', label: 'GitHub URL', type: 'url', required: false, value: s.github || '' },
    { key: 'linkedin', label: 'LinkedIn URL', type: 'url', required: false, value: s.linkedin || '' },
    { key: 'instagram', label: 'Instagram URL', type: 'url', required: false, value: s.instagram || '' },
    { key: 'resumeUrl', label: 'Resume URL', type: 'url', required: false, value: s.resumeUrl || '' },
  ];
  try {
    const values = await openDialog('Edit Profile', fields);
    content.profile = {
      name: values.name || '',
      tagline: values.tagline || '',
      summary: values.summary || '',
      location: values.location || '',
      availability: values.availability || '',
      headshot: values.headshot || '',
      social: {
        email: values.email || '',
        github: values.github || '',
        linkedin: values.linkedin || '',
        instagram: values.instagram || '',
        resumeUrl: values.resumeUrl || ''
      }
    };
    saveContent(content);
    dispatchContentUpdated();
  } catch (_) {}
}

function mapFormToItem(section, values, original = {}) {
  const copy = { ...original };
  switch (section) {
    case 'experience': {
      copy.company = values.company || '';
      copy.role = values.role || '';
      copy.startDate = values.startDate || '';
      copy.endDate = values.endDate || '';
      copy.location = values.location || '';
      copy.link = values.link || '';
      copy.summaryBullets = [values.bullet1, values.bullet2, values.bullet3].filter(Boolean);
      copy.tags = (values.tags || '').split(',').map(s=>s.trim()).filter(Boolean).slice(0,5);
      break;
    }
    case 'projects': {
      copy.title = values.title || '';
      copy.summary = values.summary || '';
      copy.highlights = [values.highlight1, values.highlight2, values.highlight3].filter(Boolean);
      copy.repoUrl = values.repoUrl || '';
      copy.demoUrl = values.demoUrl || '';
      break;
    }
    case 'education': {
      copy.institution = values.institution || '';
      copy.degree = values.degree || '';
      copy.field = values.field || '';
      copy.startDate = values.startDate || '';
      copy.endDate = values.endDate || '';
      copy.location = values.location || '';
      copy.note = values.note || '';
      copy.link = values.link || '';
      break;
    }
    case 'certifications': {
      copy.name = values.name || '';
      copy.issuer = values.issuer || '';
      copy.issueDate = values.issueDate || '';
      copy.credentialId = values.credentialId || '';
      copy.verifyUrl = values.verifyUrl || '';
      break;
    }
    case 'art': {
      copy.title = values.title || '';
      copy.caption = values.caption || '';
      copy.image1 = values.image1 || '';
      copy.image1Alt = values.image1Alt || '';
      copy.image2 = values.image2 || '';
      copy.image2Alt = values.image2Alt || '';
      break;
    }
    case 'publications': {
      copy.title = values.title || '';
      copy.venue = values.venue || '';
      copy.year = values.year || '';
      copy.link = values.link || '';
      copy.note = values.note || '';
      break;
    }
    case 'courses': {
      copy.name = values.name || '';
      copy.provider = values.provider || '';
      copy.date = values.date || '';
      copy.link = values.link || '';
      break;
    }
  }
  return copy;
}

function getInitialValues(section, item = {}) {
  switch (section) {
    case 'experience':
      return {
        company: item.company || '',
        role: item.role || '',
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        location: item.location || '',
        link: item.link || '',
        bullet1: item.summaryBullets?.[0] || '',
        bullet2: item.summaryBullets?.[1] || '',
        bullet3: item.summaryBullets?.[2] || '',
        tags: (item.tags || []).join(', '),
      };
    case 'projects':
      return {
        title: item.title || '',
        summary: item.summary || '',
        highlight1: item.highlights?.[0] || '',
        highlight2: item.highlights?.[1] || '',
        highlight3: item.highlights?.[2] || '',
        repoUrl: item.repoUrl || '',
        demoUrl: item.demoUrl || '',
      };
    case 'education':
      return {
        institution: item.institution || '',
        degree: item.degree || '',
        field: item.field || '',
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        location: item.location || '',
        note: item.note || '',
        link: item.link || '',
      };
    case 'certifications':
      return {
        name: item.name || '',
        issuer: item.issuer || '',
        issueDate: item.issueDate || '',
        credentialId: item.credentialId || '',
        verifyUrl: item.verifyUrl || '',
      };
    case 'art':
      return {
        title: item.title || '',
        caption: item.caption || '',
        image1: item.image1 || '',
        image1Alt: item.image1Alt || '',
        image2: item.image2 || '',
        image2Alt: item.image2Alt || '',
      };
    case 'publications':
      return {
        title: item.title || '',
        venue: item.venue || '',
        year: item.year || '',
        link: item.link || '',
        note: item.note || '',
      };
    case 'courses':
      return {
        name: item.name || '',
        provider: item.provider || '',
        date: item.date || '',
        link: item.link || '',
      };
  }
}

async function handleAdd(section) {
  const schema = SECTION_SCHEMAS[section];
  const initial = getInitialValues(section, {});
  const fields = schema.map(f => ({ ...f, value: initial[f.key] || '' }));
  try {
    const values = await openDialog(`Add ${section.slice(0,1).toUpperCase()+section.slice(1,).toLowerCase()}`, fields);
    const item = mapFormToItem(section, values, {});
    content[section] = content[section] || [];
    content[section].push(item);
    saveContent(content);
    dispatchContentUpdated();
  } catch(_) {}
}

async function handleEdit(section, index) {
  const schema = SECTION_SCHEMAS[section];
  const item = content[section][index];
  const initial = getInitialValues(section, item);
  const fields = schema.map(f => ({ ...f, value: initial[f.key] || '' }));
  try {
    const values = await openDialog(`Edit ${section.slice(0,1).toUpperCase()+section.slice(1,).toLowerCase()}`, fields);
    const updated = mapFormToItem(section, values, item);
    content[section][index] = updated;
    saveContent(content);
    dispatchContentUpdated();
  } catch(_) {}
}

function handleDelete(section, index) {
  const ok = confirm('Delete this item?');
  if (!ok) return;
  content[section].splice(index, 1);
  saveContent(content);
  dispatchContentUpdated();
}

function handleMove(section, index, delta) {
  const arr = content[section];
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= arr.length) return;
  const [moved] = arr.splice(index, 1);
  arr.splice(newIndex, 0, moved);
  saveContent(content);
  dispatchContentUpdated();
}

function onMainClick(e) {
  const target = e.target.closest('button, a');
  if (!target) return;
  const action = target.getAttribute('data-action');
  if (!action) return;
  // Block edit actions unless in local owner mode
  if (!IS_LOCAL || !document.body.classList.contains('owner')) {
    e.preventDefault();
    return;
  }
  const card = target.closest('[data-section]');
  const section = target.getAttribute('data-section') || card?.getAttribute('data-section');
  const index = card ? parseInt(card.getAttribute('data-index') || '-1', 10) : -1;

  if (action === 'edit-profile') {
    e.preventDefault();
    return void handleEditProfile();
  }

  if (action === 'add') {
    e.preventDefault();
    handleAdd(section);
  } else if (action === 'edit' && index >= 0) {
    e.preventDefault();
    handleEdit(section, index);
  } else if (action === 'delete' && index >= 0) {
    e.preventDefault();
    handleDelete(section, index);
  } else if (action === 'move-up' && index >= 0) {
    e.preventDefault();
    handleMove(section, index, -1);
  } else if (action === 'move-down' && index >= 0) {
    e.preventDefault();
    handleMove(section, index, +1);
  }
}

async function init() {
  content = await getContent();

  // Owner controls: simple local-only gate
  const isOwner = IS_LOCAL && localStorage.getItem('portfolio_owner') === '1';
  document.body.classList.toggle('owner', isOwner);

  const ownerLogin = document.getElementById('ownerLogin');
  const ownerLogout = document.getElementById('ownerLogout');
  const OWNER_CODE = 'changeme'; // Change this to your private code before publishing
  // Hide owner controls entirely if not local
  if (!IS_LOCAL) {
    if (ownerLogin) ownerLogin.style.display = 'none';
    if (ownerLogout) ownerLogout.style.display = 'none';
  }
  if (IS_LOCAL && ownerLogin) ownerLogin.addEventListener('click', () => {
    const code = prompt('Enter owner code:');
    if (code === OWNER_CODE) {
      localStorage.setItem('portfolio_owner', '1');
      document.body.classList.add('owner');
      alert('Owner mode enabled');
    } else if (code != null) {
      alert('Incorrect code');
    }
  });
  if (IS_LOCAL && ownerLogout) ownerLogout.addEventListener('click', () => {
    localStorage.removeItem('portfolio_owner');
    document.body.classList.remove('owner');
    alert('Owner mode disabled');
  });

  const editToggle = document.getElementById('editToggle');
  if (IS_LOCAL && editToggle) {
    editToggle.addEventListener('click', () => setEditing(!isEditing));
  }

  const exportBtn = document.getElementById('exportBtn');
  if (IS_LOCAL && exportBtn) exportBtn.addEventListener('click', () => exportContent(content));

  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');
  if (IS_LOCAL && importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const json = await importContentFromFile(file);
        content = json;
        dispatchContentUpdated();
      } catch (err) {
        alert('Import failed: ' + err.message);
      } finally {
        importInput.value = '';
      }
    });
  }

  const main = document.getElementById('main');
  main.addEventListener('click', onMainClick);

  // Sync content when other module updates it
  window.addEventListener('contentUpdated', (e) => { content = e.detail; });
}

window.addEventListener('DOMContentLoaded', init);