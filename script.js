const API_URL = "https://script.google.com/macros/s/AKfycbzQi3UWeGm0C56iel0FwHlU3KL2H5xUdoRDIoups2C2hIeK89YpYhKzaUSd5dYWmz5j/exec";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function escapeHTML(value='') { const d=document.createElement('div'); d.textContent=value; return d.innerHTML; }
function imageExists(url){ return url && /^https?:\/\//i.test(url); }

async function getData(action){
  const res = await fetch(`${API_URL}?action=${action}`);
  const json = await res.json();
  if(!json.success) throw new Error(json.error || 'API error');
  return json.data || [];
}

function setupMenu(){
  const btn=$('#menuButton'), nav=$('#navMenu');
  if(!btn || !nav) return;
  btn.addEventListener('click',()=>nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
}

function setActiveNav(){
  const page=(location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('#navMenu a').forEach(a=>{
    const href=a.getAttribute('href').toLowerCase();
    if(href===page || (page==='' && href==='index.html')) a.classList.add('active');
  });
}

async function loadProjects(){
  const grid=$('#projectsGrid'); if(!grid) return;
  try{
    const all=await getData('projects');
    const projects=all.filter(p=>!p.Status || String(p.Status).toLowerCase()==='published');
    const count=$('#projectCount'); if(count) count.textContent=projects.length;
    renderFilters(projects);
    renderProjects(projects,'all');
  }catch(e){ grid.innerHTML='<p class="loading">Unable to load projects right now.</p>'; console.error(e); }
}

function renderFilters(projects){
  const wrap=$('#categoryFilters'); if(!wrap) return;
  const cats=[...new Set(projects.map(p=>p.Category).filter(Boolean))];
  wrap.innerHTML='<button class="filter active" data-category="all">All</button>' + cats.map(c=>`<button class="filter" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
  wrap.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
    wrap.querySelectorAll('.filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    renderProjects(window.__projects || projects, btn.dataset.category);
  }));
  window.__projects=projects;
}

function renderProjects(projects,category){
  const grid=$('#projectsGrid'); if(!grid) return;
  const list=category==='all'?projects:projects.filter(p=>p.Category===category);
  if(!list.length){grid.innerHTML='<p class="loading">No projects found.</p>';return;}
  grid.innerHTML=list.map((p,i)=>{
    const image=imageExists(p['Image 1'])?`<img src="${escapeHTML(p['Image 1'])}" alt="${escapeHTML(p.Title)}">`:'<span>Project Image</span>';
    return `<article class="project-card"><div class="project-image">${image}</div><div class="project-body"><div class="project-category">${escapeHTML(p.Category||'Project')}</div><h3>${escapeHTML(p.Title||'Untitled')}</h3><p>${escapeHTML(p['Short Description']||'')}</p><button class="button secondary project-link" data-index="${projects.indexOf(p)}">View project</button></div></article>`;
  }).join('');
  grid.querySelectorAll('.project-link').forEach(btn=>btn.addEventListener('click',()=>openProject(projects[Number(btn.dataset.index)])));
}

function openProject(p){
  const modal=$('#projectModal'), body=$('#modalBody'); if(!modal||!body)return;
  body.innerHTML=`<p class="eyebrow">${escapeHTML(p.Category||'PROJECT')}</p><h2>${escapeHTML(p.Title||'Untitled')}</h2><p>${escapeHTML(p['Short Description']||'')}</p>${p.Problem?`<h3>Problem</h3><p>${escapeHTML(p.Problem)}</p>`:''}${p.Solution?`<h3>Solution</h3><p>${escapeHTML(p.Solution)}</p>`:''}${p.Tools?`<h3>Tools</h3><p>${escapeHTML(p.Tools)}</p>`:''}${p.Impact?`<h3>Impact</h3><p>${escapeHTML(p.Impact)}</p>`:''}`;
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
function setupModal(){const m=$('#projectModal'),c=$('#closeModal'),o=m?.querySelector('.modal-overlay'); if(!m)return; [c,o].forEach(x=>x?.addEventListener('click',()=>{m.classList.remove('show');m.setAttribute('aria-hidden','true')}));}

async function loadSkills(){
  const grid=$('#skillsGrid'); if(!grid)return;
  try{const skills=await getData('skills'); const count=$('#skillCount');if(count)count.textContent=skills.length; grid.innerHTML=skills.map(s=>`<div class="skill-card"><h3>${escapeHTML(s.Skill||'')}</h3><p>${escapeHTML(s.Description||s.Category||'')}</p></div>`).join('')||'<p class="loading">No skills added yet.</p>';}
  catch(e){grid.innerHTML='<p class="loading">Unable to load skills right now.</p>';console.error(e)}
}

async function loadExperience(){
  const list=$('#experienceList'); if(!list)return;
  try{const items=await getData('experience'); list.innerHTML=items.map(e=>`<article class="experience-card"><div class="experience-meta">${escapeHTML(e['Start Date']||'')} – ${escapeHTML(e['End Date']||'Present')}</div><h3>${escapeHTML(e.Role||'')}</h3><strong>${escapeHTML(e.Organization||'')}</strong><p>${escapeHTML(e.Description||'')}</p></article>`).join('')||'<p class="loading">No experience added yet.</p>';}
  catch(e){list.innerHTML='<p class="loading">Unable to load experience right now.</p>';console.error(e)}
}

function init(){setupMenu();setActiveNav();setupModal();const y=$('#year');if(y)y.textContent=new Date().getFullYear();loadProjects();loadSkills();loadExperience();}
document.addEventListener('DOMContentLoaded',init);
