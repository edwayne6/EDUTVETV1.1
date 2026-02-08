// Standalone admin-panel app.js
document.addEventListener('DOMContentLoaded', () => {
  const PIN = '1998';
  const authEl = document.getElementById('auth');
  const appEl = document.getElementById('app');
  const pinInput = document.getElementById('adminPin');
  const pinEnter = document.getElementById('pinEnter');
  const demoBtn = document.getElementById('demoBtn');

  function isAuthed() { return sessionStorage.getItem('adminAuthed') === 'true'; }
  function setAuthed(v) { sessionStorage.setItem('adminAuthed', v ? 'true' : 'false'); }

  if (isAuthed()) showApp();

  pinEnter.addEventListener('click', () => {
    if (pinInput.value === PIN) { setAuthed(true); showApp(); } else { alert('Incorrect PIN'); }
  });

  demoBtn.addEventListener('click', () => {
    seedDemoData();
    setAuthed(true);
    showApp();
  });

  function showApp() {
    authEl.style.display = 'none';
    appEl.classList.remove('hidden');
    refreshDashboard();
    setupTabs();
    setupDocs();
    setupAnalytics();
    setupSiteEditor();
    setupLegalGen();
    setupSettings();
  }

  // ---------------- Documents management ----------------
  function getDocs() {
    try { return JSON.parse(localStorage.getItem('adminDocuments') || '[]'); } catch(e){return []}
  }
  function saveDocs(docs){ localStorage.setItem('adminDocuments', JSON.stringify(docs)); }

  function seedDemoData(){
    const demo = [
      {id:1,title:'Crop Protection Guide',department:'Agriculture',status:'published',date:'2025-01-20'},
      {id:2,title:'Business Plans',department:'Business',status:'published',date:'2025-01-18'},
      {id:3,title:'Upload Example',department:'ICT',status:'pending',date:'2026-02-01'}
    ];
    saveDocs(demo);
  }

  function refreshDashboard(){
    const docs = getDocs();
    document.getElementById('totalDocs').textContent = docs.length;
    document.getElementById('pendingDocs').textContent = docs.filter(d=>d.status==='pending').length;
    document.getElementById('publishedDocs').textContent = docs.filter(d=>d.status==='published').length;
  }

  function setupTabs(){
    document.querySelectorAll('.tabBtn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
        const tab = btn.dataset.tab;
        const el = document.getElementById(tab);
        if (el) el.classList.remove('hidden');
        document.querySelectorAll('.tabBtn').forEach(b=>b.classList.remove('bg-blue-50'));
        btn.classList.add('bg-blue-50');
        if (tab==='documents') renderDocs();
      });
    });
    // show dashboard by default
    document.querySelector('.tabBtn[data-tab="dashboard"]').click();
  }

  function setupDocs(){
    document.getElementById('exportBtn').addEventListener('click', ()=>{
      const data = getDocs();
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'adminDocuments.json'; a.click(); URL.revokeObjectURL(url);
    });

    document.getElementById('importBtn').addEventListener('click', ()=>{
      const input = document.createElement('input'); input.type='file'; input.accept='application/json';
      input.onchange = e=>{
        const f = e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); if(Array.isArray(data)){ saveDocs(data); alert('Imported'); refreshDashboard(); } else alert('Invalid file'); }catch(er){alert('Import failed') } }; r.readAsText(f);
      };
      input.click();
    });

    document.getElementById('docSearch').addEventListener('input', renderDocs);
    renderDocs();
  }

  function renderDocs(){
    const q = document.getElementById('docSearch').value.toLowerCase();
    const rows = getDocs().filter(d=> (d.title||'').toLowerCase().includes(q) || (d.department||'').toLowerCase().includes(q));
    const tbody = document.getElementById('docsTable'); tbody.innerHTML='';
    rows.forEach(d=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="p-2">${escapeHtml(d.title||'')}</td><td class="p-2">${escapeHtml(d.department||'')}</td><td class="p-2">${escapeHtml(d.status||'')}</td><td class="p-2"><button class="approveBtn mr-2">Approve</button><button class="delBtn text-red-600">Delete</button></td>`;
      tbody.appendChild(tr);
      tr.querySelector('.approveBtn').addEventListener('click', ()=>{ d.status='published'; saveRow(d); renderDocs(); refreshDashboard(); });
      tr.querySelector('.delBtn').addEventListener('click', ()=>{ if(confirm('Delete?')){ deleteRow(d.id); renderDocs(); refreshDashboard(); }});
    });
  }

  function saveRow(doc){ const docs = getDocs(); const idx = docs.findIndex(x=>x.id===doc.id); if(idx>=0) docs[idx]=doc; else docs.push(doc); saveDocs(docs); }
  function deleteRow(id){ saveDocs(getDocs().filter(d=>d.id!==id)); }

  // ---------------- Upload form ----------------
  document.addEventListener('submit', (e)=>{
    if(e.target && e.target.id==='uploadForm'){ e.preventDefault(); const title=document.getElementById('uTitle').value; const dept=document.getElementById('uDept').value; const file=document.getElementById('uFile').files[0]; if(!title||!file){ alert('Title and file required'); return; }
      // attempt API upload
      const fd=new FormData(); fd.append('title',title); fd.append('department',dept); fd.append('file',file);
      fetch('http://localhost:5000/api/documents/upload',{method:'POST',body:fd}).then(r=>r.json()).then(data=>{ alert('Upload response: ' + (data.message||'OK')); }).catch(()=>{ // fallback store metadata
        const docs = getDocs(); const id = Date.now(); docs.push({id,title,department:dept,status:'pending',date:new Date().toISOString().slice(0,10)}); saveDocs(docs); alert('Stored locally as pending'); refreshDashboard(); renderDocs(); }); }
  });

  document.getElementById('storeLocal').addEventListener('click', ()=>{
    const title=document.getElementById('uTitle').value; const dept=document.getElementById('uDept').value; if(!title){ alert('Title required'); return; }
    const docs = getDocs(); const id = Date.now(); docs.push({id,title,department:dept,status:'pending',date:new Date().toISOString().slice(0,10)}); saveDocs(docs); 
    // Track document added
    if (window.trackDocumentAdded) { window.trackDocumentAdded({id,title,department:dept,level:'N/A',status:'pending',addedBy:'admin'}); }
    alert('Stored locally'); refreshDashboard(); renderDocs();
  });

  // ---------------- Site Editor ----------------
  function setupSiteEditor(){
    const range = document.getElementById('overlayRange'); const preview = document.getElementById('overlayPreview'); const copycss = document.getElementById('copyCss'); const downloadCss = document.getElementById('downloadCss');
    const updatePreview = ()=>{ const v = range.value; preview.style.backgroundImage = `linear-gradient(rgba(0,0,0,${v}), rgba(0,0,0,${v})), url('../sliders/slide1.jpg')`; };
    range.addEventListener('input', updatePreview); updatePreview();
    copycss.addEventListener('click', ()=>{ const css = generateOverlayCSS(range.value); navigator.clipboard.writeText(css).then(()=>alert('CSS copied')); });
    downloadCss.addEventListener('click', ()=>{ const blob=new Blob([generateOverlayCSS(range.value)],{type:'text/css'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='overlay-snippet.css'; a.click(); URL.revokeObjectURL(url); });
  }

  function generateOverlayCSS(value){ return `.slider-container::before { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,${value}); pointer-events: none; }\n`; }

  // ---------------- Analytics ----------------
  function getAnalyticsData(){
    try { return JSON.parse(localStorage.getItem('edutvet_analytics')||JSON.stringify({sessions:[],activities:[],documentsAdded:[]})); }catch(e){return {sessions:[],activities:[],documentsAdded:[]};}
  }

  function setupAnalytics(){
    document.getElementById('exportAnalytics').addEventListener('click', ()=>{
      const data = getAnalyticsData(); const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='analytics-'+ new Date().toISOString().split('T')[0] +'.json'; a.click(); URL.revokeObjectURL(url);
    });
    document.getElementById('clearAnalytics').addEventListener('click', ()=>{ if(confirm('Clear all analytics data?')){ localStorage.removeItem('edutvet_analytics'); alert('Cleared'); refreshAnalytics(); }});
    
    // Set up tab to refresh when opened
    document.querySelector('[data-tab="analytics"]').addEventListener('click', refreshAnalytics);
    refreshAnalytics();
  }

  function refreshAnalytics(){
    const analytics = getAnalyticsData();
    const sessions = analytics.sessions || [];
    const activities = analytics.activities || [];
    const docsAdded = analytics.documentsAdded || [];

    // Stats
    const uniqueSessions = sessions.length;
    const totalActivities = activities.length;
    const downloads = activities.filter(a=>a.type==='download').length;
    const avgDuration = sessions.length > 0 ? Math.round(sessions.reduce((sum, s)=>sum + (s.duration||0), 0) / sessions.length / 1000) : 0;

    document.getElementById('totalVisitors').textContent = uniqueSessions;
    document.getElementById('totalSessions').textContent = uniqueSessions;
    document.getElementById('avgTime').textContent = avgDuration + 's';
    document.getElementById('totalDownloads').textContent = downloads;

    // Recent activity log (last 15)
    const actLog = document.getElementById('activityLog');
    const recentActivities = activities.slice(-15).reverse();
    actLog.innerHTML = recentActivities.map(a=>`<div class="p-2 bg-white rounded border-l-2 border-blue-400"><div class="font-mono text-xs text-gray-500">${new Date(a.timestamp).toLocaleString()}</div><div class="text-sm"><strong>${escapeHtml(a.type)}</strong> on ${escapeHtml(a.page)}</div>${a.details && a.details.fileName ? '<div class="text-xs text-gray-600">📥 ' + escapeHtml(a.details.fileName) + '</div>' : ''}</div>`).join('');
    if(recentActivities.length === 0) actLog.innerHTML = '<div class="text-gray-500 text-center py-4">No activity recorded</div>';

    // Documents added timeline
    const timeline = document.getElementById('docsTimeline');
    const sortedDocs = (docsAdded || []).sort((a,b)=>(b.addedAt||0)-(a.addedAt||0));
    timeline.innerHTML = sortedDocs.slice(0, 10).map(d=>{
      const date = new Date(d.addedAt||0).toLocaleString();
      return `<div class="p-2 bg-white rounded border-l-2 border-green-400"><div class="font-mono text-xs text-gray-500">${date}</div><div class="text-sm"><strong>${escapeHtml(d.title)}</strong></div><div class="text-xs text-gray-600">📚 ${escapeHtml(d.department)} • Level ${escapeHtml(d.level)}</div></div>`;
    }).join('');
    if(sortedDocs.length === 0) timeline.innerHTML = '<div class="text-gray-500 text-center py-4">No documents recorded</div>';

    // Session details table
    const tbody = document.getElementById('sessionsTable');
    tbody.innerHTML = sessions.slice(-10).reverse().map(s=>{
      const duration = Math.round((s.duration||0)/1000);
      const pages = (s.pageViews||[]).length;
      const acts = (s.activities||[]).length;
      const start = new Date(s.startTime).toLocaleString();
      const id = (s.id||'').substring(0, 15) + '...';
      return `<tr class="border-t"><td class="p-2 font-mono text-xs">${id}</td><td class="p-2">${duration}s</td><td class="p-2">${pages}</td><td class="p-2">${acts}</td><td class="p-2 text-xs">${start}</td></tr>`;
    }).join('');
    if(sessions.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No sessions recorded. Visit the site to track activity.</td></tr>';
  }

  // ---------------- Legal generator ----------------
  function setupLegalGen(){
    document.querySelectorAll('.genLegal').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const target = btn.dataset.target; let title='', body='';
        if(target==='privacy'){ title=document.getElementById('ppTitle').value; body=document.getElementById('ppBody').value; }
        if(target==='tos'){ title=document.getElementById('tosTitle').value; body=document.getElementById('tosBody').value; }
        if(target==='cookie'){ title=document.getElementById('cookieTitle').value; body=document.getElementById('cookieBody').value; }
        const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body><main><h1>${escapeHtml(title)}</h1><pre>${escapeHtml(body)}</pre></main></body></html>`;
        const blob = new Blob([html],{type:'text/html'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download = title.replace(/\s+/g,'-').toLowerCase()+'.html'; a.click(); URL.revokeObjectURL(url);
      });
    });
  }

  // ---------------- Settings ----------------
  function setupSettings(){
    document.getElementById('exportAll').addEventListener('click', ()=>{
      const payload = { adminDocuments: getDocs(), pendingSubmissions: JSON.parse(localStorage.getItem('pendingSubmissions')||'[]') };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='edutvet-backup.json'; a.click(); URL.revokeObjectURL(url);
    });
    document.getElementById('clearLocal').addEventListener('click', ()=>{ if(confirm('Clear local admin data?')){ localStorage.removeItem('adminDocuments'); localStorage.removeItem('pendingSubmissions'); alert('Cleared'); refreshDashboard(); renderDocs(); }});
  }

  // ---------------- Helpers ----------------
  function escapeHtml(s){ return (s||'').toString().replace(/[&<>\"]+/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]||c)); }

});
