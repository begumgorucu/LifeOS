/* LifeOS Vision Board — atmospheric silhouette scenes (placeholder "photography") */
window.VisionArt = (function(){
  function svg(vb,inner){return `<svg class="sil" viewBox="${vb}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block">${inner}</svg>`;}

  const scenes={
    // city skyline at dusk
    city(){return svg('0 0 400 170',`
      <circle cx="318" cy="40" r="17" fill="rgba(255,255,255,.5)"/>
      <g fill="rgba(10,18,34,.32)">
        <rect x="0" y="96" width="42" height="74"/><rect x="48" y="78" width="34" height="92"/>
        <rect x="300" y="86" width="38" height="84"/><rect x="345" y="70" width="30" height="100"/><rect x="380" y="100" width="20" height="70"/></g>
      <g fill="rgba(8,14,28,.62)">
        <rect x="86" y="60" width="40" height="110"/><rect x="130" y="92" width="30" height="78"/>
        <rect x="164" y="44" width="34" height="126"/><rect x="202" y="80" width="40" height="90"/>
        <rect x="246" y="58" width="30" height="112"/><rect x="280" y="100" width="22" height="70"/></g>
      <g fill="rgba(255,236,180,.85)">
        <rect x="96" y="74" width="5" height="6"/><rect x="108" y="92" width="5" height="6"/><rect x="174" y="60" width="5" height="6"/>
        <rect x="182" y="84" width="5" height="6"/><rect x="214" y="96" width="5" height="6"/><rect x="256" y="74" width="5" height="6"/>
        <rect x="256" y="100" width="5" height="6"/><rect x="357" y="86" width="5" height="6"/></g>`);},

    // layered mountains + sun
    mountains(){return svg('0 0 400 180',`
      <circle cx="280" cy="58" r="30" fill="rgba(255,224,180,.55)"/>
      <path d="M0 150 L70 96 L120 132 L180 78 L240 128 L300 90 L360 134 L400 110 L400 180 L0 180Z" fill="rgba(20,18,40,.28)"/>
      <path d="M0 180 L60 120 L120 162 L175 112 L230 158 L300 118 L360 160 L400 140 L400 180Z" fill="rgba(14,12,30,.5)"/>
      <path d="M0 180 L90 150 L150 176 L220 146 L290 174 L360 150 L400 168 L400 180Z" fill="rgba(8,8,20,.68)"/>`);},

    // sun over sea
    sun(){return svg('0 0 400 160',`
      <circle cx="200" cy="92" r="46" fill="rgba(255,240,200,.6)"/>
      <circle cx="200" cy="92" r="30" fill="rgba(255,248,220,.8)"/>
      <rect x="0" y="118" width="400" height="42" fill="rgba(10,20,30,.42)"/>
      <g stroke="rgba(255,240,200,.55)" stroke-width="3"><line x1="186" y1="128" x2="214" y2="128"/><line x1="178" y1="138" x2="222" y2="138"/><line x1="170" y1="150" x2="230" y2="150"/></g>`);},

    // calm waves
    waves(){return svg('0 0 400 140',`
      <path d="M0 70 Q50 50 100 70 T200 70 T300 70 T400 70 L400 140 L0 140Z" fill="rgba(255,255,255,.14)"/>
      <path d="M0 92 Q50 72 100 92 T200 92 T300 92 T400 92 L400 140 L0 140Z" fill="rgba(10,20,40,.3)"/>
      <path d="M0 114 Q50 96 100 114 T200 114 T300 114 T400 114 L400 140 L0 140Z" fill="rgba(8,14,30,.55)"/>`);},

    // perspective tech grid
    grid(){return svg('0 0 400 180',`
      <circle cx="200" cy="150" r="80" fill="rgba(120,255,240,.14)"/>
      <g stroke="rgba(180,255,245,.32)" stroke-width="1.5">
        <line x1="200" y1="80" x2="-40" y2="180"/><line x1="200" y1="80" x2="80" y2="180"/><line x1="200" y1="80" x2="200" y2="180"/>
        <line x1="200" y1="80" x2="320" y2="180"/><line x1="200" y1="80" x2="440" y2="180"/>
        <path d="M40 180 Q200 150 360 180" fill="none"/><path d="M90 150 Q200 128 310 150" fill="none"/><path d="M120 128 Q200 114 280 128" fill="none"/></g>`);},

    // growing plant
    plant(){return svg('0 0 400 170',`
      <rect x="0" y="150" width="400" height="20" fill="rgba(8,30,20,.5)"/>
      <path d="M200 150 C200 120 198 96 200 72" stroke="rgba(255,255,255,.45)" stroke-width="3" fill="none"/>
      <path d="M200 110 C176 104 160 86 158 66 C184 70 200 86 200 110Z" fill="rgba(255,255,255,.35)"/>
      <path d="M200 96 C224 90 242 72 244 52 C218 56 200 72 200 96Z" fill="rgba(255,255,255,.5)"/>
      <circle cx="200" cy="64" r="7" fill="rgba(255,236,180,.85)"/>`);},
  };

  return { scene(name){ return (scenes[name]||scenes.waves)(); } };
})();
