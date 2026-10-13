"""Acuity > Build > "System architecture". Run from the repo root: python3 scripts/figures/acuity_architecture.py"""
import os, sys; sys.path.insert(0, os.path.dirname(__file__))
from ngraph import render, replace_figure, W

OFF = -24  # shifts the whole graph up so it sits centered in 1080
cols = {'in': 130, 'proc': 560, 'int': 990, 'exp': 1430}
spec = dict(
    cols=cols, W=W, label_top=96 + OFF,
    nodes=[
        ('band', 'in', 200 + OFF, 'Bracelet', [('Blood pressure', 'Cuffless'), ('Heart rate + HRV', ''), ('Sleep', '')], False),
        ('ctx', 'in', 560 + OFF, 'Your context', [('Health history', 'EHR import'), ('Cuff calibration', '')], False),
        ('base', 'proc', 250 + OFF, 'Personal baseline', [('14-day calibration', ''), ('Medical-history weighting', '')], True),
        ('sig', 'proc', 560 + OFF, 'Signal analysis', [('Multi-signal correlation', ''), ('Sustained-drift detection', '')], True),
        ('lvl', 'int', 180 + OFF, 'Urgency level', [('dot n', 'Stable'), ('dot p', 'Elevated'), ('dot y', 'Emergent')], True),
        ('sum', 'int', 560 + OFF, 'Summary', [('What changed, and why', ''), ('One next step', '')], True),
        ('alert', 'exp', 150 + OFF, 'Haptic alert', [('Two buzzes', 'Lock screen')], False),
        ('you', 'exp', 380 + OFF, 'You confirm', [('Pinch', 'Open the plan'), ('Hold', 'Keep monitoring'), ('Wave', 'Dismiss')], False),
        ('plan', 'exp', 720 + OFF, 'Care plan', [('Plan for the level', ''), ('24 / 48 / 72-hour watch', ''), ('Insights and reports', '')], False),
    ],
    edges=[('band', 'base'), ('band', 'sig'), ('ctx', 'base'), ('ctx', 'sig'), ('base', 'sig', 'v'), ('sig', 'lvl'), ('sig', 'sum'),
           ('lvl', 'alert'), ('sum', 'plan'), ('alert', 'you', 'v'), ('you', 'plan', 'v')],
    labels=[('01 · Input', 'in'), ('02 · Processing', 'proc'), ('03 · Interpretation', 'int'), ('04 · Experience', 'exp')],
    zone=dict(x=cols['proc'] - 30, y=140 + OFF, w=cols['int'] + W + 30 - (cols['proc'] - 30), h=890, label='Where AI contributes'),
    note=dict(text='Nothing happens without you.', x=cols['exp'], y=1000 + OFF),
    aria='System architecture as a flow. Input: the bracelet senses blood pressure, heart rate and HRV, and sleep; your context adds health history from an EHR import and cuff calibration. Processing, with AI: a personal baseline from a 14-day calibration weighted by medical history, and signal analysis that correlates signals and detects sustained drift. Interpretation, with AI: one urgency level, Stable, Elevated, or Emergent, and a plain-language summary with one next step. Experience: a haptic alert, then you confirm with a pinch to open the plan, a hold to keep monitoring, or a wave to dismiss, leading to the care plan, a 24, 48, or 72-hour watch, and insights. Nothing happens without you.',
)
fig, _ = render(spec)
replace_figure('acuity.html', 'System architecture as a flow.', fig)
print('acuity.html: System architecture regenerated')
