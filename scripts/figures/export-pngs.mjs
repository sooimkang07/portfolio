import { chromium } from 'playwright-core';
import fs from 'fs';
import { execFileSync } from 'child_process';
import crypto from 'crypto';
const FR=ROOT+'.export-frames/'; fs.mkdirSync(FR,{recursive:true});
// Exports every code-built figure on the project pages as a 2x PNG into
// <project>-assets/<section>/figures/<name>.png. Run from the repo root while a local server
// is up:  python3 -m http.server 5500  &  node scripts/figures/export-pngs.mjs
// Needs playwright-core (npm i -D playwright-core) and ffmpeg (for video frames:
// headless Chromium can't decode H.264, so each video is shown as a frame grabbed by ffmpeg).
// Set CHROME=/path/to/chrome if Chromium isn't at the default path below.
import path from 'path';
const ROOT=process.cwd()+'/';
const PAGES={acuity:'acuity-assets',forage:'forage-assets','instagram-lists':'instagram-assets',neuk:'neuk-assets',notate:'notate-assets','smart-bundles':'smart-bundles-assets',yap:'yap-assets'};
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const log=[];
for (const [pg,folder] of Object.entries(PAGES)) {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:5500/${pg}.html`, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: `*{animation:none!important;transition:none!important}.reveal,[data-reveal]{opacity:1!important;transform:none!important}
    .flow__controls,.yap-rail__btn,.glass.flow__btn,.case-glass-controls{display:none!important}
    .yap-rail,.yap-rail .yap-rail__track,main,section,.nt-section,.nt-step{overflow:visible!important}
    .screen-rail .yap-rail__inner{background:var(--fig-bg) radial-gradient(var(--fig-dot) .6px,transparent .9px) 0 0/10px 10px;border-radius:var(--r-lg)}.fig.anno .conn path{clip-path:none!important}.fig.anno .dot{scale:1!important}` });
  await p.evaluate(()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');document.querySelectorAll('.reveal-ready').forEach(e=>e.classList.add('is-in'))});
  const figs = await p.evaluate(() => {
    const slug = t => (t||'').toLowerCase().replace(/[’']/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const toc = {}; document.querySelectorAll('.project-toc a[href^="#"], a[href^="#"]').forEach(a=>{const t=a.querySelector('.project-toc-title'); if(t) toc[a.getAttribute('href').slice(1)]=t.textContent});
    const isGen = f => f.querySelector('.fig, svg[viewBox="0 0 1920 1080"]') || f.matches('.screen-rail, .fg-cards, .yap-diagram') || f.querySelector('.ig-cards, .sb-cards, .sb-card') || [...f.querySelectorAll('svg')].some(s=>{const v=(s.getAttribute('viewBox')||'').split(/\s+/);return +v[2]>=500});
    const out=[];
    [...document.querySelectorAll('main figure')].filter(f=>!f.parentElement.closest('figure')).forEach((f,i)=>{
      if(!isGen(f)) return;
      const sec=f.closest('section[id]'); const id=sec?sec.id:'';
      const secName = toc[id] ? slug(toc[id]) : 'overview';
      // name: nearest preceding h3 / step label in the same section
      let name=''; let el=f;
      while(el && !name){ let sib=el.previousElementSibling; while(sib && !name){ const h=sib.matches('h3,h2')?sib:sib.querySelector?.('h3:last-of-type,h2'); if(h) name=h.textContent; sib=sib.previousElementSibling } el=el.parentElement; if(el===sec) break }
      const lab=f.getAttribute('aria-label')||f.querySelector('[aria-label]')?.getAttribute('aria-label')||'';
      const first = t => (t||'').split(/[.:;(]| — /)[0].trim();
      const a = first(lab), h = first(name);
      const pick = (a && a.split(/\s+/).length <= 6) ? a : (h || a);
      const short = slug(pick).split('-').slice(0,7).join('-') || 'figure';
      f.dataset.exportIdx=out.length; out.push({secName, short});
    });
    return out;
  });
  const used={};
  for (let k=0;k<figs.length;k++){
    const {secName,short}=figs[k];
    const el = await p.$(`figure[data-export-idx="${k}"]`);
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
    // pause videos on a representative frame
    await el.evaluate(async f=>{
      const imgs=[...f.querySelectorAll('img')]; imgs.forEach(i=>{i.loading='eager'; if(i.dataset.src&&!i.getAttribute('src')) i.src=i.dataset.src});
      await Promise.all(imgs.map(i=>i.complete&&i.naturalWidth?0:new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,15000)})));
      for(const v of f.querySelectorAll('video')){
        if(v.dataset.src&&!v.getAttribute('src')) v.src=v.dataset.src;
        v.preload='auto'; v.muted=true;
        if(v.readyState<2){ v.load(); await new Promise(r=>{v.addEventListener('loadeddata',r,{once:true});setTimeout(r,15000)}) }
        v.pause();
        await new Promise(r=>{v.addEventListener('seeked',r,{once:true}); v.currentTime=Math.min(1,(v.duration||2)/2); setTimeout(r,5000)});
      }
      await new Promise(r=>setTimeout(r,600));
    });
    const vids = await el.evaluate(f=>[...f.querySelectorAll('video')].map((v,i)=>{v.dataset.exv=i; return v.currentSrc||v.getAttribute('src')||v.dataset.src||''}));
    for (let i=0;i<vids.length;i++){
      if(!vids[i]) continue;
      const rel=decodeURIComponent(new URL(vids[i],'http://localhost:5500/').pathname.slice(1));
      const out=crypto.createHash('md5').update(rel).digest('hex')+'.png';
      if(!fs.existsSync(FR+out)){ try{ execFileSync('ffmpeg',['-loglevel','error','-ss','1','-i',ROOT+rel,'-frames:v','1','-y',FR+out]) }catch(e){ try{execFileSync('ffmpeg',['-loglevel','error','-i',ROOT+rel,'-frames:v','1','-y',FR+out])}catch(e2){} } }
      if(fs.existsSync(FR+out)) await el.evaluate(async (f,[i,url])=>{const v=f.querySelector(`video[data-exv="${i}"]`); v.removeAttribute('src'); v.querySelectorAll('source').forEach(s=>s.remove()); v.poster=url; v.load(); await new Promise(r=>{const im=new Image(); im.onload=im.onerror=r; im.src=url}); },[i,'/.export-frames/'+out]);
    }
    await p.waitForTimeout(400);
    let fn=short; used[secName+fn]=(used[secName+fn]||0)+1; if(used[secName+fn]>1) fn+=`-${used[secName+fn]}`;
    const dir=`${ROOT}${folder}/${secName}/figures`; fs.mkdirSync(dir,{recursive:true});
    // rails: capture the full scrolling row
    const target = await el.$('.yap-rail__inner') || el;
    const rail = target!==el;
    if (rail) { const w = await target.evaluate(t=>Math.ceil(t.scrollWidth)); await p.setViewportSize({ width: w+200, height: 1000 }); await p.waitForTimeout(800); await target.scrollIntoViewIfNeeded(); await p.waitForTimeout(800) }
    await target.screenshot({ path: `${dir}/${fn}.png` });
    if (rail) await p.setViewportSize({ width: 1440, height: 1000 });
    log.push(`${folder}/${secName}/figures/${fn}.png`);
  }
  await p.close();
}
await b.close();
fs.rmSync(FR,{recursive:true,force:true});
console.log(log.join('\n'));
