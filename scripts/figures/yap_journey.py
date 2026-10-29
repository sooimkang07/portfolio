"""Yap > Build > where a yap starts. Run from the repo root: python3 scripts/figures/yap_journey.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ngraph import render, replace_figure, W, node_h

cols = {'arr': 80, 'land': 546, 'chat': 1012, 'after': 1478}
spec = dict(
    cols=cols, W=W, label_top=56,
    nodes=[
        ('text', 'arr', 100, 'Text invite', [('Opens the link', 'No install')], False),
        ('open', 'arr', 390, 'Open yap', [('Already a member', '')], False),
        ('start', 'arr', 680, 'Start a chat', [('Invite from contacts', 'Twilio SMS')], False),
        ('signin', 'land', 100, 'Sign in', [('Only if you’re new', ''), ('Phone + code', 'Twilio Verify')], False),
        ('chats', 'land', 390, 'All chats', [('Every group', 'Supabase')], False),
        ('room', 'land', 680, 'A chat', [('Topics and replies', '')], False),
        ('one', 'chat', 90, 'One topic', [('From the first unheard reply', '')], False),
        ('all', 'chat', 280, 'Everything new', [('Now Playing', '')], False),
        ('rec', 'chat', 490, 'Record', [('A new memo', 'Browser mic')], False),
        ('reply', 'chat', 700, 'Reply', [('Under one topic', '')], False),
        ('org', 'after', 250, 'Organize', [('Transcribes', 'gpt-4o'), ('Finds the topics', 'Opening words')], True),
        ('cut', 'after', 530, 'Cut', [('Word timestamps', 'In code')], False),
        ('save', 'after', 740, 'Save and text', [('Topics and progress', 'Supabase'), ('Texts the group', 'Twilio')], False),
    ],
    edges=[
        ('text', 'signin'), ('text', 'chats'), ('signin', 'chats', 'v'),
        ('open', 'chats'), ('chats', 'room', 'v'), ('start', 'room'),
        ('room', 'one'), ('room', 'all'), ('room', 'rec'), ('room', 'reply'),
        ('rec', 'org'), ('reply', 'org'), ('org', 'cut', 'v'), ('cut', 'save', 'v'),
    ],
    labels=[('01 · Arrive', 'arr'), ('02 · Land', 'land'), ('03 · In a chat', 'chat'), ('04 · After you talk', 'after')],
    note=dict(text='A reply is a new memo, so it takes the same path.', x=80, y=1008),
    aria='Where a yap starts, and what you can do from there. Arrive by a text invite, by opening yap, or by starting a chat. A text invite opens the link with no install; if you are new, sign in with a phone code through Twilio Verify, then you reach All chats. Opening yap, already a member, also lands on All chats. Starting a chat invites people from your contacts by text and opens that chat. From All chats you open a chat. In a chat you can listen to one topic from the first reply you have not heard, play everything new in Now Playing, record a new memo on the browser mic, or reply under one topic. A recording or a reply is organized by AI, which transcribes with gpt-4o and finds topics from their opening words. Code then cuts the audio at word timestamps, rather than at the model’s guessed time. Topics and listening progress save to Supabase, and Twilio texts the group.',
)
# Center the complete node group vertically within the established canvas.
top = min(n[2] for n in spec['nodes'])
bottom = max(n[2] + node_h(n[4]) for n in spec['nodes'])
offset = (1080 - (bottom - top)) / 2 - top
spec['nodes'] = [(k, c, y + offset, title, rows, ai) for k, c, y, title, rows, ai in spec['nodes']]
spec['label_top'] += offset
fig, N = render(spec)
boxes = [(k, n['x'], n['y'], n['x'] + n['w'], n['y'] + n['h']) for k, n in N.items()]
for i, a in enumerate(boxes):
    for b in boxes[i + 1:]:
        if a[1] < b[3] and b[1] < a[3] and a[2] < b[4] and b[2] < a[4]:
            raise SystemExit(f'overlap {a[0]} {b[0]}')
replace_figure('yap.html', 'Where a yap starts, and what you can do from there', fig)
print('yap.html: journey regenerated')
