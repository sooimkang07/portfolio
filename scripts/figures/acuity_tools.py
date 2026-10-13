"""Build Acuity's four-tool visual workflow from original assets."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
cards=[]
for key,label in [('midjourney','Midjourney'),('chatgpt','ChatGPT'),('figma-make','Figma Make'),('sora','Sora')]:
    alt = 'Sora film scenes: walking on the street, and a conversation with a doctor' if key == 'sora' else f'{label} project visual'
    media = f'<img src="assets/acuity/build/{key}.png" alt="{alt}" loading="lazy" decoding="async">'
    cards.append(f'<div class="board__card ac-aistack__{key}"><p class="board__title">{label}</p><div class="board__body">{media}</div></div>')
wires='<svg class="ngraph__wires" viewBox="0 0 1920 1080" aria-hidden="true"><path d="M400 290C400 170 550 140 660 140M1260 140C1370 140 1520 170 1520 290M400 820C400 910 650 940 775 940M1520 748C1520 860 1270 940 1145 940"/><circle cx="400" cy="290" r="5"/><circle cx="660" cy="140" r="5"/><circle cx="1260" cy="140" r="5"/><circle cx="1520" cy="290" r="5"/><circle cx="400" cy="820" r="5"/><circle cx="775" cy="940" r="5"/><circle cx="1520" cy="748" r="5"/><circle cx="1145" cy="940" r="5"/></svg>'
figure='<figure class="nt-media nt-process" data-no-controls><div class="fig ac-aistack" aria-label="The AI stack: Midjourney, ChatGPT, Figma Make, and Sora">'+wires+''.join(cards)+'</div></figure>'
p=ROOT/'acuity.html'; s=p.read_text(); marker=s.index('class="fig board ac-aistack"') if 'class="fig board ac-aistack"' in s else s.index('class="fig ac-aistack"'); a=s.rfind('<figure',0,marker); b=s.index('</figure>',marker)+len('</figure>');p.write_text(s[:a]+figure+s[b:])
