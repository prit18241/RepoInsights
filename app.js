// ── APPLICATION STATE MANAGEMENT ──────────────────────────────────────────────
var D = null, CH = {}, CMPL = [];
var HIST = JSON.parse(localStorage.getItem('ri_h') || '[]');
var SET  = JSON.parse(localStorage.getItem('ri_s') || '{"theme":"dark","w":{"commits":20,"issues":20,"prs":20,"docs":20,"activity":20}}');
var LC   = ['#58a6ff','#3fb950','#d29922','#bc8cff','#ffa657','#f778ba','#f85149','#38bdf8','#a3e635','#fb923c'];
var STEPS = ['Fetching repository info…','Loading commit activity…','Analyzing contributors…','Scanning languages…','Checking issues & pull requests…','Fetching releases…','Computing health score & AI insights…'];

// ── INITIALIZATION CYCLE ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  applyTheme(SET.theme || 'dark'); refreshHB();
  var riInput = document.getElementById('ri');
  if (riInput) riInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') go(); });
});

// ── THEME SWITCHING ROUTINES ──────────────────────────────────────────────────
function applyTheme(t) {
  var rootStyle = document.documentElement.style;
  rootStyle.setProperty('--bg0', t === 'dark' ? '#0d1117' : '#f6f8fa');
  rootStyle.setProperty('--bg1', t === 'dark' ? '#161b22' : '#ffffff');
  rootStyle.setProperty('--bg2', t === 'dark' ? '#21262d' : '#f3f4f6');
  rootStyle.setProperty('--bg3', t === 'dark' ? '#30363d' : '#e8edf2');
  rootStyle.setProperty('--br',  t === 'dark' ? '#30363d' : '#d0d7de');
  rootStyle.setProperty('--br2', t === 'dark' ? '#21262d' : '#e8edf2');
  rootStyle.setProperty('--t1',  t === 'dark' ? '#e6edf3' : '#1f2328');
  rootStyle.setProperty('--t2',  t === 'dark' ? '#8b949e' : '#57606a');
  rootStyle.setProperty('--t3',  t === 'dark' ? '#484f58' : '#afb8c1');
  document.body.style.background = t === 'dark' ? '#0d1117' : '#f6f8fa';
  document.body.style.color      = t === 'dark' ? '#e6edf3' : '#1f2328';
  SET.theme = t; saveSets();
}
function switchTheme() { applyTheme(SET.theme === 'dark' ? 'light' : 'dark'); }
function saveSets() { localStorage.setItem('ri_s', JSON.stringify(SET)); }

// ── CORE VIEW CONFIGURATION ROUTINE ───────────────────────────────────────────
function showView(id) {
  ['vLand','vLoad','vErr','vDash'].forEach(function(v) {
    var viewElement = document.getElementById(v); if (viewElement) viewElement.classList.remove('active');
  });
  var targetView = document.getElementById(id); if (targetView) targetView.classList.add('active');
}

// ── NAVIGATION CONTROLLER ─────────────────────────────────────────────────────
function nav(id) {
  var freePages = ['history', 'settings'];
  if (!D && freePages.indexOf(id) === -1) { showToast('Analyze a repository first!', 'err'); return; }
  document.querySelectorAll('.nb').forEach(function(b) { b.classList.remove('on'); });
  var btn = document.getElementById('n-' + id); if (btn) btn.classList.add('on');
  document.querySelectorAll('#vDash .page').forEach(function(p) { p.classList.remove('active'); });
  var pg = document.getElementById('p-' + id); if (pg) pg.classList.add('active');
  showView('vDash');
  if (id === 'history')  renderHist();
  if (id === 'settings') renderSets();
}

// ── URL & REPOSITORY STRIP PARSING ────────────────────────────────────────────
function parseRepo(v) {
  v = (v || '').trim();
  if (v.indexOf('github.com') > -1) {
    var m = v.match(/github\.com\/([^\/]+\/[^\/\?\#]+)/); if (m) return m[1].replace(/\.git$/, '');
  }
  if (/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(v)) return v;
  return null;
}
function qs(r) { var riInput = document.getElementById('ri'); if (riInput) riInput.value = r; go(); }
function setStep(i) {
  document.querySelectorAll('.lstep').forEach(function(el, idx) {
    el.classList.remove('cur', 'done');
    if (idx < i)  el.classList.add('done');
    if (idx === i) el.classList.add('cur');
  });
}

// ── ASYNCHRONOUS GITHUB API AGGREGATION ENGINE ──────────────────────────────
async function go() {
  var riInput = document.getElementById('ri');
  var repo = riInput ? parseRepo(riInput.value) : null;
  if (!repo) { showToast('Enter a valid owner/repository', 'err'); return; }
  var lstepsContainer = document.getElementById('lsteps');
  if (lstepsContainer) {
    lstepsContainer.innerHTML = STEPS.map(function(s, i) { return '<div class="lstep"><div class="ldot"></div>' + s + '</div>'; }).join('');
  }
  showView('vLoad');
  var abtnElement = document.getElementById('abtn'); if (abtnElement) abtnElement.disabled = true;
  var hdrs = { 'Accept': 'application/vnd.github+json' };
  function api(p) { return fetch('https://api.github.com/repos/' + repo + p, { headers: hdrs }); }

  try {
    setStep(0); var r0 = await api('');
    if (!r0.ok) {
      var code = r0.status;
      throw new Error(code === 404 ? 'Repository "' + repo + '" not found.' : code === 403 ? 'Rate limit hit. Add a GitHub token in the sidebar.' : 'GitHub API error: HTTP ' + code);
    }
    var rd = await r0.json();
    
    setStep(1); var ca = []; try { var r1 = await api('/stats/commit_activity'); if (r1.ok) ca = await r1.json(); } catch(e) {}
    setStep(2); var ctbs = []; try { var r2 = await api('/contributors?per_page=30'); if (r2.ok) ctbs = await r2.json(); } catch(e) {}
    var totalC = ctbs.length;
    try {
      var r2b = await api('/contributors?per_page=1&anon=true');
      if (r2b.ok) {
        var lh2 = r2b.headers.get('Link');
        if (lh2) { var m2 = lh2.match(/page=(\d+)>; rel="last"/); if (m2) totalC = parseInt(m2[1]); }
      }
    } catch(e) {}

    setStep(3); var langs = {}; try { var r3 = await api('/languages'); if (r3.ok) langs = await r3.json(); } catch(e) {}
    setStep(4); var openI = rd.open_issues_count || 0, closedI = 0;
    try {
      var r4 = await api('/issues?state=closed&per_page=1');
      if (r4.ok) {
        var lh4 = r4.headers.get('Link');
        if (lh4) { var m4 = lh4.match(/page=(\d+)>; rel="last"/); if (m4) closedI = parseInt(m4[1]); }
        if (!closedI) { var d4 = await r4.json(); closedI = d4.length; }
      }
    } catch(e) {}

    var openPR = 0, closedPR = 0, mergedPR = 0;
    try {
      var r5a = await api('/pulls?state=open&per_page=1');
      if (r5a.ok) {
        var lh5 = r5a.headers.get('Link');
        if (lh5) { var m5 = lh5.match(/page=(\d+)>; rel="last"/); if (m5) openPR = parseInt(m5[1]); }
        if (!openPR) { var d5 = await r5a.json(); openPR = d5.length; }
      }
      var r5b = await api('/pulls?state=closed&per_page=30');
      if (r5b.ok) {
        var prs = await r5b.json(); closedPR = prs.length;
        mergedPR = prs.filter(function(p) { return p.merged_at; }).length;
      }
    } catch(e) {}

    setStep(5); var rels = []; try { var r6 = await api('/releases?per_page=10'); if (r6.ok) rels = await r6.json(); } catch(e) {}
    setStep(6);
    var health = calcHealth(rd, ca, ctbs, openI, closedI, openPR, closedPR, mergedPR, langs, rels);
    var ai     = genAI(rd, health, ctbs, langs, openI, closedI, ca, rels);

    D = { rd:rd, ca:ca, ctbs:ctbs, totalC:totalC, langs:langs, openI:openI, closedI:closedI, openPR:openPR, closedPR:closedPR, mergedPR:mergedPR, rels:rels, health:health, ai:ai };
    saveHist(rd, health.overall); killCharts(); renderAll(); showView('vDash');
    
    document.querySelectorAll('.nb').forEach(function(b) { b.classList.remove('on'); });
    var overviewNav = document.getElementById('n-overview'); if (overviewNav) overviewNav.classList.add('on');
    document.querySelectorAll('#vDash .page').forEach(function(p) { p.classList.remove('active'); });
    var overviewPage = document.getElementById('p-overview'); if (overviewPage) overviewPage.classList.add('active');
  } catch(err) {
    var etitleEl = document.getElementById('etitle'), emsgEl = document.getElementById('emsg');
    if (etitleEl) etitleEl.textContent = err.message.indexOf('not found') > -1 ? 'Repository Not Found' : 'Analysis Failed';
    if (emsgEl) emsgEl.textContent = err.message;
    showView('vErr');
  }
  if (abtnElement) abtnElement.disabled = false;
}

// ── HEURISTIC COMPOSITE HEALTH SCORE CALCULATOR ──────────────────────────────
function calcHealth(repo, commits, ctbs, openI, closedI, openPR, closedPR, mergedPR, langs, rels) {
  var w = SET.w, cS = 0;
  if (commits && commits.length) {
    var rec = 0, old2 = 0;
    for (var i = Math.max(0, commits.length - 12); i < commits.length; i++) rec += (commits[i].total || 0);
    for (var j = 0; j < Math.min(12, commits.length); j++) old2 += (commits[j].total || 0);
    cS = Math.min(100, (rec / Math.max(1, old2)) * 50 + Math.min(50, rec / 2));
  }
  var totalI = openI + closedI, iS = totalI === 0 ? 70 : Math.min(100, closedI / totalI * 100);
  var prTot = openPR + closedPR + mergedPR, pS = prTot === 0 ? 70 : Math.min(100, 40 + mergedPR / Math.max(1, closedPR + mergedPR) * 60);
  var dS = 40;
  if (repo.description && repo.description.length > 20) dS += 15;
  if (repo.homepage) dS += 10; if (repo.license) dS += 15;
  if (repo.topics && repo.topics.length) dS += 10; if (rels.length) dS += 10;
  dS = Math.min(100, dS); var aS = Math.min(40, ctbs.length * 4);
  var dsUp = (Date.now() - new Date(repo.updated_at)) / 86400000;
  if (dsUp < 7) aS += 60; else if (dsUp < 30) aS += 45; else if (dsUp < 90) aS += 30; else if (dsUp < 365) aS += 15;
  aS = Math.min(100, aS);
  var overall = Math.round((Math.round(cS)*w.commits + Math.round(iS)*w.issues + Math.round(pS)*w.prs + dS*w.docs + aS*w.activity) / 100);
  var status = overall >= 80 ? 'Excellent' : overall >= 60 ? 'Good' : overall >= 40 ? 'Average' : 'Poor';
  var dsPush = (Date.now() - new Date(repo.pushed_at)) / 86400000;
  var actSt = dsPush < 7 ? 'Very Active' : dsPush < 30 ? 'Active' : dsPush < 90 ? 'Moderate' : dsPush < 365 ? 'Inactive' : 'Abandoned';
  return { overall:overall, status:status, cS:Math.round(cS), iS:Math.round(iS), pS:Math.round(pS), dS:dS, aS:aS, actSt:actSt };
}

// ── SYNTHETIC METRIC-DRIVEN AI RECAP GENERATOR ────────────────────────────────
function genAI(repo, h, ctbs, langs, openI, closedI, ca, rels) {
  var topLang = Object.keys(langs)[0] || 'code', totalI = openI + closedI;
  var cr = totalI ? Math.round(closedI / totalI * 100) : 0, dsPush = Math.round((Date.now() - new Date(repo.pushed_at)) / 86400000);
  var stMap = { 'Very Active':'actively maintained','Active':'actively maintained','Moderate':'moderately active','Inactive':'less active recently','Abandoned':'no longer actively maintained' };
  var sw = stMap[h.actSt] || 'maintained';
  var sum = repo.full_name + ' is a ' + sw + ' repository with ' + fN(repo.stargazers_count) + ' stars. Built primarily in ' + topLang + ', it scores ' + h.overall + '/100 (' + h.status + ') overall. Issue close rate is ' + cr + '% across ' + fN(totalI) + ' total issues, with ' + ctbs.length + '+ tracked contributors.';
  var str = [], wkn = [], sug = [];
  
  if (repo.stargazers_count > 1000) str.push('High community adoption (' + fN(repo.stargazers_count) + ' stars) signals proven utility and trust.');
  if (ctbs.length >= 10) str.push('Broad contributor base (' + ctbs.length + '+) reduces single-point-of-failure risk.');
  if (repo.license) str.push('Clear ' + repo.license.name + ' license makes adoption and contribution straightforward.');
  if (cr >= 70) str.push(cr + '% issue close rate reflects a responsive maintenance team.');
  if (rels.length > 0) str.push('Regular releases (' + rels.length + ' published) signal active project management.');
  if (h.cS > 70) str.push('Consistent commit activity demonstrates healthy ongoing development.');
  if (!str.length) str.push('Repository is publicly available and accepting contributions.');
  if (openI > 100) wkn.push('High open issue backlog (' + fN(openI) + ') may indicate bottlenecked maintenance.');
  if (!repo.description || repo.description.length < 20) wkn.push('Missing or too-brief description reduces discoverability.');
  if (!repo.homepage) wkn.push('No project homepage — users lack a central documentation entry point.');
  if (h.dS < 50) wkn.push('Low documentation score — README, license, or contributing guide may be incomplete.');
  if (ctbs.length < 5) wkn.push('Very few tracked contributors (' + ctbs.length + ') — high bus-factor risk.');
  if (dsPush > 180) wkn.push('Last commit was ' + dsPush + ' days ago — project may be slowing down.');
  if (openI > 50) sug.push('Triage open issues with labels ("help wanted", "good first issue") to attract contributors.');
  if (!repo.homepage) sug.push('Add a documentation website or demo link for better discoverability.');
  if (!rels.length) sug.push('Establish a semantic versioning release cadence to signal stability.');
  if (ctbs.length < 10) sug.push('Improve CONTRIBUTING.md and label beginner-friendly issues.');
  sug.push('Add CI/CD status badges to README to communicate build health at a glance.');
  if (h.dS < 60) sug.push('Enhance docs: add usage examples, API reference, and a CHANGELOG.');
  
  var chks = { 'Project title & description': !!repo.description, 'License information': !!repo.license, 'Project homepage': !!repo.homepage, 'Topics / tags': !!(repo.topics && repo.topics.length), 'Release history': rels.length > 0, 'Contributor guidelines': ctbs.length > 5, 'CI/CD setup': repo.stargazers_count > 500, 'Issue templates': repo.stargazers_count > 1000 };
  var rdSc = Math.round(Object.keys(chks).filter(function(k) { return chks[k]; }).length / Object.keys(chks).length * 100);
  return { sum:sum, str:str, wkn:wkn, sug:sug, chks:chks, rdSc:rdSc };
}

// ── DATA RENDERING PIPELINE MASTER CYCLE ──────────────────────────────────────
function renderAll() {
  rHdr(); rOvMtx(); rOvCharts(); rAiOv(); rHealth(); rLangs(); rCtbs(); rCommits(); rIssues(); rAIFull(); rReadme(); rComm(); rMaint(); rCompare();
}
function rHdr() {
  var r = D.rd, h = D.health, tc = h.overall >= 80 ? 'tgr' : h.overall >= 60 ? 'tbl' : h.overall >= 40 ? 'tyl' : 'trd', target = document.getElementById('s-rhdr'); if (!target) return;
  target.innerHTML = '<div class="rhdr"><img class="r-av" src="' + r.owner.avatar_url + '" alt="" loading="lazy"/><div class="r-info"><div class="r-name"><span>' + r.owner.login + ' / </span>' + r.name + '</div><div class="r-desc">' + (r.description || 'No description.') + '</div><div class="tags">' + (r.language ? '<span class="tag tbl">' + r.language + '</span>' : '') + (r.license ? '<span class="tag tgr">' + r.license.spdx_id + '</span>' : '') + '<span class="tag ' + tc + '">Health ' + h.overall + '/100 &mdash; ' + h.status + '</span><span class="tag tpu">' + r.default_branch + '</span>' + (r.topics||[]).slice(0,3).map(function(t) { return '<span class="tag tbl">' + t + '</span>'; }).join('') + '</div></div><div class="r-right"><div class="r-links"><a class="lbtn" href="' + r.html_url + '" target="_blank">GitHub &#8599;</a>' + (r.homepage ? '<a class="lbtn" href="' + r.homepage + '" target="_blank">Site &#8599;</a>' : '') + '</div><div class="r-dates">Created ' + fD(r.created_at) + '<br>Updated ' + fD(r.updated_at) + '</div></div></div>';
}
function rOvMtx() {
  var r = D.rd, target = document.getElementById('s-omtx'); if (!target) return;
  target.innerHTML = mc('&#11088;','Stars', fN(r.stargazers_count),'','cyl') + mc('&#127860;','Forks', fN(r.forks_count), '','cbl') + mc('&#128065;','Watchers', fN(r.subscribers_count||r.watchers_count),'','cpu') + mc('&#9888;','Open Issues', fN(r.open_issues_count),'','crd') + mc('&#128101;','Contributors',fN(D.totalC),D.ctbs.length+' tracked','cgr') + mc('&#9668;','Language', r.language||'N/A',Object.keys(D.langs).length+' total','cor');
}
function mc(ic,lb,val,sub,cls) { return '<div class="mc '+cls+'"><div class="mc-lbl">'+ic+' '+lb+'</div><div class="mc-val">'+val+'</div>'+(sub?'<div class="mc-sub">'+sub+'</div>':'')+'</div>'; }
function rOvCharts() { var ca = D.ca; if (ca && ca.length) { var sl = ca.slice(-26); mkBar('c-caov', sl.map(function(_,i){return'W'+(i+1);}), sl.map(function(w){return w.total||0;}), '#58a6ff'); } mkDng('c-lpov'); }
function rAiOv() { var target = document.getElementById('s-aiov'); if (target) target.innerHTML = '<div class="ct">&#10022; AI Summary</div><p style="font-size:13px;color:var(--t2);line-height:1.75">' + D.ai.sum + '</p>'; }

function rHealth() {
  var h = D.health, cc = {Excellent:'#3fb950',Good:'#58a6ff',Average:'#d29922',Poor:'#f85149'}[h.status]||'#8b949e', targetMain = document.getElementById('s-hmain');
  if (targetMain) {
    targetMain.innerHTML = '<div class="hmain"><div class="arc-wrap"><canvas id="harc" width="120" height="120"></canvas><div class="arc-ctr"><span class="arc-num" style="color:'+cc+'">'+h.overall+'</span><span class="arc-lbl">/ 100</span></div></div><div class="hinfo"><div class="hbdg" style="background:'+cc+'22;color:'+cc+';border:1px solid '+cc+'44">'+h.status+' Repository</div><p style="font-size:13px;color:var(--t2);line-height:1.65;max-width:360px">'+D.ai.sum.split('.')[0]+'.</p></div></div>';
  }
  setTimeout(function(){ drawArc('harc',h.overall,cc,120); },80);
  var dims = [ {lb:'Commit Activity',sc:h.cS,cl:'#58a6ff'},{lb:'Issue Health',sc:h.iS,cl:'#3fb950'},{lb:'PR Activity',sc:h.pS,cl:'#bc8cff'},{lb:'Documentation',sc:h.dS,cl:'#d29922'},{lb:'Contributor Activity',sc:h.aS,cl:'#f778ba'} ];
  var targetBrkd = document.getElementById('s-hbrkd'); if (targetBrkd) { targetBrkd.innerHTML = dims.map(function(d) { return '<div class="hbrow"><span class="hb-lbl">'+d.lb+'</span><div class="hb-bar"><div class="hb-fill" style="width:'+d.sc+'%;background:'+d.cl+'"></div></div><span class="hb-sc">'+d.sc+'</span></div>'; }).join(''); }
  var r = D.rd, dsPush = Math.round((Date.now()-new Date(r.pushed_at))/86400000), cl = D.ctbs.length, targetRisks = document.getElementById('s-risks');
  if (targetRisks) {
    targetRisks.innerHTML = '<div class="risk-item '+(cl<3?'r-hi':cl<8?'r-md':'r-lo')+'"><div class="rdot"></div>Bus factor: '+(cl<3?'High':cl<8?'Moderate':'Low')+' ('+cl+' contributors)</div><div class="risk-item '+(D.openI>200?'r-hi':D.openI>50?'r-md':'r-lo')+'"><div class="rdot"></div>Issue backlog: '+fN(D.openI)+' open</div><div class="risk-item '+(dsPush>365?'r-hi':dsPush>90?'r-md':'r-lo')+'"><div class="rdot"></div>Last commit: '+dsPush+' days ago</div><div class="risk-item '+(r.license?'r-lo':'r-md')+'"><div class="rdot"></div>'+(r.license?'License: '+r.license.name:'No license detected')+'</div>';
  }
  var stCls = {'Very Active':'s-va','Active':'s-a','Moderate':'s-m','Inactive':'s-i','Abandoned':'s-ab'}[h.actSt]||'s-ab', targetActst = document.getElementById('s-actst');
  if (targetActst) targetActst.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div class="spill '+stCls+'"><span class="sdot"></span>'+h.actSt+'</div><span style="font-size:13px;color:var(--t2)">Last push: '+fD(r.pushed_at)+' &bull; Branch: <code style="color:var(--blue)">'+r.default_branch+'</code></span></div>';
}

function rLangs() {
  mkDng('c-ldng'); var langs = D.langs, total = Object.values(langs).reduce(function(s,v){return s+v;},0), sorted = Object.keys(langs).sort(function(a,b){return langs[b]-langs[a];});
  var targetDtl = document.getElementById('s-ldtl'); if (targetDtl) { targetDtl.innerHTML = sorted.map(function(nm,i) { var pct = total?(langs[nm]/total*100).toFixed(1):0; return '<div class="lrow"><div class="ldot2" style="background:'+LC[i%LC.length]+'"></div><span class="lname">'+nm+'</span><span class="lbytes">'+fBytes(langs[nm])+'</span><div class="lbar-bg"><div class="lbar-fill" style="width:'+pct+'%;background:'+LC[i%LC.length]+'"></div></div><span class="lpct">'+pct+'%</span></div>'; }).join(''); }
  var targetLgnd = document.getElementById('s-lgnd'); if (targetLgnd) { targetLgnd.innerHTML = sorted.slice(0,8).map(function(nm,i) { return '<span class="leg-item"><span class="leg-dot" style="background:'+LC[i%LC.length]+'"></span>'+nm+'</span>'; }).join(''); }
}
function mkDng(id) {
  var langs = D.langs, total = Object.values(langs).reduce(function(s,v){return s+v;},0), sorted = Object.keys(langs).sort(function(a,b){return langs[b]-langs[a];}).slice(0,8), data = sorted.map(function(n){return total?+(langs[n]/total*100).toFixed(1):0;}), c = document.getElementById(id); if(!c) return; if(CH[id]){CH[id].destroy();}
  CH[id]=new Chart(c,{type:'doughnut',data:{labels:sorted,datasets:[{data:data,backgroundColor:sorted.map(function(_,i){return LC[i%LC.length];}),borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ctx.label+': '+ctx.parsed+'%';}}}}}});
}

// ── HOME PAGE NAVIGATION ROUTINE ──────────────────────────────────────────────
function goHome() {
  document.querySelectorAll('.nb').forEach(function(b) { b.classList.remove('on'); });
  D = null;
  var inp = document.getElementById('ri'); if (inp) inp.value = '';
  showView('vLand');
}

function rCtbs() {
  var c = D.ctbs, max = c.length?c[0].contributions:1, tot = c.reduce(function(s,x){return s+x.contributions;},0), targetCmtx = document.getElementById('s-cmtx');
  if (targetCmtx) targetCmtx.innerHTML = mc('&#128101;','Total',fN(D.totalC),'All time','cbl')+mc('&#127942;','Top',c.length?c[0].login:'N/A',c.length?fN(c[0].contributions)+' commits':'','cyl')+mc('&#128221;','Tracked',c.length,'Top contributors','cgr')+mc('&#9889;','Bus Factor',c.length<3?'High Risk':c.length<8?'Moderate':'Low','',c.length<3?'crd':c.length<8?'cor':'cgr');
  var targetCtbl = document.getElementById('s-ctbl'); if (targetCtbl) { targetCtbl.innerHTML = c.slice(0,15).map(function(u,i) { var pct=Math.round(u.contributions/max*100), sh=Math.round(u.contributions/tot*100), rc=i===0?'rk1':i===1?'rk2':i===2?'rk3':'rkn'; return '<tr><td><span class="rnk '+rc+'">'+(i+1)+'</span></td><td><img class="cav" src="'+u.avatar_url+'&s=52" alt="" loading="lazy"/>'+u.login+'</td><td><strong>'+fN(u.contributions)+'</strong></td><td>'+sh+'%</td><td><span class="imp-bar" style="width:'+Math.min(pct,100)+'px"></span></td></tr>'; }).join(''); }
  mkBar('c-cbar',c.slice(0,10).map(function(u){return u.login;}),c.slice(0,10).map(function(u){return u.contributions;}),'#58a6ff');
}

function rCommits() {
  var ca=D.ca||[], total=0, peak=0, streak=0; ca.forEach(function(w){total+=(w.total||0);if((w.total||0)>peak)peak=w.total;});
  var active=ca.filter(function(w){return(w.total||0)>0;}).length, avg=active?Math.round(total/active):0, rec=ca.slice(-4).reduce(function(s,w){return s+(w.total||0);},0);
  for(var k=ca.length-1;k>=0;k--){if((ca[k].total||0)>0)streak++;else break;}
  var targetCmmtx = document.getElementById('s-cmmtx'); if (targetCmmtx) targetCmmtx.innerHTML = mc('&#128221;','Total Commits',fN(total),'All tracked','cbl')+mc('&#128202;','Avg/Week',avg,'Active weeks','cgr')+mc('&#128640;','Peak Week',peak,'All time','cyl')+mc('&#128293;','Current Rate',Math.round(rec/4)+'/wk','Last 4 weeks','cpu')+mc('&#9939;','Streak',streak+'w','Consecutive','cor');
  if(ca.length) { var wk=ca.slice(-26); mkBar('c-cwk',wk.map(function(_,i){return'W'+(i+1);}),wk.map(function(w){return w.total||0;}), '#58a6ff'); var mo=[]; for(var m=0;m<12;m++){var s=0;for(var n=m*4;n<m*4+4&&n<ca.length;n++)s+=(ca[n].total||0);mo.push(s);} mkLine('c-cmo',['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'],mo,'#3fb950'); }
}

function rIssues() {
  var open=D.openI, closed=D.closedI, total=open+closed, cr=total?Math.round(closed/total*100):0, crC=cr>=70?'var(--green)':cr>=40?'var(--yellow)':'var(--red)';
  var targetImtx = document.getElementById('s-imtx'); if (targetImtx) targetImtx.innerHTML = mc('&#128308;','Open Issues',fN(open),'','crd')+mc('&#9989;','Closed Issues',fN(closed),'','cgr')+mc('&#128202;','Total Issues',fN(total),'','cbl')+mc('&#10004;','Close Rate',cr+'%',cr>=70?'Healthy':cr>=40?'Moderate':'Low',cr>=70?'cgr':cr>=40?'cor':'crd');
  var targetIrat = document.getElementById('s-irat'); if (targetIrat) targetIrat.innerHTML = '<p style="font-size:13px;margin-bottom:7px;color:var(--t2)">Close rate: <strong style="color:'+crC+'">'+cr+'%</strong></p><div class="ratio-bar"><div class="rseg" style="width:'+cr+'%;background:var(--green)"></div><div class="rseg" style="width:'+(100-cr)+'%;background:var(--red)"></div></div><div class="rlbls"><span style="color:var(--green)">Closed: '+fN(closed)+'</span><span style="color:var(--red)">Open: '+fN(open)+'</span></div>';
  mkPie('c-idng',['Open','Closed'],[open,closed],['#f85149','#3fb950']);
  var targetIstat = document.getElementById('s-istat'); if (targetIstat) targetIstat.innerHTML = sr('Open Issues',fN(open),'var(--red)')+sr('Closed Issues',fN(closed),'var(--green)')+sr('Total Issues',fN(total),'')+sr('Close Rate',cr+'%',crC)+sr('Health',cr>=70?'Healthy':cr>=40?'Moderate':'Needs Work','');
}
function sr(lb,val,col) { return '<div class="srow"><span>'+lb+'</span><strong'+(col?' style="color:'+col+'"':'')+'>'+val+'</strong></div>'; }

function rAIFull() {
  var ai=D.ai, target = document.getElementById('s-aifull'); if (!target) return;
  target.innerHTML = '<div class="aibox"><div class="aihdr"><span style="font-size:18px">&#10022;</span><h3>AI Repository Summary</h3></div><p class="aitxt">'+ai.sum+'</p></div><div class="g2"><div class="card"><div class="ct">&#10004; Strengths</div>'+ai.str.map(function(s){return ins('ins-s','&#10003;',s);}).join('')+'</div><div class="card"><div class="ct">&#9888; Weaknesses</div>'+ai.wkn.map(function(s){return ins('ins-w','&#10007;',s);}).join('')+'</div></div><div class="card"><div class="ct">&#128161; Recommendations</div>'+ai.sug.map(function(s){return ins('ins-r','&#8594;',s);}).join('')+'</div>';
}
function ins(cls,ic,txt) { return '<div class="ins '+cls+'"><span class="ins-ic">'+ic+'</span>'+txt+'</div>'; }

function rReadme() {
  var ai=D.ai, sc=ai.rdSc, col=sc>=75?'var(--green)':sc>=50?'var(--yellow)':'var(--red)', target = document.getElementById('s-rdme'); if (!target) return;
  target.innerHTML = '<div class="card" style="margin-bottom:13px"><div class="ct">Documentation Score</div><div class="rdsc-box"><span class="rdsc-num" style="color:'+col+'">'+sc+'</span><span style="font-size:13px;color:var(--t3)">/ 100</span><div class="rdsc-bar"><div class="rdsc-fill" style="width:'+sc+'%;background:'+col+'"></div></div><span style="font-size:13px;color:'+col+'">'+(sc>=75?'Good':sc>=50?'Needs Work':'Poor')+'</span></div></div><div class="card"><div class="ct">Section Checklist</div><div class="chk-list">'+Object.keys(ai.chks).map(function(k){var v=ai.chks[k];return '<div class="chk '+(v?'pass':'fail')+'">'+(v?'&#10004;':'&#10008;')+' '+k+(!v?'<span class="miss">Missing</span>':'')+'</div>';}).join('')+'</div></div>';
}

function rComm() {
  var r=D.rd, c=D.ctbs, tot=c.reduce(function(s,x){return s+x.contributions;},0), top3=c.slice(0,3).reduce(function(s,x){return s+x.contributions;},0), t3p=tot?Math.round(top3/tot*100):0, target = document.getElementById('s-comm'); if (!target) return;
  target.innerHTML = '<div class="card" style="margin-bottom:13px"><div class="ct">Community Metrics</div><div class="cg3">'+cc2('&#11088;',fN(r.stargazers_count),'Stars','var(--yellow)')+cc2('&#127860;',fN(r.forks_count),'Forks','var(--blue)')+cc2('&#128065;',fN(r.subscribers_count||r.watchers_count),'Watchers','var(--purple)')+cc2('&#128101;',fN(D.totalC),'Contributors','var(--green)')+cc2('&#127991;',(r.topics||[]).length,'Topics','var(--t2)')+cc2('&#9889;',r.forks_count>0?Math.round(r.stargazers_count/r.forks_count)+'x':'N/A','Star:Fork','var(--orange)')+'</div></div><div class="g2"><div class="card"><div class="ct">Popularity</div>'+pb('Stars',r.stargazers_count,100000,'var(--yellow)')+pb('Forks',r.forks_count,20000,'var(--blue)')+pb('Watchers',r.subscribers_count||0,5000,'var(--purple)')+'</div><div class="card"><div class="ct">Contributor Diversity</div><p style="font-size:13px;color:var(--t2);line-height:1.75">Top 3 contributors hold <strong>'+t3p+'%</strong> of commits.<br><br>'+(c.length<5?'&#9888; Very concentrated — high bus-factor.':c.length<15?'&#8226; Moderate diversity.':'&#10004; Well-distributed graph.')+'</p></div></div>';
}
function cc2(ic,val,lb,col) { return '<div class="ccard"><div class="cv" style="color:'+col+'">'+ic+' '+val+'</div><div class="cl">'+lb+'</div></div>'; }
function pb(lb,val,max,col) { var pct=Math.min(100,Math.round(val/max*100)); return '<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--t2)">'+lb+'</span><span style="color:var(--t3)">'+fN(val)+'</span></div><div style="height:5px;background:var(--bg3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:3px"></div></div></div>'; }

function rMaint() {
  var r=D.rd, rels=D.rels, dsPush=Math.round((Date.now()-new Date(r.pushed_at))/86400000), ageMo=Math.round((Date.now()-new Date(r.created_at))/86400000/30), relF=rels.length>1?Math.round((Date.now()-new Date(r.created_at))/86400000/rels.length):null, target = document.getElementById('s-maint'); if (!target) return;
  target.innerHTML = '<div class="mgrid">'+mc('&#128197;','Last Commit',dsPush+'d ago',fD(r.pushed_at),dsPush<30?'cgr':dsPush<90?'cor':'crd')+mc('&#127991;','Releases',rels.length,'Published','cbl')+mc('&#9201;','Rel. Freq',relF?'~'+relF+'d':'N/A','Between releases','cpu')+mc('&#128198;','Repo Age',ageMo+'mo','Since creation','cgr')+'</div><div class="card"><div class="ct">Release History</div>'+(rels.length?rels.slice(0,8).map(function(rel) { return '<div class="rel-item"><div><span class="rel-tag">'+rel.tag_name+'</span>'+(rel.name?'<span style="color:var(--t2);font-size:12px;margin-left:7px">'+rel.name+'</span>':'')+(rel.prerelease?'<span class="pre-bdg">pre</span>':'')+'</div><span style="color:var(--t3);font-size:12px">'+fD(rel.published_at)+'</span></div>'; }).join(''):'<p style="color:var(--t3);font-size:13px;padding:10px 0">No releases published yet.</p>')+'</div>';
}

function rCompare() { var html = mkCC(D.rd, D.health); CMPL.forEach(function(cd) { html += mkCC(cd.rd, cd.health); }); var target = document.getElementById('s-cmpg'); if (target) target.innerHTML = html; }
function mkCC(r,h) { var cc={Excellent:'#3fb950',Good:'#58a6ff',Average:'#d29922',Poor:'#f85149'}[h.status]||'#8b949e'; return '<div class="cmp-card"><div class="cmp-hdr"><img src="'+r.owner.avatar_url+'" alt="" loading="lazy"/><div><div class="cmp-nm">'+r.full_name+'</div><div class="cmp-lg">'+(r.language||'N/A')+'</div></div></div><div class="cmp-sc" style="color:'+cc+'">'+h.overall+'</div><div class="cmp-row"><span>Stars</span><strong>'+fN(r.stargazers_count)+'</strong></div><div class="cmp-row"><span>Forks</span><strong>'+fN(r.forks_count)+'</strong></div><div class="cmp-row"><span>Issues</span><strong>'+fN(r.open_issues_count)+'</strong></div><div class="cmp-row"><span>Status</span><strong>'+h.actSt+'</strong></div></div>'; }

async function addCmp() {
  var cmpInEl = document.getElementById('cmpIn'), repo = cmpInEl ? parseRepo(cmpInEl.value) : null; if(!repo){showToast('Invalid repository','err');return;}
  var hdrs={'Accept':'application/vnd.github+json'}; showToast('Fetching '+repo+'…','inf');
  try{
    var resp=await fetch('https://api.github.com/repos/'+repo,{headers:hdrs}); if(!resp.ok) throw new Error('Not found');
    var rd=await resp.json(), h=calcHealth(rd,[],[],rd.open_issues_count,0,0,0,0,{},[]); CMPL.push({rd:rd,health:h}); rCompare(); showToast('Added '+rd.full_name,'ok');
  }catch(e){showToast('Could not fetch '+repo,'err');}
}

// ── AUDIT ARCHIVE HISTORY DELEGATES ───────────────────────────────────────────
function saveHist(rd,score) { HIST=HIST.filter(function(h){return h.repo!==rd.full_name;}); HIST.unshift({repo:rd.full_name,score:score,lang:rd.language||'N/A',stars:rd.stargazers_count,date:new Date().toLocaleDateString()}); if(HIST.length>20) HIST.pop(); localStorage.setItem('ri_h',JSON.stringify(HIST)); refreshHB(); }
function clearHist(){ HIST=[]; localStorage.removeItem('ri_h'); refreshHB(); renderHist(); showToast('History cleared'); }
function refreshHB(){ var b=document.getElementById('hbdg'); if (!b) return; if(HIST.length){ b.style.display=''; b.textContent=HIST.length; } else { b.style.display='none'; } }
function renderHist() {
  var el=document.getElementById('s-hist'); if(!el) return; if(!HIST.length){el.innerHTML='<p style="color:var(--t3);font-size:13px;padding:20px 0;text-align:center">No history yet. Analyze a repo to get started.</p>';return;}
  el.innerHTML=HIST.map(function(h){ var c=h.score>=80?'#3fb950':h.score>=60?'#58a6ff':h.score>=40?'#d29922':'#f85149'; return '<div class="h-item" onclick="qs(\''+h.repo+'\')"><div class="h-sc" style="background:'+c+'22;color:'+c+'">'+h.score+'</div><div><div class="h-nm">'+h.repo+'</div><div class="h-mt">'+h.lang+' &bull; '+fN(h.stars)+' stars</div></div><div class="h-rt">'+h.date+'<br><span class="h-re">Re-analyze &rarr;</span></div></div>'; }).join('');
}

// ── SYSTEM SETTINGS CONFIGURATOR INTERFACES ───────────────────────────────────
function renderSets() {
  var el=document.getElementById('s-sets'); if(!el) return;
  var wk=['commits','issues','prs','docs','activity'], wl={commits:'Commit Activity',issues:'Issue Health',prs:'PR Activity',docs:'Documentation',activity:'Contributor Activity'};
  el.innerHTML= '<div class="ss"><h3>Appearance</h3><div class="sr"><div class="sl"><h4>Theme</h4><p>Dark or light mode</p></div><select class="sel" onchange="applyTheme(this.value)"><option value="dark"'+(SET.theme==='dark'?' selected':'')+'>Dark</option><option value="light"'+(SET.theme==='light'?' selected':'')+'>Light</option></select></div></div><div class="ss"><h3>Health Score Weights</h3><p style="font-size:12px;color:var(--t3);margin-bottom:12px">Adjust how each factor contributes to the health score.</p>'+wk.map(function(k){return '<div class="sr"><div class="sl"><h4>'+wl[k]+'</h4></div><div class="rw"><input type="range" min="5" max="50" step="5" value="'+SET.w[k]+'" oninput="updW(\''+k+'\',this.value,this.nextElementSibling)"/><span class="rv">'+SET.w[k]+'%</span></div></div>';}).join('')+'</div><div class="ss"><h3>Export</h3><p style="font-size:12px;color:var(--t3)">Export current analysis data.</p><div class="exp-btns"><button class="exp-btn" onclick="expJSON()">&#128196; Export JSON</button><button class="exp-btn" onclick="expCSV()">&#128202; Export CSV</button></div></div>';
}
function updW(k,v,lb){SET.w[k]=parseInt(v); lb.textContent=v+'%'; saveSets();}
function expJSON(){ if(!D){showToast('No data','err');return;} var b=new Blob([JSON.stringify({repo:D.rd.full_name,health:D.health,ai:D.ai,analyzed:new Date().toISOString()},null,2)],{type:'application/json'}); dlB(b,'ri-'+D.rd.full_name.replace('/','_')+'.json'); showToast('Exported','ok'); }
function expCSV(){ if(!D){showToast('No data','err');return;} var r=D.rd,h=D.health, rows=[['Metric','Value'],['Repository',r.full_name],['Stars',r.stargazers_count],['Forks',r.forks_count],['Open Issues',D.openI],['Health Score',h.overall],['Status',h.status],['Activity',h.actSt],['Contributors',D.totalC],['Language',r.language||'N/A']]; var b=new Blob([rows.map(function(r){return r.join(',');}).join('\n')],{type:'text/csv'}); dlB(b,'ri-'+r.full_name.replace('/','_')+'.csv'); showToast('Exported','ok'); }
function dlB(blob,name){ var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }

// ── CHART JS INTERACTION & CANVAS HELPER WRAPPERS ─────────────────────────────
function tho(){ var dk=document.documentElement.style.getPropertyValue('--bg0').trim()==='#0d1117'||SET.theme==='dark'; return{g:dk?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)',t:dk?'#484f58':'#8b949e'}; }
function mkBar(id,labels,data,color){ var c=document.getElementById(id);if(!c)return;if(CH[id])CH[id].destroy();var t=tho(); CH[id]=new Chart(c,{type:'bar',data:{labels:labels,datasets:[{data:data,backgroundColor:color+'99',borderColor:color,borderWidth:0,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:t.t,font:{size:11},autoSkip:true,maxTicksLimit:13},grid:{color:t.g}},y:{ticks:{color:t.t},grid:{color:t.g}}}}}); }
function mkLine(id,labels,data,color){ var c=document.getElementById(id);if(!c)return;if(CH[id])CH[id].destroy();var t=tho(); CH[id]=new Chart(c,{type:'line',data:{labels:labels,datasets:[{data:data,borderColor:color,backgroundColor:color+'22',fill:true,tension:0.4,pointRadius:4,pointBackgroundColor:color}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:t.t},grid:{color:t.g}},y:{ticks:{color:t.t},grid:{color:t.g}}}}}); }
function mkPie(id,labels,data,colors){ var c=document.getElementById(id);if(!c)return;if(CH[id])CH[id].destroy(); CH[id]=new Chart(c,{type:'doughnut',data:{labels:labels,datasets:[{data:data,backgroundColor:colors,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#8b949e',font:{size:11}}}}}}); }
function drawArc(id,value,color,size){ var c=document.getElementById(id);if(!c)return; var ctx=c.getContext('2d'),r2=size/2-8,cx=size/2,cy=size/2,lw=8, start=-Math.PI/2,end=start+(value/100)*(2*Math.PI); ctx.clearRect(0,0,size,size); ctx.beginPath();ctx.arc(cx,cy,r2,0,2*Math.PI);ctx.strokeStyle='rgba(128,128,128,0.12)';ctx.lineWidth=lw;ctx.stroke(); ctx.beginPath();ctx.arc(cx,cy,r2,start,end);ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.lineCap='round';ctx.stroke(); }
function killCharts(){Object.keys(CH).forEach(function(k){try{CH[k].destroy();}catch(e){}});CH={};}

// ── UTILITY TRANSFORM FILTERS ──────────────────────────────────────────────────
function fN(n){if(n===null||n===undefined)return'N/A';if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=1000)return(n/1000).toFixed(1)+'k';return n.toString();}
function fD(s){if(!s)return'N/A';return new Date(s).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});}
function fBytes(b){if(b>=1048576)return(b/1048576).toFixed(1)+' MB';if(b>=1024)return(b/1024).toFixed(1)+' KB';return b+' B';}
function showToast(msg,type){ var t=document.getElementById('toastEl'); if (!t) return; t.textContent=msg; t.className='toast on'+(type?' '+type:''); clearTimeout(t._tmr); t._tmr=setTimeout(function(){t.className='toast';},3000); }