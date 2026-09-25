const API_URL = "https://script.google.com/macros/s/AKfycbzQi3UWeGm0C56iel0FwHlU3KL2H5xUdoRDIoups2C2hIeK89YpYhKzaUSd5dYWmz5j/exec";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function escapeHTML(value = '') {
  const d = document.createElement('div');
  d.textContent = value == null ? '' : String(value);
  return d.innerHTML;
}

function imageExists(url) {
  return url && /^https?:\\/\\//i.test(String(url));
}

// Google Apps Script redirects its web-app response. JSONP avoids the
// cross-origin fetch problem that can make projects/skills show as 0.
function getData(action) {
  return new Promise((resolve, reject) => {
    const callbackName = `portfolioCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let finished = false;

    const cleanup = () => {
      finished = true;
      delete window[callbackName];
      script.remove();
    };

    const timer = setTimeout(() => {
      if (finished) return;
      cleanup();
      reject(new Error(`The portfolio API timed out while loading ${action}.`));
    }, 15000);

    window[callbackName] = (json) => {
      clearTimeout(timer);
      cleanup();
      if (!json || json.success !== true) {
        reject(new Error(json?.error || `Unable to load ${action}.`));
        return;
      }
      resolve(Array.isArray(json.data) ? json.data : []);
    };

    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error(`Could not connect to the portfolio API for ${action}.`));
    };

    script.src = `${API_URL}?action=${encodeURIComponent(action)}&callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
    document.head.appendChild(script);
  });
}

function setupMenu() {
  const btn = $('#menuButton');
  const nav = $('#navMenu');
  if (!btn || !nav) return;

  let overlay = $('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    overlay.classList.toggle('show', open);
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    btn.textContent = open ? '×' : '☰';
  };

  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    setMenu(!nav.classList.contains('open'));
  });

  overlay.addEventListener('click', () => setMenu(false));

  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
}

function setActiveNav() {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('#navMenu a').forEach((a) => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

async function loadProjects() {
  const grid = $('#projectsGrid');
  if (!grid) return;

  try {
    const all = await getData('projects');
    const projects = all.filter((p) => {
      const status = String(p.Status ?? '').trim().toLowerCase();
      return !status || status === 'published';
    });

    const count = $('#projectCount');
    if (count) count.textContent = projects.length;

    renderFilters(projects);
    renderProjects(projects, 'all');
  } catch (e) {
    grid.innerHTML = '<p class="loading">Projects could not be loaded. Please refresh the page.</p>';
    const count = $('#projectCount');
    if (count) count.textContent = '—';
    console.error(e);
  }
}

function renderFilters(projects) {
  const wrap = $('#categoryFilters');
  if (!wrap) return;

  const cats = [...new Set(projects.map((p) => String(p.Category || '').trim()).filter(Boolean))];
  wrap.innerHTML = '<button class="filter active" data-category="all">All</button>' +
    cats.map((c) => `<button type="button" class="filter" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');

  wrap.querySelectorAll('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderProjects(window.__projects || projects, btn.dataset.category);
    });
  });

  window.__projects = projects;
}

function renderProjects(projects, category) {
  const grid = $('#projectsGrid');
  if (!grid) return;

  const list = category === 'all'
    ? projects
    : projects.filter((p) => String(p.Category || '').trim() === category);

  if (!list.length) {
    grid.innerHTML = '<p class="loading">No projects found.</p>';
    return;
  }

  grid.innerHTML = list.map((p) => {
    const image = imageExists(p['Image 1'])
      ? `<img src="${escapeHTML(p['Image 1'])}" alt="${escapeHTML(p.Title || 'Project')}">`
      : '<span>Project Image</span>';

    return `<article class="project-card">
      <div class="project-image">${image}</div>
      <div class="project-body">
        <div class="project-category">${escapeHTML(p.Category || 'Project')}</div>
        <h3>${escapeHTML(p.Title || 'Untitled')}</h3>
        <p>${escapeHTML(p['Short Description'] || '')}</p>
        <button type="button" class="button secondary project-link">View project</button>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.project-link').forEach((btn, index) => {
    btn.addEventListener('click', () => openProject(list[index]));
  });
}

function openProject(p) {
  const modal = $('#projectModal');
  const body = $('#modalBody');
  if (!modal || !body) return;

  body.innerHTML = `<p class="eyebrow">${escapeHTML(p.Category || 'PROJECT')}</p>
    <h2>${escapeHTML(p.Title || 'Untitled')}</h2>
    <p>${escapeHTML(p['Short Description'] || '')}</p>
    ${p.Problem ? `<h3>Problem</h3><p>${escapeHTML(p.Problem)}</p>` : ''}
    ${p.Solution ? `<h3>Solution</h3><p>${escapeHTML(p.Solution)}</p>` : ''}
    ${p.Tools ? `<h3>Tools</h3><p>${escapeHTML(p.Tools)}</p>` : ''}
    ${p.Impact ? `<h3>Impact</h3><p>${escapeHTML(p.Impact)}</p>` : ''}`;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function setupModal() {
  const modal = $('#projectModal');
  const close = $('#closeModal');
  const overlay = modal?.querySelector('.modal-overlay');
  if (!modal) return;

  [close, overlay].forEach((element) => {
    element?.addEventListener('click', () => {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    });
  });
}

async function loadSkills() {
  const grid = $('#skillsGrid');
  if (!grid) return;

  try {
    const skills = await getData('skills');
    const count = $('#skillCount');
    if (count) count.textContent = skills.length;

    grid.innerHTML = skills.map((s) => `<div class="skill-card">
      <h3>${escapeHTML(s.Skill || '')}</h3>
      <p>${escapeHTML(s.Description || s.Category || '')}</p>
    </div>`).join('') || '<p class="loading">No skills added yet.</p>';
  } catch (e) {
    grid.innerHTML = '<p class="loading">Skills could not be loaded. Please refresh the page.</p>';
    const count = $('#skillCount');
    if (count) count.textContent = '—';
    console.error(e);
  }
}

async function loadExperience() {
  const list = $('#experienceList');
  if (!list) return;

  try {
    const items = await getData('experience');
    list.innerHTML = items.map((e) => `<article class="experience-card">
      <div class="experience-meta">${escapeHTML(e['Start Date'] || '')} – ${escapeHTML(e['End Date'] || 'Present')}</div>
      <h3>${escapeHTML(e.Role || '')}</h3>
      <strong>${escapeHTML(e.Organization || '')}</strong>
      <p>${escapeHTML(e.Description || '')}</p>
    </article>`).join('') || '<p class="loading">No experience added yet.</p>';
  } catch (e) {
    list.innerHTML = '<p class="loading">Experience could not be loaded. Please refresh the page.</p>';
    console.error(e);
  }
}

function init() {
  setupMenu();
  setActiveNav();
  setupModal();

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  loadProjects();
  loadSkills();
  loadExperience();
}

document.addEventListener('DOMContentLoaded', init);
