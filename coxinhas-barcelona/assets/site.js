(function(){
  /* ===== DATOS DEL LOCAL ===== */
  var WA='34600000000';
  /* CARTA: copiar tal cual la del local. Formato: [{cat, items:[{n, d, p}]}] */
  var MENU=[
    {cat:'Salgados',items:[
      {n:'Coxinha de frango com catupiry',d:'Massa de batata, frango desfiado e catupiry.',p:'2,50 €'},
      {n:'Coxinha de frango',d:'Massa de batata e frango desfiado.',p:'2,20 €'},
      {n:'Kibe',d:'Carne moída, trigo para kibe e hortelã.',p:'2,30 €'},
      {n:'Bolinha de queijo',d:'Massa de queijo, empanada e frita na hora.',p:'2,30 €'},
      {n:'Risoles de presunto e queijo',d:'Massa fina com recheio cremoso.',p:'2,30 €'},
      {n:'Pastel de carne',d:'Massa crocante, carne temperada.',p:'2,80 €'},
      {n:'Pastel de queijo',d:'Massa crocante com queijo derretido.',p:'2,50 €'}
    ]},
    {cat:'Pães e porções',items:[
      {n:'Pão de queijo',d:'Quentinho, por unidade.',p:'1,80 €'},
      {n:'Porção de pão de queijo',d:'6 unidades.',p:'9,00 €'}
    ]},
    {cat:'Doces',items:[
      {n:'Brigadeiro',d:'Chocolate e granulado.',p:'1,50 €'},
      {n:'Beijinho',d:'Coco e cravo.',p:'1,50 €'}
    ]},
    {cat:'Bebidas',items:[
      {n:'Guaraná lata 330 ml',d:'Antarctica.',p:'2,00 €'},
      {n:'Suco natural de maracujá',d:'Feito na hora, 400 ml.',p:'3,50 €'}
    ]}
  ];

  var wa=function(t){return 'https://wa.me/'+WA+(t?'?text='+encodeURIComponent(t):'')};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp=function(v,a,b){return v<a?a:v>b?b:v};
  var ss=function(a,b,v){var t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
  var mix=function(a,b,t){return a+(b-a)*t};
  var easeIO=function(t){return .5-.5*Math.cos(Math.PI*t)};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};

  var T={
    es:{navHome:'Inicio',navMenu:'Carta',navParty:'Encargos',navVisit:'Horario',navContact:'Contacto',navOrder:'Pedir',
      menuBtn:'Menú',closeLbl:'Cerrar',sound:'Sonido',
      lede:'Coxinhas y salgados brasileños en Barcelona.',hint:'Desliza para freírla',next:'Seguir',
      cap2:'Masa, pollo y pan rallado.',cap3:'Al aceite.',cap3b:'Hasta que quede dorada.',cap4:'Así, recién abierta.',
      oil:'Aceite',prevLbl:'Anterior',nextLbl:'Siguiente',
      tCarta:'La carta',tCartaD:'Salgados, pães, doces y bebidas',
      tParty:'Encargos para fiestas',tPartyD:'Bandejas para tu celebración',
      tVisit:'Horario',tVisitD:'Cuándo estamos abiertos',
      tContact:'Contacto',tContactD:'Dirección, teléfono y WhatsApp',
      tOrder:'Pedir',tOrderD:'Rellena el pedido y te contestamos',endH:'¿Se te ha antojado algo?',
      menuH:'La carta',menuP:'Desliza para ver cada vitrina.',emptyH:'Carta en preparación',emptyP:'Mientras tanto, pregunta por WhatsApp qué hay hoy.',
      nItems:function(n){return n+(n===1?' producto':' productos')},
      partyH:'Encargos para fiestas',partyP:'Dinos cuántas piezas quieres y lo concretamos por WhatsApp: sabores, día y precio.',
      sizesLabel:'Número de piezas',s50:'50',s100:'100',s150:'150',pieces:'piezas',sendParty:'Pedir este encargo por WhatsApp',
      plate:function(n){return 'Bandeja con '+n+' piezas'},
      msgParty:function(n){return '¡Hola! Quiero hacer un encargo de '+n+' piezas para una fiesta. ¿Qué sabores tenéis y para qué día lo podríais tener?'},
      visitH:'Horario',signOpen:'ABIERTO',signClosed:'CERRADO',
      open:function(c){return 'Abierto ahora, hasta las '+c+':00'},opensAt:function(o){return 'Hoy abrimos a las '+o+':00'},closedNow:'Ahora cerrado',
      hoursCap:'Horario',d0:'Domingo',d1:'Lunes',d2:'Martes',d3:'Miércoles',d4:'Jueves',d5:'Viernes',d6:'Sábado',closed:'Cerrado',
      contactH:'Contacto',addrL:'Dirección',phoneL:'Teléfono y WhatsApp',igL:'Instagram',igNote:'Escríbenos por mensaje directo',
      directions:'Cómo llegar',waBtn:'Escribir por WhatsApp',
      orderH:'Pide y pasa a recoger',orderP:'Rellena el pedido y te abrimos WhatsApp con el mensaje escrito. Te confirmamos la hora por allí.',
      fName:'Nombre',fDay:'Día de recogida',fDayPh:'sábado',fTime:'Hora',fMsg:'Tu pedido',
      sendPick:'Enviar pedido por WhatsApp',writeFirst:'Escribe tu pedido para enviarlo',
      msgPick:function(n,d,h,m){return '¡Hola! '+(n?'Soy '+n+'. ':'')+'Quiero pedir para recoger'+(d?' el '+d:'')+(h?' a las '+h:'')+': '+m},
      msgHi:'¡Hola! Quiero hacer un pedido.',webBy:'Web de'},
    pt:{navHome:'Início',navMenu:'Cardápio',navParty:'Encomendas',navVisit:'Horário',navContact:'Contato',navOrder:'Pedir',
      menuBtn:'Menu',closeLbl:'Fechar',sound:'Som',
      lede:'Coxinhas e salgados brasileiros em Barcelona.',hint:'Deslize para fritar',next:'Continuar',
      cap2:'Massa, frango e farinha de rosca.',cap3:'Pro óleo.',cap3b:'Até ficar douradinha.',cap4:'Assim, abertinha.',
      oil:'Óleo',prevLbl:'Anterior',nextLbl:'Próximo',
      tCarta:'O cardápio',tCartaD:'Salgados, pães, doces e bebidas',
      tParty:'Encomendas para festa',tPartyD:'Bandejas para a sua celebração',
      tVisit:'Horário',tVisitD:'Quando estamos abertos',
      tContact:'Contato',tContactD:'Endereço, telefone e WhatsApp',
      tOrder:'Pedir',tOrderD:'Preencha o pedido e a gente responde',endH:'Bateu vontade?',
      menuH:'O cardápio',menuP:'Deslize para ver cada vitrine.',emptyH:'Cardápio em preparação',emptyP:'Enquanto isso, pergunte pelo WhatsApp o que tem hoje.',
      nItems:function(n){return n+(n===1?' produto':' produtos')},
      partyH:'Encomendas para festa',partyP:'Diga quantos salgados você quer e a gente combina pelo WhatsApp: sabores, dia e preço.',
      sizesLabel:'Quantidade de salgados',s50:'Meio cento',s100:'Um cento',s150:'Cento e meio',pieces:'salgados',sendParty:'Encomendar pelo WhatsApp',
      plate:function(n){return 'Bandeja com '+n+' salgados'},
      msgParty:function(n){return 'Oi! Quero fazer uma encomenda de '+n+' salgados para uma festa. Quais sabores vocês têm e para que dia conseguem?'},
      visitH:'Horário',signOpen:'ABERTO',signClosed:'FECHADO',
      open:function(c){return 'Aberto agora, até às '+c+':00'},opensAt:function(o){return 'Hoje abrimos às '+o+':00'},closedNow:'Fechado agora',
      hoursCap:'Horário',d0:'Domingo',d1:'Segunda',d2:'Terça',d3:'Quarta',d4:'Quinta',d5:'Sexta',d6:'Sábado',closed:'Fechado',
      contactH:'Contato',addrL:'Endereço',phoneL:'Telefone e WhatsApp',igL:'Instagram',igNote:'Fale por mensagem direta',
      directions:'Como chegar',waBtn:'Escrever pelo WhatsApp',
      orderH:'Peça e passe para buscar',orderP:'Preencha o pedido e abrimos o WhatsApp com a mensagem pronta. Confirmamos o horário por lá.',
      fName:'Nome',fDay:'Dia de retirada',fDayPh:'sábado',fTime:'Horário',fMsg:'Seu pedido',
      sendPick:'Enviar pedido pelo WhatsApp',writeFirst:'Escreva seu pedido para enviar',
      msgPick:function(n,d,h,m){return 'Oi! '+(n?'Sou '+n+'. ':'')+'Quero pedir para retirar'+(d?' no '+d:'')+(h?' às '+h:'')+': '+m},
      msgHi:'Oi! Quero fazer um pedido.',webBy:'Site da'}
  };
  var lang='es';
  try{var sv=localStorage.getItem('cx-lang');if(sv==='pt'||sv==='es')lang=sv;else if((navigator.language||'').toLowerCase().indexOf('pt')===0)lang='pt'}catch(e){}
  var L=function(){return T[lang]};
  var hooks=[];
  var animPlate=function(){};

  function apply(){
    var l=L();document.documentElement.lang=lang==='pt'?'pt-BR':'es';
    document.querySelectorAll('[data-i18n]').forEach(function(el){var v=l[el.dataset.i18n];if(typeof v==='string')el.textContent=v});
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){el.placeholder=l[el.dataset.i18nPh]});
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){el.setAttribute('aria-label',l[el.dataset.i18nAria])});
    document.querySelectorAll('[data-lang]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.lang===lang?'true':'false')});
    document.querySelectorAll('.wa-plain').forEach(function(a){a.href=wa(l.msgHi)});
    hooks.forEach(function(f){f()});
  }
  document.querySelectorAll('[data-lang]').forEach(function(b){b.onclick=function(){lang=b.dataset.lang;try{localStorage.setItem('cx-lang',lang)}catch(e){}apply()}});

  /* menú móvil */
  var ov=document.getElementById('overlay'),mb=document.getElementById('menuBtn'),cb=document.getElementById('closeBtn');
  if(ov&&mb){
    mb.onclick=function(){ov.hidden=false;mb.setAttribute('aria-expanded','true')};
    if(cb)cb.onclick=function(){ov.hidden=true;mb.setAttribute('aria-expanded','false')};
  }

  /* ===== 1. PORTADA: la fritura, un gesto = un paso ===== */
  var fryEl=document.querySelector('.fry');
  var sndOn=false,gn=null,ac=null;
  if(fryEl){
    var cv=document.getElementById('fryc'),cx=cv.getContext('2d');
    var caps=[].slice.call(fryEl.querySelectorAll('.cap')),dotsEl=[].slice.call(fryEl.querySelectorAll('.dots i'));
    var nextBtn=document.getElementById('next'),tempEl=document.getElementById('temp');
    var DROP=new Path2D('M300 0C340 110 540 290 540 450c0 150-110 240-240 240S60 600 60 450C60 290 260 110 300 0Z');
    var INNER=new Path2D('M300 150C326 222 456 340 456 450c0 100-72 160-156 160S144 550 144 450C144 340 274 222 300 150Z');
    var W=0,H=0,DPR=1;
    function size(){DPR=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR}
    size();
    var rnd=function(a,b){return a+Math.random()*(b-a)};
    var probe=document.createElement('canvas').getContext('2d');
    var crumbs=[],strands=[];
    while(crumbs.length<170){var x=rnd(60,540),y=rnd(10,690);if(probe.isPointInPath(DROP,x,y))crumbs.push({x:x,y:y,r:rnd(3,7),d:rnd(0,.5),s:rnd(.6,1.4)})}
    while(strands.length<46){var x2=rnd(150,450),y2=rnd(230,600);if(probe.isPointInPath(INNER,x2,y2))strands.push({x:x2,y:y2,a:rnd(-1,1),l:rnd(18,40)})}
    var bubbles=[],sizzle=0;
    var FRY_MS=1100; /* velocidad: ms por paso (sube = más lento) */
    var STEPS=[0,.3,.62,1],step=0,prog=0,tw=null,lastGo=-1e9,lastWheel=-1e9,lockUntil=0;

    function drawFry(p,t){
      var c=cx;c.setTransform(DPR,0,0,DPR,0,0);
      c.fillStyle='#0b5d3b';c.fillRect(0,0,W,H);
      var wide=W>900;
      var hgt=wide?Math.min(H*.7,W*.55):Math.min(H*.34,W*.6);
      var s=hgt/690,X=wide?W*.68:W*.5,Y0=wide?H*.5:H*.72;
      var t1=ss(.12,.32,p),t2=ss(.36,.5,p),t3=ss(.42,.74,p),t4=ss(.76,.86,p),t5=ss(.86,.97,p);
      var Y=Y0+(t2-t4)*hgt*.22;
      var oilTop=H-(ss(.3,.42,p)-ss(.8,.92,p))*(H-(Y0-hgt*.05));
      var heat=ss(.3,.5,p);
      var r=mix(mix(241,222,t1),mix(227,196,t3*t3*.5),t3),g=mix(mix(223,192,t1),mix(154,120,t3*t3*.5),t3),b=mix(mix(180,132,t1),mix(34,22,t3*t3*.5),t3);
      var crust='rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
      var crumbC='rgb('+(mix(196,150,t3)|0)+','+(mix(150,86,t3)|0)+','+(mix(84,14,t3)|0)+')';
      var sway=(1-t2)*Math.sin(t*.0012)*.04;
      var gap=t5*hgt*.16;
      for(var half=-1;half<=1;half+=2){
        if(t5<=0&&half===1)break;
        c.save();
        c.translate(X+(t5>0?gap*half/2:0),Y);c.rotate(sway+(t5>0?half*.08*t5:0));c.scale(s,s);c.translate(-300,-345);
        if(t5>0){c.beginPath();if(half<0)c.rect(-50,-50,350,800);else c.rect(300,-50,350,800);c.clip()}
        c.fillStyle=crust;c.fill(DROP);
        for(var i=0;i<crumbs.length;i++){
          var m=crumbs[i],k=clamp((t1-m.d)/(1-m.d+.0001)*1.6,0,1);if(k<=0)continue;
          var fy=mix(m.y-(H/s)*1.1*m.s,m.y,k);
          c.fillStyle=crumbC;c.globalAlpha=k<1?.9:.75;c.beginPath();c.arc(m.x,fy,m.r,0,6.283);c.fill();
        }
        c.globalAlpha=1;
        if(t4>0&&t5<1){c.globalAlpha=.45*t4*(1-t5);c.strokeStyle='#fff3d6';c.lineWidth=16;c.lineCap='round';c.beginPath();c.moveTo(196,420);c.bezierCurveTo(206,350,250,270,278,226);c.stroke();c.globalAlpha=1}
        if(t5>0){
          c.globalAlpha=clamp(t5*2.5,0,1);
          c.fillStyle='#f4e2bd';c.fill(INNER);
          c.strokeStyle='#c98a4a';c.lineWidth=6;c.lineCap='round';
          for(var j=0;j<strands.length;j++){var q=strands[j];c.beginPath();c.moveTo(q.x,q.y);c.quadraticCurveTo(q.x+q.l*.5,q.y+q.a*10,q.x+q.l*Math.cos(q.a),q.y+q.l*Math.sin(q.a));c.stroke()}
          c.fillStyle='#fffaf0';c.beginPath();c.ellipse(300,470,70,52,0,0,6.283);c.fill();
          c.globalAlpha=1;
        }
        c.restore();
      }
      if(t5>0){
        c.save();c.strokeStyle='rgba(255,255,255,'+(.5*t5)+')';c.lineWidth=Math.max(3,hgt*.012);c.lineCap='round';
        for(var v=0;v<3;v++){var sx=X+(v-1)*hgt*.12,base=Y-hgt*.32,rise=((t*.04+v*40)%120)/120;
          c.globalAlpha=t5*(1-rise);c.beginPath();
          for(var yy=0;yy<=60;yy+=6){var px=sx+Math.sin((yy+t*.08+v*30)*.12)*hgt*.025,py=base-rise*hgt*.25-yy*hgt*.004;yy?c.lineTo(px,py):c.moveTo(px,py)}
          c.stroke()}
        c.restore();
      }
      if(oilTop<H){
        c.save();c.globalAlpha=.8;c.fillStyle='#e8a028';c.beginPath();c.moveTo(0,H);
        for(var x3=0;x3<=W+20;x3+=20)c.lineTo(x3,oilTop+Math.sin(x3*.02+t*.004)*(3+heat*5));
        c.lineTo(W,H);c.closePath();c.fill();
        c.globalAlpha=.9;c.fillStyle='#ffd067';c.beginPath();
        for(var x4=0;x4<=W+20;x4+=20){var yy2=oilTop+Math.sin(x4*.02+t*.004)*(3+heat*5);x4?c.lineTo(x4,yy2):c.moveTo(x4,yy2)}
        for(x4=W;x4>=0;x4-=20)c.lineTo(x4,oilTop+6+Math.sin(x4*.02+t*.004)*(3+heat*5));
        c.closePath();c.fill();c.restore();
        var rate=reduce?0:heat*(1-ss(.8,.9,p))*4;
        for(var n=0;n<rate;n++)if(Math.random()<rate-n)bubbles.push({x:X+rnd(-.55,.55)*hgt*.75,y:rnd(Math.max(oilTop,Y-hgt*.1),Math.min(H,Y+hgt*.55)),r:rnd(2,7)*(hgt/500),v:rnd(.6,2.2)});
        c.save();c.strokeStyle='rgba(255,246,214,.85)';c.fillStyle='rgba(255,236,180,.3)';c.lineWidth=1.5;
        for(var bI=bubbles.length-1;bI>=0;bI--){var bb=bubbles[bI];bb.y-=bb.v*(1+heat);bb.x+=Math.sin(bb.y*.05)*.4;
          if(bb.y<oilTop+2){bubbles.splice(bI,1);continue}
          c.beginPath();c.arc(bb.x,bb.y,bb.r,0,6.283);c.fill();c.stroke()}
        c.restore();
      }else bubbles.length=0;
      sizzle=heat*(1-ss(.8,.9,p))*(oilTop<H?1:0);
      tempEl.textContent=Math.round(20+160*heat)+' °C';
    }

    function showStep(){
      caps.forEach(function(el){el.classList.toggle('on',+el.dataset.s===step)});
      dotsEl.forEach(function(d,i){d.classList.toggle('cur',i===step)});
      nextBtn.hidden=step===3;
    }
    function go(i){
      i=clamp(i,0,3);
      if(i===step||tw)return false;
      step=i;showStep();
      var to=STEPS[i];
      if(reduce){prog=to;drawFry(prog,0);return true}
      tw={from:prog,to:to,t0:performance.now(),dur:FRY_MS};
      lastGo=performance.now();
      lockUntil=lastGo+FRY_MS+450;
      return true;
    }
    function inFry(){return window.scrollY<=8}
    nextBtn.addEventListener('click',function(){go(step+1)});

    /* rueda: un gesto = un paso; al terminar, la página sigue */
    window.addEventListener('wheel',function(e){
      if(!inFry())return;
      var dy=e.deltaY,now=performance.now();
      /* mientras la animación no termine (y un poco después) no se baja la página */
      if(tw||now<lockUntil){e.preventDefault();return}
      if(Math.abs(dy)<4)return;
      var fwd=dy>0,gap=now-lastWheel;lastWheel=now;
      if((fwd&&step<3)||(!fwd&&step>0)){
        e.preventDefault();
        if(!tw&&gap>220&&now-lastGo>350)go(step+(fwd?1:-1));
      }else if(tw)e.preventDefault();
    },{passive:false});
    /* dedo: un deslizamiento = un paso */
    var touchY0=null;
    window.addEventListener('touchstart',function(e){touchY0=inFry()?e.touches[0].clientY:null},{passive:true});
    window.addEventListener('touchmove',function(e){
      if(touchY0==null)return;
      var dy=touchY0-e.touches[0].clientY;
      if(tw||performance.now()<lockUntil||(dy>6&&step<3)||(dy<-6&&step>0))e.preventDefault();
    },{passive:false});
    window.addEventListener('touchend',function(e){
      if(touchY0==null)return;
      var dy=touchY0-e.changedTouches[0].clientY;touchY0=null;
      if(Math.abs(dy)>40)go(step+(dy>0?1:-1));
    },{passive:true});
    window.addEventListener('keydown',function(e){
      if(!inFry()||(e.target.closest&&e.target.closest('input,textarea')))return;
      if(['ArrowDown','PageDown',' '].indexOf(e.key)>-1&&step<3){e.preventDefault();go(step+1)}
      else if(['ArrowUp','PageUp'].indexOf(e.key)>-1&&step>0){e.preventDefault();go(step-1)}
    });

    /* sonido de fritura (opcional) */
    var sndBtns=[].slice.call(document.querySelectorAll('.snd'));
    function startSound(){
      var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      ac=new AC();var len=ac.sampleRate*2,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
      for(var i=0;i<len;i++){d[i]=(Math.random()*2-1)*.18+(Math.random()<.0025?(Math.random()*2-1)*.9:0)}
      var src=ac.createBufferSource();src.buffer=buf;src.loop=true;
      var hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=1600;
      gn=ac.createGain();gn.gain.value=0;src.connect(hp);hp.connect(gn);gn.connect(ac.destination);src.start();return true;
    }
    sndBtns.forEach(function(b){b.onclick=function(){
      if(!ac&&!startSound())return;
      sndOn=!sndOn;sndBtns.forEach(function(x){x.setAttribute('aria-pressed',sndOn?'true':'false')});
      if(sndOn)ac.resume();else ac.suspend();
    }});

    function loop(t){
      if(cv.clientWidth!==W||cv.clientHeight!==H)size();
      if(tw){var k=clamp((performance.now()-tw.t0)/tw.dur,0,1);prog=tw.from+(tw.to-tw.from)*easeIO(k);if(k>=1)tw=null}
      var r=fryEl.getBoundingClientRect();
      if(r.bottom>0&&r.top<innerHeight){drawFry(prog,reduce?0:t)}else sizzle=0;
      if(gn&&sndOn)gn.gain.setTargetAtTime(sizzle*.5,ac.currentTime,.12);
      if(!reduce)requestAnimationFrame(loop);
    }
    addEventListener('load',function(){size();if(reduce)drawFry(prog,0)});
    if(reduce){prog=STEPS[step];drawFry(prog,0);addEventListener('resize',function(){size();drawFry(prog,0)})}
    else{requestAnimationFrame(loop);addEventListener('resize',size)}
    hooks.push(function(){tempEl.textContent=Math.round(20+160*ss(.3,.5,prog))+' °C'});
    showStep();
  }

  /* ===== 2. CARTA: un gesto = una vitrina ===== */
  var track=document.getElementById('track');
  if(track){
    var vit=document.getElementById('d-carta'),vprev=document.getElementById('vprev'),vnext=document.getElementById('vnext'),vcnt=document.getElementById('vcnt');
    var endPanel=track.querySelector('.p-end'),cLastGo=-1e9,cLastW=-1e9;
    function icon(n){n=(n||'').toLowerCase();
      if(/coxinh/.test(n))return 'cox';if(/kib|quib/.test(n))return 'kib';if(/bolinh/.test(n))return 'bol';if(/p[aã]o de queijo/.test(n))return 'pao';
      if(/pastel/.test(n))return 'pas';if(/brigadeir/.test(n))return 'bri';if(/beijinh/.test(n))return 'bei';if(/guaran/.test(n))return 'gua';if(/risol/.test(n))return 'ris';return 'drop'}
    function panels(){return [].slice.call(track.querySelectorAll('.panel'))}
    function trackLeft(){return track.getBoundingClientRect().left+parseFloat(getComputedStyle(track).paddingLeft)}
    function curIdx(){
      var ps=panels(),tl=trackLeft(),best=0,bd=1e9;
      ps.forEach(function(p,i){var d=Math.abs(p.getBoundingClientRect().left-tl);if(d<bd){bd=d;best=i}});
      return best;
    }
    function toPanel(i){
      var ps=panels();i=clamp(i,0,ps.length-1);
      track.scrollTo({left:track.scrollLeft+ps[i].getBoundingClientRect().left-trackLeft(),behavior:reduce?'auto':'smooth'});
    }
    function vitUI(){
      var n=panels().length,i=curIdx();
      vcnt.textContent=(i+1)+' / '+n;
      vprev.disabled=i<=0;vnext.disabled=i>=n-1;
    }
    track.addEventListener('scroll',vitUI,{passive:true});
    vprev.onclick=function(){toPanel(curIdx()-1)};
    vnext.onclick=function(){toPanel(curIdx()+1)};
    /* rueda en escritorio: un gesto = una vitrina; en los extremos la página sigue */
    window.addEventListener('wheel',function(e){
      if(innerWidth<=900)return;
      var r=vit.getBoundingClientRect();
      if(!(r.top<innerHeight*.5&&r.bottom>innerHeight*.5))return;
      var dy=e.deltaY;if(Math.abs(dy)<4||Math.abs(dy)<Math.abs(e.deltaX))return;
      var now=performance.now(),gap=now-cLastW;cLastW=now;
      var i=curIdx(),n=panels().length,fwd=dy>0;
      if((fwd&&i<n-1)||(!fwd&&i>0)){
        e.preventDefault();
        if(gap>220&&now-cLastGo>450){cLastGo=now;toPanel(i+(fwd?1:-1))}
      }
    },{passive:false});

    /* 4 productos por vitrina en móvil, 6 en escritorio */
    function perPanel(){return innerWidth<=620?4:6}
    var perNow=perPanel();
    function buildMenu(){
      track.querySelectorAll('.p-menu,.p-empty').forEach(function(el){el.remove()});
      var l=L();
      if(!MENU.length){
        var e=document.createElement('div');e.className='panel p-empty';
        e.innerHTML='<div class="case"><h3 style="font-size:var(--s-head)">'+esc(l.emptyH)+'</h3><p>'+esc(l.emptyP)+'</p><a class="btn btn-green wa-plain" style="align-self:flex-start" href="'+wa(l.msgHi)+'" target="_blank" rel="noopener">'+esc(l.tOrder)+'</a></div>';
        track.insertBefore(e,endPanel);return;
      }
      var per=perPanel();
      MENU.forEach(function(cat){
        var items=cat.items||[];
        for(var i=0;i<items.length;i+=per){
          var part=items.slice(i,i+per),pn=document.createElement('div');pn.className='panel p-menu';
          var html='<div class="case"><div class="case-h"><h3>'+esc(cat.cat)+'</h3><span>'+esc(l.nItems(items.length))+'</span></div><ul class="shelf">';
          part.forEach(function(it){html+='<li class="it"><svg aria-hidden="true" viewBox="0 0 64 64"><use href="#i-'+icon(it.n)+'"/></svg><span class="nm">'+esc(it.n)+'</span>'+(it.p?'<span class="tag">'+esc(it.p)+'</span>':'')+(it.d?'<span class="ds">'+esc(it.d)+'</span>':'')+'</li>'});
          pn.innerHTML=html+'</ul></div>';track.insertBefore(pn,endPanel);
        }
      });
    }
    addEventListener('resize',function(){if(perPanel()!==perNow){perNow=perPanel();buildMenu();vitUI()}});
    hooks.push(function(){buildMenu();track.scrollLeft=0;vitUI()});
  }

  /* ===== 3. ENCARGOS ===== */
  var drops=document.getElementById('drops');
  if(drops){
    var target=100,shades=['#e39a22','#d68a1c','#eaa83e','#c97a14','#f0b44c'],plateSeen=false;
    var sizeBtns=[].slice.call(document.querySelectorAll('.sizes button'));
    function plate(anim){
      var cols=target>100?15:10;drops.style.gridTemplateColumns='repeat('+cols+',1fr)';drops.innerHTML='';
      for(var i=0;i<target;i++){var e=document.createElement('i');e.style.background=shades[(i*7+(i>>2))%shades.length];
        if(anim&&!reduce){e.className='pop';e.style.animationDelay=(i*7)+'ms'}drops.appendChild(e)}
      document.getElementById('count').textContent=target;
      drops.setAttribute('aria-label',L().plate(target));
      document.getElementById('party-send').href=wa(L().msgParty(target));
    }
    sizeBtns.forEach(function(b){b.onclick=function(){
      sizeBtns.forEach(function(x){x.setAttribute('aria-pressed','false')});
      b.setAttribute('aria-pressed','true');target=+b.dataset.n;plate(true)}});
    hooks.push(function(){plate(false)});
    animPlate=function(){plate(true)};
    drops.dataset.ready='1';
    window.__plateSeen=function(){if(!plateSeen){plateSeen=true;plate(true)}};
  }

  /* ===== 4. HORARIO Y LETRERO ===== */
  var signEl=document.getElementById('sign');
  if(signEl){
    var sched={0:[12,20],1:null,2:[11,21],3:[11,21],4:[11,21],5:[11,22],6:[11,22]};
    var now=new Date(),dd=now.getDay(),hh=now.getHours()+now.getMinutes()/60,sc=sched[dd];
    var row=document.querySelector('#hours tr[data-d="'+dd+'"]');if(row)row.classList.add('today');
    var isOpen=!!(sc&&hh>=sc[0]&&hh<sc[1]);
    var garl=document.getElementById('garland'),gh='<path d="M0 8 Q500 22 1000 8" stroke="#3a3a3a" stroke-width="3" fill="none"/>';
    for(var gi=0;gi<=13;gi++){var gx=30+gi*(940/13),gt=gx/1000,gy=(1-gt)*(1-gt)*8+2*(1-gt)*gt*22+gt*gt*8,gc=['#ffd23f','#1fbf6a','#2a6fdb'][gi%3];
      gh+='<polygon class="pen" fill="'+gc+'" points="'+(gx-24)+','+gy+' '+(gx+24)+','+gy+' '+gx+','+(gy+54)+'"/>'}
    garl.innerHTML=gh;
    hooks.push(function(){
      var l=L();
      document.getElementById('neon').textContent=isOpen?l.signOpen:l.signClosed;
      signEl.setAttribute('data-state',isOpen?'open':'closed');
      document.getElementById('status').textContent=isOpen?l.open(sc[1]):(sc&&hh<sc[0]?l.opensAt(sc[0]):l.closedNow);
    });
  }

  /* ===== 5. PEDIDO ===== */
  var form=document.getElementById('coupon');
  if(form){
    var fs=document.getElementById('f-send');
    var upd=function(){var l=L(),v=function(id){return document.getElementById(id).value.trim()},ok=v('f-msg').length>0;
      fs.href=wa(l.msgPick(v('f-name'),v('f-day'),v('f-time'),v('f-msg')));fs.textContent=ok?l.sendPick:l.writeFirst;
      if(ok)fs.removeAttribute('aria-disabled');else fs.setAttribute('aria-disabled','true')};
    form.addEventListener('input',upd);
    form.addEventListener('submit',function(e){e.preventDefault()});
    hooks.push(upd);
  }

  /* ===== entradas al hacer scroll ===== */
  if('IntersectionObserver' in window&&!reduce){
    document.documentElement.classList.add('js');
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);
      if(e.target.classList.contains('plate')&&window.__plateSeen)window.__plateSeen()}})},{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
  }

  /* ===== botones: el contenido se abre justo debajo, sin cambiar de página ===== */
  var drawer=document.getElementById('drawer');
  var acts=[].slice.call(document.querySelectorAll('.tile[data-d]'));
  function openD(name){
    var same=drawer.dataset.open===name;
    drawer.querySelectorAll('.dpanel').forEach(function(p){p.hidden=true});
    acts.forEach(function(a){a.setAttribute('aria-expanded','false')});
    drawer.dataset.open='';drawer.hidden=true;
    if(same)return;
    var p=document.getElementById('d-'+name);if(!p)return;
    p.hidden=false;drawer.hidden=false;drawer.dataset.open=name;
    acts.forEach(function(a){if(a.dataset.d===name)a.setAttribute('aria-expanded','true')});
    if(name==='encargos')animPlate();
    if(name==='carta'){var t=document.getElementById('track');if(t)t.scrollLeft=0}
    setTimeout(function(){drawer.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})},30);
  }
  document.querySelectorAll('[data-d]').forEach(function(a){a.addEventListener('click',function(e){
    e.preventDefault();if(ov)ov.hidden=true;if(mb)mb.setAttribute('aria-expanded','false');openD(a.dataset.d)})});

  apply();
})();
