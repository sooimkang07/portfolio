from pathlib import Path
import re,html,base64
P=Path(__file__).resolve().parents[1]; A=P/'assets/smart-bundles/figures'; A.mkdir(exist_ok=True)
def esc(t):return html.escape(str(t))
def text(x,y,s,size=30,fill='#20262d',weight=400):
 return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}">{esc(s)}</text>'
def lines(x,y,ss,size=29,fill='#626b76',leading=41):return ''.join(text(x,y+i*leading,s,size,fill) for i,s in enumerate(ss))
def rect(x,y,w,h,fill='#fff',r=24):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="#d6d9dc"/>'
def base(title,sub=''):
 return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1920" height="1080" viewBox="0 0 1920 1080" role="img"><title>{esc(title)}</title><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#d6d9dc"/></pattern></defs><rect width="1920" height="1080" rx="32" fill="#eff1f3"/><rect width="1920" height="1080" rx="32" fill="url(#dots)"/><g font-family="Arial, Helvetica, sans-serif">'+text(100,105,title,38,weight=500)+text(100,151,sub,23)
def save(name,s): (A/(name+'.svg')).write_text(s+'</g></svg>')
s=base('Three shopping behaviors. One clear opportunity.','Behavioral segments from a national study of ~1,000 U.S. households referenced in the project')
for i,(n,title,pct,desc,need,col) in enumerate([
('01','Structured planners','40%',['Deliberate shoppers','Strong planning habits','Active waste reduction'],['Lowest waste','Support habits already in place.'],'#dbe5df'),
('02','Flexible planners','47%',['Casual, spontaneous shoppers','Positive attitudes toward','reducing food waste'],['Moderate waste','Preserve room for changing plans.'],'#c9d8d2'),
('03','Young wasters','13%',['Younger, lower-income households','Minimal planning habits','More proteins, oils and grains wasted'],['Highest waste','Make portion control the default.'],'#1f5a4b')]):
 x=100+i*582;s+=rect(x,230,556,590);s+=text(x+32,282,n+' / '+need[0].upper(),23);s+=text(x+32,385,pct,86,'#1f5a4b',500)+text(x+32,441,title,35,weight=500)+lines(x+32,510,desc,27);s+=rect(x+30,680,496,105,col,15)+text(x+50,741,need[1],25,'white' if i==2 else '#1f5a4b')
s+=text(100,920,'~7× / week',62,'#1f5a4b',500)+lines(610,891,['Food-waste frequency among Young Wasters, versus ~4.5× for other groups.','The smallest segment offers the strongest opportunity for targeted support.'],29)
save('personas',s)
s=base('Where waste accumulates today','A journey map of purchase intent, household reality, and the missing feedback signal')
for i,(title,action,pain,op) in enumerate([
('Cart',['Build a grocery order','from individual items.'],['Easy to buy more','than the household needs.'],['Right-size quantities','before purchase.']),
('Delivery',['Receive perishables','in fixed pack sizes.'],['Food arrives faster','than it can be used.'],['Deliver portions that fit','actual consumption.']),
('At home',['Fit cooking around','changing routines.'],['Plans change.','Meals get skipped.'],['Keep bundles flexible','and easy to adjust.']),
('Leftovers',['Store or discard','what remains.'],['Uneaten food is invisible','to the shopping system.'],['Feed a quick check-in','into the next order.'])]):
 x=100+i*438;s+=rect(x,265,406,600);s+=text(x+26,322,f'0{i+1}',24,'#1f5a4b')+text(x+26,377,title,40,weight=500)+lines(x+26,451,action,27)+lines(x+26,587,pain,27,'#a34939')+lines(x+26,741,op,27,'#1f5a4b');
 if i<3:s+=text(x+410,536,'→',28)
s+=text(100,974,'↶  Today, no consumption signal closes the loop. Smart Bundles makes that learning optional and easy.',29)
save('journey',s)
s=base('Why try again—and why now?','Market signals captured in the original Smart Bundles research')
for i,(num,title,copy) in enumerate([
('11%+','Online grocery growth',['Projected CAGR through 2030','Convenience and digital adoption','are expanding grocery delivery.']),
('~10.7%','U.S. meal-kit growth',['Annual market growth','Demand is rising for help with','everyday meal decisions.']),
('2,300+','U.S. cities',['Amazon same-day grocery reach','An existing delivery network offers','a route to scale portion intelligence.'])]):
 x=100+i*582;s+=rect(x,300,556,510)+text(x+34,430,num,88,'#1f5a4b',500)+text(x+34,505,title,35,weight=500)+lines(x+34,590,copy,28)
s+=text(100,948,'Opportunity: combine demand for meal support with the flexibility of an existing grocery ecosystem.',30)
save('market',s)
s=base('A grocery journey that learns from the kitchen','Existing Fresh journey → Smart Bundles intervention → better defaults for the next order')
stages=['Discover','Select','Cart','Checkout','Delivery','Consume','Learn','Dispose']
for i,title in enumerate(stages):
 x=95+i*220;s+=rect(x,275,195,102,'#fff',17)+text(x+18,338,title,28,weight=500)
 if i<7:s+=text(x+199,338,'→',23)
for x,w,title,ls in [(95,415,'Discover + select',['Behavior-based bundles','Pre-portioned ingredients']),(535,415,'Cart + checkout',['Edit any item or quantity','Keep control before paying']),(975,195,'Delivery',['Right-sized','portions']),(1195,195,'Consume',['Finish what','was bought']),(1415,195,'Learn',['Optional','feedback'])]:
 s+=f'<path d="M{x+w/2} 377 V465" stroke="#91aca3" stroke-width="3" stroke-dasharray="7 7"/>'+rect(x,465,w,225,'#e5ecea',18)+text(x+19,522,title,25,'#1f5a4b',500)+lines(x+19,580,ls,24,'#1f5a4b',36)
s+='<path d="M1512 700 V850 H190 V705" fill="none" stroke="#1f5a4b" stroke-width="4" stroke-dasharray="10 9"/>'+text(495,919,'Feedback adjusts future defaults—not the way people shop or cook.',32,'#1f5a4b')
save('ecosystem',s)
s=base('One change in defaults. Four connected effects.','Intended system impact · hypotheses to validate through a pilot')
for i,(name,change,result) in enumerate([
('Systems',['One-off transactions become','a continuous learning loop.'],['Future quantities reflect','what actually gets eaten.']),
('People',['Portion guidance appears','inside regular shopping.'],['Less overbuying, without','extra planning or tracking.']),
('Climate',['Fewer ingredients are grown,','shipped and discarded unused.'],['Less household food waste','and associated emissions.']),
('Business',['Recommendations improve','as household needs','become clearer.'],['Fewer spoilage complaints;','greater trust and repeat use.'])]):
 x=100+i*438;s+=rect(x,265,406,615)+text(x+28,335,name,38,weight=500)+lines(x+28,440,change,26)+text(x+28,585,'↓',55,'#1f5a4b')+lines(x+28,725,result,26,'#1f5a4b')
save('impact',s)
s=base('How I’d measure whether the default works','Proposed pilot targets · not measured outcomes')
for i,(num,title,copy,t) in enumerate([
('≥20%','Adoption',['Use of portion-controlled bundles','with no increase in checkout','abandonment.'],'WITHIN 3 MONTHS'),
('15–20%','Less spoilage',['Reduction in post-delivery','spoilage signals for bundled','categories.'],'WITHIN 12 MONTHS'),
('10–15%','Reorder lift',['Improvement in reorder consistency','and repeat purchase rate','among bundle users.'],'WITHIN 6 MONTHS')]):
 x=100+i*582;s+=rect(x,265,556,615)+text(x+32,331,t,24)+text(x+32,468,num,88,'#1f5a4b',500)+text(x+32,545,title,38,weight=500)+lines(x+32,644,copy,28)
save('metrics',s)
# A single 1920 × 1080 figure, with all forty exported iteration states.
s=base('A 24-hour sprint, explored in high fidelity','Meal-planning explorations → portion-controlled bundles → a feedback loop')
order=list(range(2,25))+[1]+list(range(25,41))
for j,n in enumerate(order):
 p=P/f'assets/smart-bundles/iterations/iteration-{n:02}.webp'; data=base64.b64encode(p.read_bytes()).decode();x=100+(j%14)*125+(125 if j>=28 else 0);y=225+(j//14)*275
 # Exported render includes the node’s shadow bounds. Crop those presentation margins in SVG.
 bund=n==1 or n>=25;vw,vh=(602,1095) if bund else (478,950);cropx,cropy=(98,68) if bund else (38,13);cw,ch=(406,900) if bund else (402,874)
 s+=f'<svg x="{x}" y="{y}" width="106" height="235" viewBox="{cropx} {cropy} {cw} {ch}" preserveAspectRatio="xMidYMid meet"><image xlink:href="data:image/webp;base64,{data}" width="{vw}" height="{vh}"/></svg>'+text(x+42,y+258,str(j+1).zfill(2),16)
save('iterations',s)

# Two viewport captures preserve each complete prototype screen without altering its UI.
# The Figma preview's document scroll is 413px; the phone is 402 × 875px.
for i,name in enumerate(['home','bundle','cart','feedback','learning']):
 s=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="426" height="899" viewBox="0 0 426 899"><title>Smart Bundles — {name}</title><rect width="426" height="899" rx="72" fill="#26282b" stroke="#767b81" stroke-width="2"/><g transform="translate(12 12)"><defs><clipPath id="screen"><rect width="402" height="875" rx="60"/></clipPath></defs><g clip-path="url(#screen)">'
 for part,sy,yy,hh in [('top',172.5,0,500),('bottom',259.5,500,375)]:
  data=base64.b64encode((P/f'assets/smart-bundles/solution/screens/{name}-{part}.webp').read_bytes()).decode()
  s+=f'<svg x="0" y="{yy}" width="402" height="{hh}" viewBox="439 {sy} 402 {hh}"><image xlink:href="data:image/webp;base64,{data}" width="1280" height="720"/></svg>'
 (A/f'solution-{name}.svg').write_text(s+'</g></g></svg>')
print('Created research figures, iterations, and five framed solution screens.')
