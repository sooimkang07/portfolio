#!/usr/bin/env python3
import math, subprocess, sys, io, shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path("/Users/sooimkang/Developer/portfolio")

def src_lut(h, w):
    top_a, top_s, bl_a, bl_s, pu_a, pu_s = (0.55, 0.55, 0.46, 0.55, 0.32, 0.45)
    ys = np.linspace(0, 1, h)[:, None]
    xs = np.linspace(0, 1, w)[None, :]
    ang = math.radians(160)
    dx, dy = math.sin(ang), -math.cos(ang)
    corners = [(0., 0.), (1., 0.), (0., 1.), (1., 1.)]
    projs = [(px - 0.5) * dx + (py - 0.5) * dy for px, py in corners]
    lo, hi = min(projs), max(projs)
    t = np.clip(((xs - 0.5) * dx + (ys - 0.5) * dy - lo) / (hi - lo), 0, 1)
    c1 = np.array([251, 247, 243], dtype=np.float32)
    c2 = np.array([245, 241, 250], dtype=np.float32)
    c3 = np.array([238, 243, 252], dtype=np.float32)
    u = np.clip(t / 0.5, 0, 1)[..., None]
    v = np.clip((t - 0.5) / 0.5, 0, 1)[..., None]
    base = np.where(t[..., None] < 0.5, c1 * (1 - u) + c2 * u, c2 * (1 - v) + c3 * v)
    layers = [
        ((0.92, 0.62), (226, 208, 255), pu_a, pu_s),
        ((0.0, 1.0), (178, 210, 255), bl_a, bl_s),
        ((0.5, 0.0), (255, 222, 186), top_a, top_s),
    ]
    for (gx, gy), col, a, s in layers:
        rad = max(math.hypot(gx - cx, gy - cy) for cx, cy in corners)
        d = np.hypot(xs - gx, ys - gy) / rad
        k = np.clip(a * (1 - d / s), 0, None)[..., None]
        k = np.where(d[..., None] < s, k, 0)
        base = np.array(col, dtype=np.float32) * k + base * (1 - k)
    return base

def tgt_lut(h, w):
    # Match the app's orange → neutral → blue screen background exactly.
    y = np.linspace(0, 1, h)[:, None, None]
    orange = np.array([255, 241, 225], dtype=np.float32)
    neutral = np.array([252, 251, 249], dtype=np.float32)
    blue = np.array([228, 238, 253], dtype=np.float32)
    a = np.clip(y / .42, 0, 1)
    b = np.clip((y - .42) / .58, 0, 1)
    return np.broadcast_to(np.where(y < .42, orange * (1-a) + neutral*a, neutral*(1-b)+blue*b), (h,w,3)).copy()

def original(path):
    return subprocess.check_output(['git', 'show', 'HEAD:' + str(path)])

def preserve(path):
    src = ROOT / path
    backup = src.parent / 'unused' / ('before-edge-fix-' + src.name)
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists():
        shutil.copy2(src, backup)

def feather(h, w):
    # Clip the replacement to the rounded phone display, never to a feathered rectangle.
    mask = Image.new('L', (w, h))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w-1, h-1), radius=round(w * .14), fill=255)
    return np.asarray(mask, dtype=np.float32)[..., None] / 255

def apply_image(path, box):
    preserve(path)
    im = Image.open(io.BytesIO(original(path))).convert('RGBA')
    arr = np.asarray(im).astype(np.float32)
    x0, y0, x1, y1 = box
    h, w = y1 - y0, x1 - x0
    region = arr[y0:y1, x0:x1, :3]
    alpha = arr[y0:y1, x0:x1, 3:4] / 255
    delta = (tgt_lut(h, w) - src_lut(h, w)) * feather(h, w) * alpha
    arr[y0:y1, x0:x1, :3] = np.clip(region + delta, 0, 255)
    Image.fromarray(arr.astype(np.uint8), 'RGBA').save(ROOT / path, lossless=True, method=6)
    print('still', path, flush=True)

def apply_video(path, box):
    preserve(path)
    src_path = Path("/tmp") / ("yap-original-" + Path(path).name)
    src_path.write_bytes(original(path))
    probe = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
        "-of", "csv=p=0", str(src_path)
    ], text=True).strip()
    w, h, rate, nframes = probe.split(",")
    w, h, nframes = int(w), int(h), int(nframes)
    x0, y0, x1, y1 = box
    sh, sw = y1 - y0, x1 - x0
    src = src_lut(sh, sw)
    tgt = tgt_lut(sh, sw)
    delta = ((tgt - src) * feather(sh, sw)).astype(np.float32)
    tmp = src_path.with_suffix(".regrade.mp4")
    dec = subprocess.Popen([
        "ffmpeg", "-v", "error", "-i", str(src_path),
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"
    ], stdout=subprocess.PIPE)
    enc = subprocess.Popen([
        "ffmpeg", "-y", "-v", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", rate,
        "-i", "-", "-i", str(src_path),
        "-map", "0:v", "-map", "1:a?",
        "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-preset", "fast",
        "-c:a", "copy", "-movflags", "+faststart", str(tmp)
    ], stdin=subprocess.PIPE)
    frame_bytes = w * h * 3
    done = 0
    while True:
        buf = dec.stdout.read(frame_bytes)
        if len(buf) < frame_bytes:
            break
        frame = np.frombuffer(buf, dtype=np.uint8).reshape(h, w, 3).astype(np.float32)
        region = frame[y0:y1, x0:x1]
        frame[y0:y1, x0:x1] = np.clip(region + delta, 0, 255)
        enc.stdin.write(frame.astype(np.uint8).tobytes())
        done += 1
        if done % 200 == 0:
            print(path, done, "/", nframes, flush=True)
    enc.stdin.close()
    dec.wait()
    enc.wait()
    if enc.returncode != 0 or dec.returncode != 0:
        raise SystemExit(f"ffmpeg failed {path} dec {dec.returncode} enc {enc.returncode}")
    tmp.replace(ROOT / path)
    print("video", path, done, "frames")

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "stills":
        cutouts = [
            "assets/yap/solution/04-topics-detected-v2.webp",
            "assets/yap/solution/05-topic-thread-v2.webp",
            "assets/yap/core-features/j-new-chat.webp",
            "assets/yap/iterations/01-chat-v2.webp",
            "assets/yap/iterations/00-chats-v2.webp",
            "assets/yap/iterations/np-now-playing-v2.webp",
        ]
        for p in cutouts:
            im = Image.open(ROOT / p)
            w, h = im.size
            apply_image(p, (int(w * 0.022), int(h * 0.014), int(w * 0.978), int(h * 0.988)))
        # demo poster is a full phone
        im = Image.open(ROOT / "assets/yap/demo/demo-poster-v2.webp")
        w, h = im.size
        apply_image("assets/yap/demo/demo-poster-v2.webp", (int(w * 0.035), int(h * 0.02), int(w * 0.965), int(h * 0.98)))
        # posters share the core-flow phone placement
        phone = (282, 130, 800, 1220)
        for p in [
            "assets/yap/core-features/f1-catchup-v5-poster.webp",
            "assets/yap/core-features/f1-nowplaying-v5-poster.webp",
            "assets/yap/core-features/f2-respond-v3-poster.webp",
            "assets/yap/core-features/f3-organized-v3-poster.webp",
        ]:
            apply_image(p, phone)
    elif mode == "videos":
        phone = (282, 130, 800, 1220)
        for p in sys.argv[2:]:
            apply_video(p, phone)
