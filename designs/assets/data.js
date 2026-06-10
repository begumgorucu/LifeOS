/* LifeOS — shared sample data (consistent across pages) */
window.LifeData = {
  user:{name:'Begüm',full:'Begüm Yılmaz',level:4,levelName:'Kâşif',xp:2450,xpNext:3000,streak:7},
  // areas
  areas:[
    {id:'saglik',name:'Sağlık',icon:'🌿',desc:'Beden ve enerji',score:82,last:'2 saat önce',lastH:2,tasks:3,projects:2,visions:['Maraton koşmak']},
    {id:'kariyer',name:'Kariyer',icon:'💼',desc:'İş ve büyüme',score:64,last:'Dün',lastH:26,tasks:5,projects:3,visions:['İlk uygulamamı yayınlamak']},
    {id:'almanca',name:'Almanca',icon:'🗣️',desc:'B2 yolunda',score:24,last:'8 gün önce',lastH:192,tasks:2,projects:1,neglected:true,visions:['Avrupa\'da yaşamak','Almanca B2']},
    {id:'para',name:'Para',icon:'💰',desc:'Bütçe ve yatırım',score:71,last:'3 gün önce',lastH:72,tasks:1,projects:1,visions:['Finansal özgürlük']},
    {id:'iliskiler',name:'İlişkiler',icon:'❤️',desc:'Sevdiklerim',score:58,last:'4 gün önce',lastH:96,tasks:2,projects:0,visions:[]},
    {id:'muzik',name:'Müzik',icon:'🎵',desc:'Piyano pratiği',score:41,last:'6 gün önce',lastH:144,tasks:1,projects:1,visions:['Piyano öğrenmek']},
    {id:'kitap',name:'Kitap',icon:'📚',desc:'Yılda 24 kitap',score:77,last:'Bugün',lastH:5,tasks:2,projects:1,visions:[]},
    {id:'spor',name:'Spor',icon:'🏃',desc:'Güç ve dayanıklılık',score:35,last:'5 gün önce',lastH:120,tasks:2,projects:1,neglected:false,visions:['Maraton koşmak']},
  ],
  // daily pool suggestions
  pool:[
    {id:1,task:'30 dakika Almanca kelime tekrarı',area:'Almanca',icon:'🗣️',score:24,reason:'8 gündür ihmal ediliyor',pri:'high',mins:30},
    {id:2,task:'Sabah koşusu — 5km',area:'Sağlık',icon:'🌿',score:82,reason:'Streak\'ini sürdür',pri:'medium',mins:35},
    {id:3,task:'Uygulama landing sayfasını bitir',area:'Kariyer',icon:'💼',score:64,reason:'Bugün deadline',pri:'high',mins:90},
    {id:4,task:'Piyano — 20 dk pratik',area:'Müzik',icon:'🎵',score:41,reason:'Skor düşüyor',pri:'low',mins:20},
    {id:5,task:'Aylık bütçeyi gözden geçir',area:'Para',icon:'💰',score:71,reason:'Ayın ilk günü',pri:'medium',mins:25},
  ],
  // week activity (tasks completed per day, Mon-Sun)
  week:[4,6,3,8,5,7,2],
  weekTotal:35,weekDelta:20,
  // achievements
  achievements:[
    {name:'İlk 100 Görev',desc:'Bugün kazanıldı',icon:'★',unlocked:true},
    {name:'7 Günlük Streak',desc:'Bugün kazanıldı',icon:'🔥',unlocked:true},
    {name:'30 Günlük Streak',desc:'7/30 — devam et',icon:'🔒',unlocked:false,prog:23},
    {name:'Mükemmel Hafta',desc:'5/7 gün',icon:'🔒',unlocked:false,prog:71},
  ],
  // notifications
  notifs:[
    {type:'warn',icon:'flame',title:'Almanca alanını 8 gündür ihmal ediyorsun',time:'2 saat önce',area:'Almanca',unread:true},
    {type:'success',icon:'star',title:'7 günlük streak\'ini sürdürdün!',time:'Bugün 08:00',unread:true},
    {type:'remind',icon:'clock',title:'Bugün 5 görevin var, hadi başla',time:'Bugün 07:30',unread:true},
    {type:'dep',icon:'link',title:'"Wireframe" tamamlandı — "UI tasarımı" artık başlayabilir',time:'Dün 16:20',area:'Kariyer',unread:false},
    {type:'success',icon:'star',title:'İlk 100 görev rozetini kazandın',time:'Dün 14:00',unread:false},
    {type:'warn',icon:'flame',title:'Spor skorun kritik seviyeye yaklaşıyor (35)',time:'Dün 09:00',area:'Spor',unread:false},
  ],
  projects:[
    {id:'p1',name:'Sabah koşusu rutini',area:'Sağlık',icon:'🌿',status:'active',done:4,total:6,deadline:'15 Haz'},
    {id:'p2',name:'LifeOS v1 yayını',area:'Kariyer',icon:'💼',status:'active',done:7,total:12,deadline:'30 Haz'},
    {id:'p3',name:'B1 sınavına hazırlık',area:'Almanca',icon:'🗣️',status:'active',done:2,total:8,deadline:'12 Tem'},
    {id:'p4',name:'Aylık bütçe sistemi',area:'Para',icon:'💰',status:'active',done:3,total:4,deadline:null},
    {id:'p5',name:'Piyano — Für Elise',area:'Müzik',icon:'🎵',status:'active',done:1,total:5,deadline:null},
    {id:'p6',name:'2024 okuma listesi',area:'Kitap',icon:'📚',status:'completed',done:24,total:24,deadline:null},
    {id:'p7',name:'Yatırım araştırması',area:'Para',icon:'💰',status:'archived',done:2,total:6,deadline:null},
  ],
};
