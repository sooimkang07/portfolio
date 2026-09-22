from pathlib import Path
from html.parser import HTMLParser
from html import escape
import shutil
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
class N:
 def __init__(self,t='',a=None,c=None):self.t=t;self.a=dict(a or []);self.c=c or []
 def has(self,c):return c in self.a.get('class','').split()
 def all(self,fn):return [n for c in self.c if isinstance(c,N) for n in ([c] if fn(c) else [])+c.all(fn)]
 def one(self,fn):return self.all(fn)[0]
 def html(self):
  if not self.t:return ''.join(c.html() if isinstance(c,N) else c for c in self.c)
  at=''.join(' '+k+('="'+escape(v,quote=True)+'"' if v is not None else '') for k,v in self.a.items())
  return '<'+self.t+at+'>'+('' if self.t in VOID else ''.join(c.html() if isinstance(c,N) else c for c in self.c)+'</'+self.t+'>')
class P(HTMLParser):
 def __init__(self,s):super().__init__(convert_charrefs=False);self.root=N();self.stack=[self.root];self.feed(s)
 def handle_starttag(self,t,a):
  n=N(t,a);self.stack[-1].c.append(n)
  if t not in VOID:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].t==t:self.stack=self.stack[:i];break
 def handle_data(self,s):self.stack[-1].c.append(s)
 def handle_entityref(self,s):self.handle_data('&'+s+';')
 def handle_charref(self,s):self.handle_data('&#'+s+';')
 def handle_decl(self,s):self.handle_data('<!'+s+'>')
 def handle_comment(self,s):self.handle_data('<!--'+s+'-->')
def frag(s):return P(s).root.c
p=Path('instagram-lists.html');s=p.read_text(); backup=Path('_restore/instagram-before-editorial.html')
if not backup.exists():backup.write_text(s)
r=P(s).root
body=r.one(lambda n:n.t=='body');body.a['class']='home page--project notate-page instagram-page'
head=r.one(lambda n:n.t=='head')
for name in ['notate','notate-refinements','instagram-editorial']:
 head.c.append(N('link',{'rel':'stylesheet','href':f'css/{name}.css?v=ig-1'}))
main=r.one(lambda n:n.t=='main');main.a={'class':'nt-main','id':'top'}
oldbody=r.one(lambda n:n.has('case__body'))
hero=oldbody.one(lambda n:n.has('case__hero'))
cover=hero.one(lambda n:n.has('case__media-block--hero'));hero.c.remove(cover)
cover.a['class']='ig-cover nt-wide nt-hero-media'
hero.a['class']='nt-hero nt-reading'
hero.one(lambda n:n.t=='h1').a['class']=''
hero.one(lambda n:n.has('case__eyebrow')).a['class']='nt-kicker'
meta=hero.one(lambda n:n.has('case__meta'));meta.a['class']='nt-meta';meta.t='dl'
for item in [x for x in meta.c if isinstance(x,N)]:
 vals=[x for x in item.c if isinstance(x,N)]
 vals[0].t='dt';vals[0].a={};vals[1].t='dd';vals[1].a={}
sections=[x for x in oldbody.c if isinstance(x,N) and x.t=='section']
labels={'overview':'Overview','solution':'Solution','visuals':'Visuals','flows':'Core flows','system':'System','research':'Research','explorations':'Explorations','decisions':'Decisions','impact':'Impact','reflection':'Reflection'}
toc='<aside class="nt-rail"><nav class="nt-toc" aria-label="Case study sections"><a class="nt-back" href="/">← Back</a><ol>'
for sec in sections:
 id=sec.a['id'];label=labels[id];sec.a['class']='nt-section ig-section nt-reading'
 toc+=f'<li><a href="#{id}"><span class="project-toc-flip"><span class="project-toc-flip-track"><span class="project-toc-title">{label}</span><span class="project-toc-title" aria-hidden="true">{label}</span></span></span></a></li>'
toc+='</ol></nav></aside>'
contact=main.one(lambda n:n.has('home-contact'))
main.c=[cover,N('div',{'class':'nt-story'},frag(toc)+[N('div',{'class':'nt-chapters'},[hero]+sections)]),contact]
# Media source replacements.
for img in main.all(lambda n:n.t=='img'):
 src=img.a.get('src','')
 for key in ['system-mapping','system-fit','competitive-analysis','user-interviews']:
  if src.endswith('/'+key+'.jpg') or src.endswith('/'+key+'.png'):
   img.a['src']='instagram-assets/generated/'+key+'.png';img.a['loading']='lazy'
# Copy precedes its associated visual in all flow/reflection groups.
for group in main.all(lambda n:n.has('case__flow-block'))+main.all(lambda n:n.has('case__col-group')):
 targets=[group] if group.has('case__flow-block') else [n for n in group.c if isinstance(n,N)]
 for item in targets:
  text=[n for n in item.c if isinstance(n,N) and n.t in ['h3','p']]
  item.c=text+[n for n in item.c if n not in text]
# Replace exploration gallery with full-width animated findings.
exp=next(n for n in sections if n.a['id']=='explorations')
group=exp.one(lambda n:n.has('ig-explorations__cols'))
quotes=[
 [('Lucy','Messages definitely needs some filtering system.','#c5e6f5'),('Kimaya','More of an explore page problem than the feed because at least with feed it’s probably from someone I’m already following','#c9ead4'),('Chareese','I would love to be able to save/pin different locations in my maps on Instagram instead of seeing my friends location like it is now.','#fae7ad')],
 [('Chareese','I like swiping between. The eye icon makes more sense than the pin.','#fae7ad'),('Melody','I prefer only 3 pinned posts because it’s easier to curate','#f3d1e8'),('Kimaya','I don’t love the public/private profile concept because Instagram feels less corporate to me, but showing a selected 3 posts is very appealing.','#c9ead4')],
 [('Melody','Would love a feed with no creators, ads, suggested','#f3d1e8'),('Katie','Could be drop down list to categorize person into a list directly on post','#f9cecf'),('Adam','How would it look like to add someone to multiple lists','#c7eeee')]
]
new=[]
for i,item in enumerate([n for n in group.c if isinstance(n,N)]):
 text=[n for n in item.c if isinstance(n,N) and n.t in ['h3','p']]
 board=f'<div class="ig-findings" aria-label="User testing feedback for exploration {i+1}"><img class="ig-findings-board" src="instagram-assets/explorations/exploration-{i+1}.png" alt="Original exploration screens and participant feedback" loading="lazy"><div class="ig-findings-quotes">'
 for j,(name,quote,color) in enumerate(quotes[i]):
  board+=f'<blockquote class="ig-quote ig-quote-{j+1}" style="--note:{color};--delay:{j* -5}s"><cite>{name}</cite><p>{escape(quote)}</p></blockquote>'
 board+=f'</div><div class="ig-scene-controls"><button type="button" class="ig-motion-toggle" aria-label="Pause animation">Ⅱ</button><a href="instagram-assets/explorations/exploration-{i+1}.png" target="_blank" rel="noopener" aria-label="Open original exploration board">↗</a></div></div>'
 new.append(N('article',{'class':'ig-exploration'},[N('div',{'class':'ig-exploration-copy'},text)]+frag(board)))
group.a['class']='ig-explorations';group.c=new
# Design decisions: two text/visual pairings, retain rationale verbatim.
dec=next(n for n in sections if n.a['id']=='decisions');els=[n for n in dec.c if isinstance(n,N)];intro=els[0]
blocks=[]
for start in [1,5]:
 h,copy,media,pair=els[start:start+4]
 h.t='h4';h.a={}
 blocks.append(N('article',{'class':'ig-decision'},[N('div',{'class':'ig-decision-copy'},[h,copy,pair]),media]))
dec.c=[intro]+blocks
for v in main.all(lambda n:n.t=='video'):
 for k in ['autoplay','muted','playsinline','loop']:v.a[k]=''
 v.a.pop('controls',None)
for parent in main.all(lambda n:True):
 parent.c=[n for n in parent.c if not (isinstance(n,N) and n.has('flow__volume'))]
# Use page-local video controls, not viewport-gated playback from work.js.
body.c=[n for n in body.c if not (isinstance(n,N) and n.t=='script' and n.a.get('src') in ['js/work.js','js/case-layout.js'])]
body.c+=frag('<script src="js/notate.js"></script><script src="js/instagram-editorial.js"></script>')
p.write_text(r.html())
shutil.copyfile('/Users/sooimkang/.codex/generated_images/01a0c7bb-c3ba-7363-ae33-5990fd145a26/exec-1b9aa94a-2b82-4135-ab08-09ce7c104016.png','instagram-assets/generated/competitive-analysis.png')
print('Updated page; original saved:',backup)
