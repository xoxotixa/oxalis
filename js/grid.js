/* =====================================================================
   Oxalis — fond en grille lumineuse (toutes les pages)
   Réglages : variables --grid-* en haut de css/site.css.
   ===================================================================== */
(function(){
  // Une grille fine derrière tout le site. Les cases s'allument en vert là où passe la souris
  // et s'éteignent un instant plus tard ; quelques cases s'allument seules pour que la grille vive
  // aussi sur mobile. Décor uniquement : invisible pour les lecteurs d'écran, ne capte pas la souris,
  // un seul canvas qui dort dès qu'aucune case n'est allumée, et immobile si l'utilisateur demande
  // de réduire les animations. Aucun cookie, aucun stockage.
  var box=document.querySelector('.ox-grid'); if(!box) return;
  var cv=box.querySelector('canvas'); var ctx=cv&&cv.getContext&&cv.getContext('2d'); if(!ctx) return;
  var mm=function(q){try{return window.matchMedia(q);}catch(e){return {matches:false};}};
  var reduce=mm('(prefers-reduced-motion: reduce)'), fine=mm('(hover: hover) and (pointer: fine)');

  var FAINT=0.12;      // intensité d'une case juste derrière une ligne de texte
  var FADE=2.2;        // nombre de cases pour retrouver toute son intensité en s'éloignant du texte
  var PAD=6;           // marge gardée autour de chaque ligne de texte, en pixels
  var FADE_IN=180, FADE_OUT=900, MAX_LIT=180;
  // Textes posés directement sur le fond : la lumière s'efface derrière eux pour qu'ils restent lisibles.
  // Les textes dans les cartes, les en-têtes ou la maquette sont déjà sur un fond opaque.
  var AVOID='h1,h2,h3,p,li,dt,dd,label,.label,.lead,[data-grid-avoid]';
  var SKIP='.ox-card,.ox-faq__item,.plan,.band,.form-card,.emb,.mk,.hd,.mm,.ml-panneau,.sticky-cta,.ox-input,.globe-wrap,.viz';

  var cfg={}, cols=1, rows=1, W=0, H=0, cells={}, count=0;
  function readCfg(){
    var cs=getComputedStyle(document.documentElement);
    var g=function(n,d){var v=cs.getPropertyValue(n).trim();return v||d;};
    cfg.cell=parseFloat(g('--grid-cell','32'))||32;
    cfg.fill=parseFloat(g('--grid-fill','.2'));
    cfg.edge=parseFloat(g('--grid-edge','.42'));
    cfg.reach=parseFloat(g('--grid-reach','2.6'))||2.6;
    cfg.trail=parseFloat(g('--grid-trail','1'));
    cfg.rReach=parseFloat(g('--grid-ripple-reach','13'))||13;
    cfg.rSpeed=parseFloat(g('--grid-ripple-speed','42'))||42;
    cfg.rScale=parseFloat(g('--grid-ripple-scale','1.1'))||1.1;
    cfg.ambient=Math.round(parseFloat(g('--grid-ambient','2')));
    cfg.greens=g('--grid-greens','#2fb872,#45c584,#5fd096,#7ddaa9,#9be4bd').split(',').map(function(c){return c.trim();});
  }
  function size(){
    W=window.innerWidth; H=window.innerHeight;
    cols=Math.max(1,Math.ceil(W/cfg.cell)); rows=Math.max(1,Math.ceil(H/cfg.cell));
    var dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stamp=0; wake();
  }

  // Lignes de texte visibles à l'écran, mesurées à la demande (après un défilement, ou au plus
  // toutes les 250 ms), pas les blocs qui les contiennent : la dernière ligne courte d'un paragraphe
  // ne garde pas une bande de cases éteintes là où il n'y a rien à lire.
  var clear=[], stamp=0, sy=null;
  function measureText(now){
    stamp=now; sy=window.scrollY; clear=[];
    var nodes=document.querySelectorAll(AVOID), range=document.createRange();
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i], b=n.getBoundingClientRect();
      if(!b.width||!b.height||b.bottom<-PAD*4||b.top>H+PAD*4||b.right<0||b.left>W) continue;
      if(n.closest(SKIP)) continue;
      range.selectNodeContents(n);
      var rs=range.getClientRects(), any=false;
      for(var j=0;j<rs.length;j++){
        var r=rs[j]; if(!r.width||!r.height) continue; any=true;
        clear.push([r.left-PAD,r.top-PAD,r.right+PAD,r.bottom+PAD]);
      }
      if(!any) clear.push([b.left-PAD,b.top-PAD,b.right+PAD,b.bottom+PAD]);
    }
  }
  function brightness(col,row,now){
    if(now-stamp>250||window.scrollY!==sy) measureText(now);
    var x=col*cfg.cell+cfg.cell/2, y=row*cfg.cell+cfg.cell/2, near=Infinity;
    for(var i=0;i<clear.length;i++){
      var r=clear[i];
      var d=Math.hypot(Math.max(r[0]-x,0,x-r[2]),Math.max(r[1]-y,0,y-r[3]));
      if(d<near){near=d; if(!d) break;}
    }
    if(near===Infinity) return 1;
    return FAINT+(1-FAINT)*Math.min(1,near/(FADE*cfg.cell));
  }

  var easeOut=function(t){return 1-(1-t)*(1-t);}, easeIn=function(t){return t*t;};
  var frame=0;
  function draw(now){
    frame=0; ctx.clearRect(0,0,W,H);
    var c=cfg.cell, k, cl, a, t;
    for(k in cells){
      cl=cells[k];
      if(now<cl.until){ a=easeOut(Math.min(1,(now-cl.born)/FADE_IN)); }
      else { t=(now-cl.until)/FADE_OUT; if(t>=1){ delete cells[k]; count--; continue; } a=1-easeIn(t); }
      a*=cl.dim;
      ctx.fillStyle=ctx.strokeStyle=cl.colour;
      // Légèrement en retrait du trait de la grille, pour qu'elle reste visible entre deux cases allumées.
      ctx.globalAlpha=a*cfg.fill; ctx.fillRect(cl.col*c+1,cl.row*c+1,c-1,c-1);
      ctx.globalAlpha=a*cfg.edge; ctx.strokeRect(cl.col*c+1.5,cl.row*c+1.5,c-2,c-2);
    }
    drawRipples(now);
    ctx.globalAlpha=1;
    if(count>0||ripples.length) frame=requestAnimationFrame(draw);
  }
  function wake(){ if(!frame&&(count>0||ripples.length)) frame=requestAnimationFrame(draw); }

  // Onde au clic : elle part du point cliqué et s'étend en cercle (distance réelle, pas en losange).
  // Chaque case pulse en vert et grossit un peu au passage du front, puis l'onde s'atténue en s'éloignant.
  var ripples=[], PULSE=170;
  function ripple(e){
    if(ripples.length>=4) ripples.shift();
    ripples.push({x:e.clientX/cfg.cell,y:e.clientY/cfg.cell,t:performance.now()});
    wake();
  }
  function drawRipples(now){
    var c=cfg.cell, g=cfg.greens, sp=cfg.rSpeed, maxR=cfg.rReach;
    for(var i=ripples.length-1;i>=0;i--){
      var rp=ripples[i], el=now-rp.t;
      if(el>maxR*sp+PULSE){ ripples.splice(i,1); continue; }
      var hi=Math.min(maxR,el/sp), lo=Math.max(0,(el-PULSE)/sp);
      var r0=Math.max(0,Math.floor(rp.y-hi)), r1=Math.min(rows-1,Math.ceil(rp.y+hi));
      var c0=Math.max(0,Math.floor(rp.x-hi)), c1=Math.min(cols-1,Math.ceil(rp.x+hi));
      for(var row=r0;row<=r1;row++) for(var col=c0;col<=c1;col++){
        var d=Math.hypot(col+0.5-rp.x,row+0.5-rp.y);
        if(d<lo||d>hi) continue;
        var s=Math.sin(Math.PI*Math.min(1,(el-d*sp)/PULSE)), fade=Math.pow(1-d/maxR,1.3);
        var a=s*fade; if(a<0.02) continue;
        a*=brightness(col,row,now);
        var grow=(cfg.rScale-1)*s*c/2;
        ctx.fillStyle=ctx.strokeStyle=g[Math.min(g.length-1,Math.round((0.35+0.65*fade)*(g.length-1)))];
        ctx.globalAlpha=a*cfg.fill; ctx.fillRect(col*c+1-grow,row*c+1-grow,c-1+2*grow,c-1+2*grow);
        ctx.globalAlpha=a*cfg.edge; ctx.strokeRect(col*c+1.5-grow,row*c+1.5-grow,c-2+2*grow,c-2+2*grow);
      }
    }
  }

  // Allume une case. near (0 à 1) : 1 au plus près de la souris, où le vert est plus clair et plus franc.
  function light(cx,cy,hold,near){
    if(cx<0||cy<0||cx>=cols||cy>=rows||count>=MAX_LIT) return;
    var key=cx+','+cy, now=performance.now(), lit=cells[key];
    if(lit&&now<lit.until) return;
    var born=now;
    if(lit){ // une case rattrapée pendant qu'elle s'éteint repart d'où elle en était, sans clignoter
      var faded=1-easeIn(Math.min(1,(now-lit.until)/FADE_OUT));
      born=now-(1-Math.sqrt(1-faded))*FADE_IN;
    } else count++;
    var g=cfg.greens, idx=Math.round(near*(g.length-1)+(Math.random()-0.5)*1.6);
    idx=Math.max(0,Math.min(g.length-1,idx));
    cells[key]={col:cx,row:cy,colour:lit?lit.colour:g[idx],dim:brightness(cx,cy,now)*(0.55+0.45*near),born:born,until:now+hold};
    wake();
  }

  // La souris peint. Plus une case est loin, moins elle a de chances de s'allumer :
  // le bord de la traînée s'effrite au lieu de bouger d'un bloc.
  var pending=0, at=null;
  function paint(){
    pending=0; if(!at) return;
    var c=cfg.cell, R=cfg.reach, cx=Math.floor(at.x/c), cy=Math.floor(at.y/c), span=Math.ceil(R);
    for(var dy=-span;dy<=span;dy++) for(var dx=-span;dx<=span;dx++){
      var away=Math.hypot(dx,dy); if(away>R) continue;
      if(Math.random()>(1-away/(R+0.6))*cfg.trail) continue;
      light(cx+dx,cy+dy,260+Math.random()*900,1-away/R);
    }
  }
  function onMove(e){
    if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen') return;
    at={x:e.clientX,y:e.clientY};
    if(!pending) pending=requestAnimationFrame(paint);
  }
  // Sur téléphone et tablette, les pixels suivent le doigt quand il glisse sur l'écran.
  function onTouch(e){
    var t=e.touches&&e.touches[0]; if(!t) return;
    at={x:t.clientX,y:t.clientY};
    if(!pending) pending=requestAnimationFrame(paint);
  }

  // Quelques cases s'allument seules, plus discrètes : la grille vit dès l'arrivée, même sans souris.
  var beat=0;
  function drift(){
    beat=setTimeout(drift,1400+Math.random()*1800);
    if(document.hidden) return;
    for(var i=0;i<cfg.ambient;i++) light(Math.floor(Math.random()*cols),Math.floor(Math.random()*rows),900+Math.random()*1600,0.35+Math.random()*0.35);
  }

  var on=false;
  function start(){
    if(on||reduce.matches) return; on=true;
    readCfg(); size();
    if(fine.matches) window.addEventListener('pointermove',onMove,{passive:true});
    window.addEventListener('click',ripple,{passive:true});
    window.addEventListener('touchstart',onTouch,{passive:true});
    window.addEventListener('touchmove',onTouch,{passive:true});
    beat=setTimeout(drift,1200);
  }
  function stop(){
    on=false; clearTimeout(beat); cancelAnimationFrame(frame); cancelAnimationFrame(pending);
    frame=pending=0; cells={}; count=0; ripples=[]; ctx.clearRect(0,0,W,H);
    window.removeEventListener('pointermove',onMove);
    window.removeEventListener('click',ripple);
    window.removeEventListener('touchstart',onTouch);
    window.removeEventListener('touchmove',onTouch);
  }
  window.addEventListener('resize',function(){ if(on) size(); });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){stamp=0;}).catch(function(){});
  if(reduce.addEventListener) reduce.addEventListener('change',function(){ if(reduce.matches) stop(); else start(); });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
