#!/usr/bin/env python3
"""Restore one archived path, or all paths, without overwriting existing files.
python3 scripts/maintenance/restore-files.py assets/forage/core-experience/laptop-silver.png
python3 scripts/maintenance/restore-files.py --all
"""
from pathlib import Path
import json,shutil,sys
root=Path(__file__).resolve().parents[2]
requested=set(sys.argv[1:]);rows=json.loads((root/'docs/FILE-AUDIT.json').read_text())
for row in rows:
 if row['status']!='archive' or not ('--all' in requested or row['original'] in requested):continue
 source=root/row['archive'];target=root/row['original']
 if not source.exists():continue
 if target.exists():raise SystemExit('Refusing to overwrite '+row['original'])
 target.parent.mkdir(parents=True,exist_ok=True);shutil.move(source,target);print('Restored',row['original'])
