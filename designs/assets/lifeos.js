/* ===========================================================
   LifeOS — Shared JS helpers
   Icons · health rings · app shell · state switcher
   =========================================================== */
window.LifeOS = (function(){

  // ---- Icon set (lucide-style, 24x24 stroke) ----
  const I = {
    dashboard:'<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
    areas:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18M3 12h18"/>',
    projects:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/>',
    tasks:'<path d="M4 6h16M4 12h16M4 18h10"/><path d="M19 16l1.5 1.5L23 15" transform="translate(-4 1)"/>',
    pool:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    vision:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    stats:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    check:'<path d="M20 6L9 17l-5-5"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    flame:'<path d="M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 13 11 13c0-2 1-3 1-5 0-2-1-4-1-6z"/>',
    star:'<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    wifi:'<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><circle cx="12" cy="20" r="1"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
    edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    more:'<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    chevron:'<path d="M9 6l6 6-6 6"/>',
    chevrond:'<path d="M6 9l6 6 6-6"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>',
    sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    play:'<path d="M6 4l14 8-14 8z"/>',
    x:'<path d="M18 6L6 18M6 6l12 12"/>',
    skip:'<path d="M5 4l10 8-10 8zM19 5v14"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
    download:'<path d="M12 3v12M7 11l5 5 5-5M5 21h14"/>',
    upload:'<path d="M12 21V9M7 13l5-5 5 5M5 3h14"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
    bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    filter:'<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
  };
  function icon(name,cls){return `<svg viewBox="0 0 24 24" width="18" height="18" class="${cls||''}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${I[name]||''}</svg>`;}

  // ---- Health helpers ----
  function healthColor(s){
    if(s>=70)return{c:'#2E9E6B',s:'#E6F4ED',d:'#1f6e49',label:'Mükemmel',cls:'exc'};
    if(s>=50)return{c:'#C79221',s:'#F8F0DC',d:'#8a6512',label:'İyi',cls:'good'};
    if(s>=30)return{c:'#DC7E33',s:'#FBEDDF',d:'#9c5418',label:'Uyarı',cls:'warn'};
    return{c:'#D2524A',s:'#FBE7E5',d:'#9c352f',label:'Kritik',cls:'crit'};
  }
  // ring(score, size, strokeWidth, showLabel)
  function ring(score,size=72,sw=6,opts={}){
    const h=healthColor(score);const r=(size-sw)/2;const C=2*Math.PI*r;
    const off=C*(1-score/100);
    const fs=opts.fontSize||Math.round(size*0.3);
    const sub=opts.sub!==false;
    return `<div class="ring" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${h.s}" stroke-width="${sw}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${h.c}" stroke-width="${sw}"
          stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"
          transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)"/>
      </svg>
      <div class="rv"><b class="tnum" style="font-size:${fs}px;font-weight:600;letter-spacing:-.02em;color:${h.c};line-height:1">${score}</b>
      ${sub?`<span style="font-size:${Math.round(size*0.11)}px;font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);margin-top:2px">${opts.subLabel||'Skor'}</span>`:''}</div>
    </div>`;
  }

  // ---- App shell ----
  const NAV=[
    {id:'dashboard',label:'Dashboard',icon:'dashboard',href:'01-onboarding.html'},
    {id:'areas',label:'Areas',icon:'areas',count:'8'},
    {id:'projects',label:'Projects',icon:'projects',count:'12'},
    {id:'tasks',label:'Tasks',icon:'tasks',count:'24'},
    {id:'pool',label:'Daily Pool',icon:'pool'},
    {id:'vision',label:'Vision Board',icon:'vision'},
    {id:'stats',label:'Stats',icon:'stats'},
  ];
  const ROUTES={dashboard:'02-dashboard.html',areas:'03-areas.html',projects:'05-projects.html',
    tasks:'06-tasks.html',pool:'07-daily-pool.html',vision:'08-vision-board.html',stats:'09-stats.html',
    settings:'10-settings.html'};

  function sidebar(active){
    const items=NAV.map(n=>{
      const href=ROUTES[n.id]||'#';
      const meta=n.count?`<span class="count">${n.count}</span>`:'';
      return `<a class="nav-item ${n.id===active?'active':''}" href="${href}">
        <span class="ic">${icon(n.icon)}</span><span>${n.label}</span>${meta}</a>`;
    }).join('');
    return `<aside class="sidebar">
      <div class="sb-brand"><div class="sb-logo">L</div><div class="sb-name">Life<span>OS</span></div></div>
      <nav class="sb-nav">
        <div class="sb-sec">Çalışma alanı</div>
        ${items}
        <div class="sb-sec">Hesap</div>
        <a class="nav-item ${active==='settings'?'active':''}" href="${ROUTES.settings}"><span class="ic">${icon('settings')}</span><span>Settings</span></a>
      </nav>
      <div class="sb-foot">
        <div class="sb-streak"><span class="fl">🔥</span><span class="st"><b>7 gün</b> streak · seviye 4</span></div>
        <div class="sb-prof"><div class="avatar">B</div><div class="col"><span class="pn">Begüm Yılmaz</span><span class="pe">Kâşif · 2.450 XP</span></div></div>
      </div>
    </aside>`;
  }
  function topbar(title,crumb,notif){
    return `<header class="topbar">
      <div class="tb-title">${crumb?`<span class="crumb">${crumb} / </span>`:''}${title}</div>
      <div class="tb-spacer"></div>
      <div class="tb-search" onclick="LifeOS.cmdk&&LifeOS.cmdk()">${icon('search')}<span>Ara veya ekle…</span><span class="kbd">⌘K</span></div>
      <button class="tb-add">${icon('plus')}<span>Hızlı ekle</span></button>
      <button class="tb-icon" title="Bildirimler">${icon('bell')}<span class="dot">3</span></button>
    </header>`;
  }
  // mount(active, title, crumb) -> injects shell, returns content element
  function shell(opts){
    const {active,title,crumb}=opts;
    const app=document.querySelector('.app');
    app.insertAdjacentHTML('afterbegin',sidebar(active));
    const main=document.createElement('div');main.className='main';
    main.innerHTML=topbar(title,crumb);
    const content=document.createElement('div');content.className='content';
    main.appendChild(content);
    app.appendChild(main);
    return content;
  }

  // ---- State switcher ----
  function stateSwitch(states){
    // states: [{id,label}]
    const host=document.createElement('div');host.className='state-switch';
    host.innerHTML=`<span class="lbl">Durum</span>`+states.map((s,i)=>
      `<button data-st="${s.id}" class="${i===0?'on':''}"><span class="d"></span>${s.label}</button>`).join('');
    document.body.appendChild(host);
    function go(id){
      document.querySelectorAll('.state').forEach(el=>el.classList.toggle('show',el.dataset.st===id));
      host.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.st===id));
    }
    host.querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.st));
    go(states[0].id);
  }

  return {icon,ring,healthColor,sidebar,topbar,shell,stateSwitch,NAV,ROUTES};
})();

/* ===========================================================
   Global overlays: ⌘K command palette · ? shortcuts · achievement pop
   =========================================================== */
(function(){
  function icon(n){return LifeOS.icon(n);}
  const CMDS=[
    {sec:'Eylemler',items:[
      {ic:'plus',l:'Yeni görev ekle',k:'N',create:'task'},
      {ic:'areas',l:'Yeni alan oluştur',k:'A',create:'area'},
      {ic:'vision',l:'Yeni hayal ekle',create:'dream'},
      {ic:'pool',l:'Günü başlat',k:'S',href:'07-daily-pool.html'},
    ]},
    {sec:'Git',items:[
      {ic:'dashboard',l:'Dashboard',k:'G D',href:'02-dashboard.html'},
      {ic:'areas',l:'Areas',k:'G A',href:'03-areas.html'},
      {ic:'projects',l:'Projects',k:'G P',href:'05-projects.html'},
      {ic:'tasks',l:'Tasks',k:'G T',href:'06-tasks.html'},
      {ic:'vision',l:'Vision Board',k:'G V',href:'08-vision-board.html'},
      {ic:'stats',l:'İstatistikler',k:'G S',href:'09-stats.html'},
      {ic:'settings',l:'Ayarlar',href:'10-settings.html'},
    ]},
  ];
  let cmdkEl,scEl,selIdx=0,flat=[];
  function buildCmdk(){
    cmdkEl=document.createElement('div');cmdkEl.className='cmdk-bg';
    cmdkEl.innerHTML='<div class="cmdk"><div class="cmdk-input">'+icon('search')+'<input placeholder="Komut ara veya yaz…" id="cmdkInput"><span class="esc">esc</span></div><div class="cmdk-list" id="cmdkList"></div></div>';
    document.body.appendChild(cmdkEl);
    cmdkEl.addEventListener('click',e=>{if(e.target===cmdkEl)closeCmdk();});
    cmdkEl.querySelector('#cmdkInput').addEventListener('input',e=>renderCmdk(e.target.value));
  }
  function renderCmdk(q){
    q=(q||'').toLowerCase();flat=[];let html='';
    CMDS.forEach(g=>{
      const items=g.items.filter(it=>it.l.toLowerCase().includes(q));
      if(!items.length)return;
      html+='<div class="cmdk-sec">'+g.sec+'</div>';
      items.forEach(it=>{const i=flat.length;flat.push(it);
        html+='<div class="cmdk-item '+(i===0?'sel':'')+'" data-i="'+i+'"><div class="ci">'+icon(it.ic)+'</div><div class="cl">'+it.l+'</div>'+(it.k?'<span class="ck">'+it.k+'</span>':'')+'</div>';});
    });
    if(!flat.length)html='<div style="padding:24px;text-align:center;color:var(--ink-4);font-size:14px">Sonuç yok</div>';
    const list=cmdkEl.querySelector('#cmdkList');list.innerHTML=html;selIdx=0;
    list.querySelectorAll('.cmdk-item').forEach(el=>{
      el.onmouseenter=()=>setSel(+el.dataset.i);
      el.onclick=()=>runCmd(+el.dataset.i);});
  }
  function setSel(i){selIdx=i;cmdkEl.querySelectorAll('.cmdk-item').forEach(el=>el.classList.toggle('sel',+el.dataset.i===i));}
  function runCmd(i){const it=flat[i];if(!it)return;closeCmdk();if(it.href)location.href=it.href;else if(it.create)LifeOS.create(it.create);else LifeOS.toast(it.l);}
  function openCmdk(){if(!cmdkEl)buildCmdk();cmdkEl.classList.add('show');const inp=cmdkEl.querySelector('#cmdkInput');inp.value='';renderCmdk('');setTimeout(()=>inp.focus(),30);}
  function closeCmdk(){cmdkEl&&cmdkEl.classList.remove('show');}

  function buildSc(){
    const rows=[
      ['Komut paleti','⌘ K'],['Yeni görev','N'],['Yeni alan','A'],['Günü başlat','S'],
      ['Dashboard\'a git','G D'],['Areas\'a git','G A'],['Tasks\'a git','G T'],['Vision Board','G V'],
      ['Bildirimleri aç','B'],['Bu yardım','?'],['Ara','/'],['Kapat','esc'],
    ];
    scEl=document.createElement('div');scEl.className='sc-bg';
    scEl.innerHTML='<div class="sc-modal"><div class="sc-head"><h2>Klavye kısayolları</h2><button class="np-close" onclick="LifeOS.shortcuts(false)">'+icon('x')+'</button></div><div class="sc-body">'+rows.map(r=>'<div class="sc-row"><span class="d">'+r[0]+'</span><span class="keys">'+r[1].split(' ').map(k=>'<kbd>'+k+'</kbd>').join('')+'</span></div>').join('')+'</div></div>';
    document.body.appendChild(scEl);
    scEl.addEventListener('click',e=>{if(e.target===scEl)shortcuts(false);});
  }
  function shortcuts(show){if(!scEl)buildSc();scEl.classList.toggle('show',show!==false);}

  function achievement(name,desc,emoji){
    const p=document.createElement('div');p.className='ach-pop';
    p.innerHTML='<div class="am">'+(emoji||'★')+'</div><div><div class="at">Rozet kazanıldı</div><div class="an">'+name+'</div><div class="ad">'+(desc||'')+'</div></div>';
    document.body.appendChild(p);requestAnimationFrame(()=>p.classList.add('show'));
    setTimeout(()=>{p.classList.remove('show');setTimeout(()=>p.remove(),600);},4200);
  }

  LifeOS.toast=function(msg){let t=document.getElementById('__toast');if(!t){t=document.createElement('div');t.id='__toast';t.className='toast';document.body.appendChild(t);}
    t.innerHTML=icon('check')+' '+msg;t.style.display='flex';clearTimeout(t._t);t._t=setTimeout(()=>t.style.display='none',1800);};

  document.addEventListener('keydown',e=>{
    const typing=/INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCmdk();return;}
    if(e.key==='Escape'){closeCmdk();shortcuts(false);}
    if(cmdkEl&&cmdkEl.classList.contains('show')){
      if(e.key==='ArrowDown'){e.preventDefault();setSel(Math.min(selIdx+1,flat.length-1));}
      if(e.key==='ArrowUp'){e.preventDefault();setSel(Math.max(selIdx-1,0));}
      if(e.key==='Enter'){e.preventDefault();runCmd(selIdx);}
      return;
    }
    if(typing)return;
    if(e.key==='?'){e.preventDefault();shortcuts(true);}
    if(e.key==='/'){e.preventDefault();openCmdk();}
  });

  // ---- Create modal (Yeni …) ----
  const KIND={
    task:{label:'görev',ic:'tasks',fields:['name','area','priority']},
    area:{label:'alan',ic:'areas',fields:['name','emoji']},
    project:{label:'proje',ic:'projects',fields:['name','area']},
    dream:{label:'hayal',ic:'vision',fields:['name','emoji']},
  };
  const EMOJIS=['🌿','💼','🗣️','💰','❤️','🎵','📚','🏃','✨','🎯','🌍','🚀','🎨','🧠'];
  let cmEl;
  function areaOptions(){
    const list=(window.LifeData&&LifeData.areas)?LifeData.areas.map(a=>a.name):['Sağlık','Kariyer','Para','Almanca','Müzik','Kitap'];
    return list.map(n=>`<option>${n}</option>`).join('');
  }
  function buildCm(){cmEl=document.createElement('div');cmEl.className='cm-bg';document.body.appendChild(cmEl);
    cmEl.addEventListener('click',e=>{if(e.target===cmEl)closeCreate();});}
  function create(kind){
    if(!cmEl)buildCm();
    const k=KIND[kind]||KIND.task;
    let fields='';
    if(k.fields.includes('name'))fields+=`<div class="cm-field"><label>İsim</label><input id="cmName" placeholder="${kind==='dream'?'Örn. Avrupa\'da yaşamak':kind==='area'?'Örn. Sağlık':'Adı…'}" autocomplete="off"></div>`;
    if(k.fields.includes('emoji'))fields+=`<div class="cm-field"><label>İkon</label><div class="cm-emojis" id="cmEmoji">${EMOJIS.map((e,i)=>`<button type="button" class="${i===0?'on':''}" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${e}</button>`).join('')}</div></div>`;
    if(k.fields.includes('area'))fields+=`<div class="cm-field"><label>Alan</label><select id="cmArea">${areaOptions()}</select></div>`;
    if(k.fields.includes('priority'))fields+=`<div class="cm-field"><label>Öncelik</label><div class="cm-pri" id="cmPri">
      <button type="button" data-p="low" onclick="LifeOS._pri(this)"><span class="pd" style="background:var(--ink-4)"></span>Düşük</button>
      <button type="button" class="on" data-p="medium" onclick="LifeOS._pri(this)"><span class="pd" style="background:var(--h-good)"></span>Orta</button>
      <button type="button" data-p="high" onclick="LifeOS._pri(this)"><span class="pd" style="background:var(--h-crit)"></span>Yüksek</button></div></div>`;
    cmEl.innerHTML=`<div class="cm"><div class="cm-head"><div class="ci">${icon(k.ic)}</div><h3>Yeni ${k.label}</h3></div>
      <div class="cm-body">${fields}
        <div class="cm-foot"><button class="btn gho" onclick="LifeOS.closeCreate()">İptal</button>
          <button class="btn pri" onclick="LifeOS._submit('${kind}','${k.label}')">Oluştur</button></div>
      </div></div>`;
    cmEl.classList.add('show');setTimeout(()=>{const n=document.getElementById('cmName');n&&n.focus();},30);
  }
  function closeCreate(){cmEl&&cmEl.classList.remove('show');}
  LifeOS._pri=b=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');};
  LifeOS._submit=(kind,label)=>{const n=document.getElementById('cmName');const name=n?n.value.trim():'';
    if(n&&!name){n.focus();n.style.borderColor='var(--h-crit)';return;}
    closeCreate();LifeOS.toast(`"${name||'Yeni '+label}" oluşturuldu`);};
  LifeOS.create=create;LifeOS.closeCreate=closeCreate;

  // ---- Quick-add menu (tb-add) ----
  let qaEl;
  function quickAdd(ev){
    if(!qaEl){qaEl=document.createElement('div');qaEl.className='qa-menu';document.body.appendChild(qaEl);
      qaEl.innerHTML=[['task','tasks','Yeni görev','N'],['area','areas','Yeni alan','A'],['project','projects','Yeni proje',''],['dream','vision','Yeni hayal','']]
        .map(m=>`<button onclick="LifeOS.create('${m[0]}');LifeOS._qaClose()"><span class="qi">${icon(m[1])}</span>${m[2]}<span class="qk">${m[3]}</span></button>`).join('')
        +`<button onclick="LifeOS.cmdk();LifeOS._qaClose()"><span class="qi">${icon('search')}</span>Komut paleti<span class="qk">⌘K</span></button>`;
      document.addEventListener('click',e=>{if(qaEl.classList.contains('show')&&!qaEl.contains(e.target)&&!e.target.closest('.tb-add'))qaClose();});
    }
    const btn=ev&&ev.currentTarget?ev.currentTarget:document.querySelector('.tb-add');
    if(btn){const r=btn.getBoundingClientRect();qaEl.style.top=(r.bottom+8)+'px';qaEl.style.left=Math.max(12,r.right-200)+'px';}
    qaEl.classList.toggle('show');
  }
  function qaClose(){qaEl&&qaEl.classList.remove('show');}
  LifeOS.quickAdd=quickAdd;LifeOS._qaClose=qaClose;

  // ---- Global wiring: page "Yeni X" buttons + tb-add ----
  const ID2KIND={newAreaBtn:'area',newProjBtn:'project',newTaskBtn:'task',newDreamBtn:'dream',
    coverAdd:'dream',addProjBtn:'project',recoverBtn:'task'};
  document.addEventListener('click',e=>{
    const tb=e.target.closest('.tb-add');if(tb){e.preventDefault();quickAdd({currentTarget:tb});return;}
    const b=e.target.closest('button,a');if(!b)return;
    if(b.dataset&&b.dataset.create){e.preventDefault();create(b.dataset.create);return;}
    if(b.id&&ID2KIND[b.id]){e.preventDefault();create(ID2KIND[b.id]);}
  },true);

  // create shortcuts
  document.addEventListener('keydown',e=>{
    if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
    if(cmEl&&cmEl.classList.contains('show'))return;
    if(e.key==='n'||e.key==='N'){e.preventDefault();create('task');}
    if(e.key==='a'||e.key==='A'){e.preventDefault();create('area');}
  });

  LifeOS.cmdk=openCmdk;
  LifeOS.shortcuts=shortcuts;
  LifeOS.achievement=achievement;
})();
