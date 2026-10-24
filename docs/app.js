const iconId = { 'Разминка':'battery', 'Кардио':'heart', 'Силовая':'dumbbell', 'Интенсив':'bolt', 'Дэнс':'shoe', 'Йога':'prayer' };
const dayNames = { пн:'ПН', вт:'ВТ', ср:'СР', чт:'ЧТ', пт:'ПТ', сб:'СБ', вс:'ВС' };

function pointColor(value) {
  const stops=[[0,[216,75,54]],[25,[238,165,88]],[50,[234,223,138]],[75,[154,196,134]],[100,[38,123,85]]];
  let i=stops.findIndex(s=>value<=s[0]); if(i<1)return`rgb(${stops[0][1]})`; const [aN,a]=stops[i-1], [bN,b]=stops[i], t=(value-aN)/(bN-aN);
  return`rgb(${a.map((v,j)=>Math.round(v+(b[j]-v)*t)).join(',')})`;
}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function draw(data) {
  const selected = id => [...document.querySelector(`#${id}`).selectedOptions].map(o=>o.value);
  const trainers = selected('trainer-filter'), types = selected('type-filter');
  const allTrainers = trainers.includes('all') || trainers.length === 0, allTypes = types.includes('all') || types.length === 0;
  const visible = data.workouts.filter(x=>(allTrainers||trainers.includes(x.trainer))&&(allTypes||types.includes(x.type)));
  const svg=document.querySelector('#chart'), width=1450, height=720, left=55, right=28, top=44, bottom=88, plotH=height-top-bottom, plotW=width-left-right;
  const maxDuration=Math.ceil(Math.max(...data.workouts.map(x=>x.duration))/5)*5, xStep=plotW/79;
  const x=i=>left+i*xStep, y=v=>top+plotH-(v/maxDuration)*plotH;
  let out=`<defs>
    <symbol id="icon-battery" viewBox="0 0 24 24"><rect x="3" y="6" width="17" height="12" rx="2" fill="none" stroke="#111" stroke-width="1.7"/><path d="M20 10h2v4h-2" fill="none" stroke="#111" stroke-width="1.7"/><path d="M7 9v6M10 9v6M13 9v6M16 9v6" stroke="#238bd0" stroke-width="2"/></symbol>
    <symbol id="icon-heart" viewBox="0 0 24 24"><path d="M12 19.2S3.8 14.2 3.8 8.8C3.8 5.1 8 3.7 12 7.2c4-3.5 8.2-2.1 8.2 1.6 0 5.4-8.2 10.4-8.2 10.4Z" fill="#e33d4f" stroke="#171717" stroke-width="1.1" stroke-linejoin="round"/></symbol>
    <symbol id="icon-dumbbell" viewBox="0 0 24 24"><path d="M7 9v6M4.5 8v8M2.5 10v4M17 9v6M19.5 8v8M21.5 10v4M7 12h10" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round"/></symbol>
    <symbol id="icon-bolt" viewBox="0 0 24 24"><path d="M13.8 2.8 5.5 13h5.8l-1 8.2L18.5 11h-5.7l1-8.2Z" fill="#f5d344" stroke="#222" stroke-width="1.1" stroke-linejoin="round"/></symbol>
    <symbol id="icon-shoe" viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-size="16">👠</text></symbol>
    <symbol id="icon-prayer" viewBox="0 0 24 24"><text x="12" y="17" text-anchor="middle" font-size="16">🙏</text></symbol>
  </defs>`;
  for(let tick=0;tick<=maxDuration;tick+=5){const yy=y(tick);out+=`<line class="gridline" x1="${left}" x2="${width-right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${left-12}" y="${yy+4}" text-anchor="end">${tick}</text>`;}
  out+=`<line class="axis" x1="${left}" x2="${left}" y1="${top}" y2="${top+plotH}"/><line class="axis" x1="${left}" x2="${width-right}" y1="${top+plotH}" y2="${top+plotH}"/>`;
  for(let week=1;week<=10;week++){
    const start=(week-1)*8, end=week===10?79:week*8; if(week>1){const xx=x(start)-xStep/2;out+=`<line class="weekline" x1="${xx}" x2="${xx}" y1="${top-13}" y2="${top+plotH+35}"/>`;}
    const weekly=data.weeklyActive.find(a=>a.week===week);
    out+=`<text class="week-label" x="${(x(start)+x(end))/2}" y="${top-22}" text-anchor="middle">НЕДЕЛЯ ${week}</text><text class="week-share" x="${(x(start)+x(end))/2}" y="${top-5}" text-anchor="middle">${weekly.share.toFixed(1)}% смотрели ≥ 1</text>`;
  }
  data.workouts.forEach((item,index)=>{
    const xx=x(index), yy=y(item.duration), r=9+(item.depth/100)*16, isVisible=visible.includes(item);
    out+=`<line class="axis" x1="${xx}" x2="${xx}" y1="${top+plotH}" y2="${top+plotH+5}"/>`;
    out+=`<text class="day-label" x="${xx}" y="${top+plotH+20}" text-anchor="middle">${dayNames[item.day]}</text>`;
    if(isVisible){const fill=pointColor(item.share), rating=item.rating===null?'—':item.rating.toFixed(1), iconY=['Дэнс','Йога'].includes(item.type)?yy-14:yy-11;out+=`<g class="point" data-index="${index}"><circle cx="${xx}" cy="${yy}" r="${r}" fill="${fill}" stroke="rgba(20,44,36,.42)" stroke-width="1"/><use class="point-icon" href="#icon-${iconId[item.type]}" x="${xx-11}" y="${iconY}" width="22" height="22"/><text class="rating-value" x="${xx}" y="${yy+r-5}">${rating}</text></g>`;}
  });
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`); svg.innerHTML=out;
  svg.querySelectorAll('.point').forEach(g=>{const item=data.workouts[Number(g.dataset.index)];g.addEventListener('mouseenter',e=>showTip(item,e));g.addEventListener('mousemove',moveTip);g.addEventListener('mouseleave',hideTip);});
  document.querySelectorAll('[data-key-type]').forEach(el=>{const vals=data.workouts.filter(x=>x.type===el.dataset.keyType&&x.rating!==null).map(x=>x.rating);el.querySelector('.key-rating')?.remove();const rating=vals.length?` · ср. оценка ${(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)}`:' · ср. оценка —';el.insertAdjacentHTML('beforeend',`<span class="key-rating">${rating}</span>`);});
}
const tooltip=document.querySelector('#tooltip');
function showTip(item,e){tooltip.innerHTML=`<p class="tooltip-kicker">Неделя ${item.week} · ${dayNames[item.day]}</p><h3>${esc(item.type)}</h3><div class="tip-row"><span>Тренер</span><b>${esc(item.trainer)}</b></div><div class="tip-row"><span>Длительность</span><b>${item.duration.toFixed(2)} мин</b></div><div class="tip-row"><span>Посмотрели</span><b>${item.share.toFixed(1)}% (${item.viewers} из ${item.totalUsers})</b></div><div class="tip-row"><span>Глубина просмотра</span><b>${item.depth.toFixed(1)}%</b></div><div class="tip-row"><span>Средняя оценка</span><b>${item.rating===null?'—':item.rating.toFixed(1)}</b></div>`;tooltip.classList.add('visible');moveTip(e);}
function moveTip(e){const pad=16, rect=tooltip.getBoundingClientRect();let left=e.clientX+pad,top=e.clientY+pad;if(left+rect.width>innerWidth-10)left=e.clientX-rect.width-pad;if(top+rect.height>innerHeight-10)top=e.clientY-rect.height-pad;tooltip.style.left=`${left}px`;tooltip.style.top=`${top}px`;}
function hideTip(){tooltip.classList.remove('visible');}

fetch('chart-data.json').then(r=>r.json()).then(data=>{
  const trainerSelect=document.querySelector('#trainer-filter'), typeSelect=document.querySelector('#type-filter');
  data.trainers.forEach(x=>trainerSelect.insertAdjacentHTML('beforeend',`<option>${esc(x)}</option>`)); data.types.forEach(x=>typeSelect.insertAdjacentHTML('beforeend',`<option>${esc(x)}</option>`));
  trainerSelect.addEventListener('change',()=>draw(data)); typeSelect.addEventListener('change',()=>draw(data)); draw(data);
}).catch(()=>{document.querySelector('#chart-scroll').innerHTML='<p>Не удалось загрузить данные.</p>';});
