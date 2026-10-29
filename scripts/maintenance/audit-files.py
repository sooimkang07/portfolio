#!/usr/bin/env python3
"""Conservative inventory: runtime references, retained source/deliverables, archive candidates.
Use --move to relocate confirmed candidates without deleting any file.
"""
from pathlib import Path
import re,json,shutil,sys,urllib.parse,collections
ROOT=Path(__file__).resolve().parents[2]
PAGES=['index','work','about','explorations','password','resume','yap','notate','instagram-lists','neuk','acuity','smart-bundles','forage']
SKIP={'.git','node_modules','venv','.venv','unused','_qa','_restore'}
EXT={'.html','.css','.js','.json','.webmanifest','.svg','.cjs','.mjs','.py','.md','.sh','.txt'}
def walk(base):
 for p in base.rglob('*'):
  if p.is_file() and not any(x in SKIP for x in p.relative_to(ROOT).parts):yield p
files=list(walk(ROOT));sources={p:p.read_text(errors='ignore') for p in files if p.suffix in EXT and p.stat().st_size<3_000_000 and not p.name.startswith('FILE-AUDIT')}
# All current production source and generators. Old backups never establish live use.
active={p:s for p,s in sources.items() if not any(x in p.parts for x in ['_docs','Claude outputs']) and not re.search(r'(redesign-|/v2/|/legacy/)',str(p))}
text='\n'.join(active.values())
source_text='\n'.join(sources.values())
rows=[]
previous=ROOT/'docs/FILE-AUDIT.json'
if previous.exists():
 rows=[r for r in json.loads(previous.read_text()) if r['status']=='archive' and (ROOT/r['archive']).exists() and not (ROOT/r['original']).exists()]
def page_for(rel):
 parts=rel.parts
 if str(rel).startswith('assets/covers/reel'):return 'home'
 if parts[0]=='assets':return {'instagram':'instagram-lists','covers':'work','app-icons':'shared','text-sooim':'shared'}.get(parts[1],parts[1])
 if 'brand-film' in parts or rel.stem=='index':return 'home'
 for name in PAGES:
  if name not in {'index','work'} and name in str(rel).lower():return name
 return 'shared'
def candidate(p,reason):
 rel=p.relative_to(ROOT);dest=Path('unused')/page_for(rel)/rel
 rows.append({'original':rel.as_posix(),'archive':dest.as_posix(),'bytes':p.stat().st_size,'status':'archive','reason':reason})
# Assets with no filename reference anywhere in current source or source-producing tools.
for p in files:
 rel=p.relative_to(ROOT)
 if rel.parts[0]!='assets':continue
 if 'unused' in rel.parts:continue
 if 'figures' in rel.parts and p.name.startswith(('dot-grid-', 'mobile-polish-')):
  candidate(p,'Historical dotted-background/mobile-polish QA preview; current named figure exports are retained.');continue
 if 'figures' in rel.parts:
  rows.append({'original':str(rel),'status':'retain','reason':'Generated downloadable figure export; maintained deliverable, not a runtime dependency.'});continue
 if p.name in source_text or urllib.parse.quote(p.name) in source_text:continue
 # Screen sequences and JSON-driven galleries can construct names dynamically.
 if any(x in str(rel) for x in ['hero/reel','recent-activity','/rail/','/frames/','/screens/','/fonts/','/emoji/']):
  rows.append({'original':str(rel),'status':'review','reason':'Possibly generated or dynamically selected; retained conservatively.'});continue
 candidate(p,'No filename reference in current site source, scripts, documentation or retained production tools.')
# Existing unused folders are already classified by earlier work.
for p in ROOT.glob('assets/**/unused/**/*'):
 if p.is_file():candidate(p,'Previously archived asset in a section unused folder.')
# Historical, non-runtime material. Preserve original hierarchy inside each page archive.
for folder in ['_qa','_restore','css/legacy','css/v2','js/v2','scripts/v2','_docs/build','_docs/specs']:
 for p in (ROOT/folder).rglob('*'):
  if p.is_file():candidate(p,'Historical QA/backup or superseded implementation; not loaded by current pages.')
for p in (ROOT/'scripts').glob('redesign-*.py'):candidate(p,'Historical whole-page rewrite script; not the canonical live implementation.')
for p in [ROOT/'_docs/HANDOFF.md',ROOT/'_docs/README.md',ROOT/'_docs/figure-system.md',ROOT/'_docs/anthropic-plan.md',ROOT/'Claude outputs/brand-film/HANDOFF.md']:
 if p.exists():candidate(p,'Historical handoff/planning instructions superseded by current AGENTS.md and docs.')
# Previous rendered films are reproducibility history, not the current master.
for p in (ROOT/'Claude outputs/brand-film').glob('sooim-kang-brand-film-*.mp4'):
 if p.name not in text:candidate(p,'Previous showreel render; current master and production source are retained.')
# Dedupe overlapping archive sources.
rows=list({r['original']:r for r in rows}.values());rows.sort(key=lambda r:(r['status'],r['original']))
if '--move' in sys.argv:
 mapping={r['original']:r['archive'] for r in rows if r['status']=='archive'}
 for old,new in mapping.items():
  p=ROOT/old;target=ROOT/new
  if not p.exists() and target.exists():continue
  target.parent.mkdir(parents=True,exist_ok=True)
  if target.exists():raise RuntimeError('Archive destination exists: '+new)
  shutil.move(str(p),str(target))
 # Archived HTML and tools keep their old relative hierarchy for historical review.
 # Current maintenance/docs references to moved files are repaired separately using the manifest.
(ROOT/'docs/FILE-AUDIT.json').write_text(json.dumps(rows,indent=2)+'\n')
counts=collections.Counter(r['status'] for r in rows);total=sum(r.get('bytes',0) for r in rows if r['status']=='archive')
md=['# File audit','',f'Archived inventory: **{counts["archive"]} files**, **{total/1024/1024:.1f} MiB**. No files are deleted.','',
'`unused/<page>/` preserves each original path. `shared` holds site-wide history. The JSON manifest records every original path, destination, size, and reason.','',
'Current production source, rendering tools, fonts, dynamic galleries and generated figure exports are retained. Absence from HTML alone is not evidence that production source is disposable.','',
'## Archived files' if '--move' in sys.argv else '## Candidates','', '| Original | Archive | Reason |','|---|---|---|']
for r in rows:
 if r['status']=='archive':md.append(f'| `{r["original"]}` | `{r["archive"]}` | {r["reason"]} |')
md+=['','## Retained deliverables and uncertain files','','| File | Decision | Reason |','|---|---|---|']
for r in rows:
 if r['status']!='archive':md.append(f'| `{r["original"]}` | {r["status"]} | {r["reason"]} |')
md+=['','## Retained production and maintenance folders','','- `_docs/tools/`: recording, compositing, browser automation and their installed dependencies.','- `Claude outputs/brand-film/`: current film source, media, render scripts, current master and intermediate source used for editing.','- `scripts/figures/` and per-section `figures/`: figure generators and downloadable exports.','- `reel/`, `yap-demo/`, `forage-demo/`, `notate-demo/`, `text-sooim-api/`: separate runnable sub-sites/services.','- `AGENTS.md`, `CLAUDE.md`, `docs/`: current instructions and design-system references.','', 'The audit is conservative: retained/review items are not certified safe to delete. Archived QA and backups remain recoverable but their historical launch commands may need paths adapted.']
(ROOT/'docs/FILE-AUDIT.md').write_text('\n'.join(md)+'\n')
print(dict(counts),round(total/1024/1024,1),'MiB')
