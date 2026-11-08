"""Synthesize an original ambient score + sound design for the film (numpy only).

    python3 tools/soundtrack.py            -> media/soundtrack.wav
Timings mirror TIMELINE in src/main.js.
"""
import os, wave
import numpy as np

SR = 48000
DURS = [8.0, 7.0, 6.5, 7.5, 7.0, 7.5, 7.5, 7.5, 7.0]
STARTS = np.concatenate([[0], np.cumsum(DURS)[:-1]])
TOTAL = float(sum(DURS))
N = int(TOTAL * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)


def env_seg(a, b, att=1.2, rel=1.2):
    """Smooth 0..1..0 window between a and b seconds."""
    up = np.clip((t - a) / att, 0, 1); dn = np.clip((b - t) / rel, 0, 1)
    return (0.5 - 0.5 * np.cos(np.pi * up)) * (0.5 - 0.5 * np.cos(np.pi * dn))


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo > 0: m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi < SR / 2: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def add(sig, start=0.0, gain=1.0, pan=0.0):
    i = int(start * SR); sig = sig[: max(0, N - i)]
    if i < 0: sig = sig[-i:]; i = 0
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.414; R[i:i + len(sig)] += sig * gain * r * 1.414


def tone(dur, f0, decay=6.0, f1=None):
    tt = np.arange(int(dur * SR)) / SR
    f = f0 if f1 is None else f0 * (f1 / f0) ** (tt / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * decay)


# ---------- harmonic pad ----------
A2, C3, D2, E2, F2, G2 = 110.0, 130.81, 73.42, 82.41, 87.31, 98.0
def notes(*semis, root=110.0): return [root * 2 ** (s / 12) for s in semis]
CHORDS = [
    notes(0, 7, 12, 15, 19),            # Am
    notes(0, 7, 12, 16, 19, root=F2),   # F
    notes(0, 7, 12, 15, 19, root=D2),   # Dm
    notes(0, 7, 12, 15, 19, 24),        # Am (fuller)
    notes(0, 7, 12, 16, 17, root=E2),   # E(sus-ish, tense)
    notes(0, 7, 12, 16, 19, root=F2),   # F
    notes(0, 7, 12, 16, 19, 28, root=C3 / 2),  # C, open
    notes(0, 7, 12, 16, 19, 24, root=G2),      # G, lifting
    notes(0, 7, 12, 14, 15, 19, 24),    # Am add9
]
for k, (s0, d, ch) in enumerate(zip(STARTS, DURS, CHORDS)):
    w = env_seg(s0 - 0.6, s0 + d + 0.6, att=1.4, rel=1.4)
    for j, f in enumerate(ch):
        for det, pan in [(-0.0018, -0.6), (0.0021, 0.6)]:
            ph = rng.random() * 6.28
            v = sum(np.sin(2 * np.pi * f * (1 + det) * h * t + ph * h) / h ** 1.6 for h in range(1, 6))
            trem = 0.8 + 0.2 * np.sin(2 * np.pi * (0.13 + 0.05 * j) * t + ph)
            add(v * w * trem / len(ch), gain=0.11, pan=pan * (0.3 + 0.1 * j))
# sub drone that follows the root
for s0, d, ch in zip(STARTS, DURS, CHORDS):
    add(np.sin(2 * np.pi * ch[0] / 2 * t) * env_seg(s0 - 0.4, s0 + d + 0.4, 1.0, 1.0), gain=0.07)
# final shimmer
sh = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([880, 1318.5, 1760, 987.8])) * env_seg(STARTS[8] + 2.5, TOTAL + 1, 2.5, 2.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t))
add(sh, gain=0.012)

# ---------- scene 1: countdown, midnight, fireworks, cheering ----------
for k in range(3):
    click = band(rng.standard_normal(int(0.04 * SR)), 1500, 6000) * np.exp(-np.arange(int(0.04 * SR)) / SR * 120)
    add(click, start=0.02 + k, gain=0.5); add(tone(0.05, 2200, 80), start=0.02 + k, gain=0.2)
add(tone(2.2, 90, 2.2, 38), start=3.0, gain=0.9)                         # the midnight boom
crowd = band(rng.standard_normal(N), 250, 2600) * env_seg(3.0, STARTS[1] + 0.3, 0.7, 0.6)
crowd *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.7 * t) * np.sin(2 * np.pi * 1.9 * t)
add(crowd, gain=0.16)
fw = np.random.default_rng(11)
for i in range(16):
    t0 = 3.0 + i * 0.32 + fw.random() * 0.25
    add(tone(0.9, 70, 5, 45), start=t0, gain=0.3, pan=fw.uniform(-0.7, 0.7))
    n = int(1.4 * SR); cr = np.zeros(n)
    idx = fw.integers(0, n, 160); cr[idx] = fw.uniform(-1, 1, 160) * np.exp(-idx / SR * 2)
    add(band(cr, 1800, 9000), start=t0 + 0.05, gain=0.5, pan=fw.uniform(-0.8, 0.8))

# ---------- scene 2: patient monitors ----------
for b in np.arange(STARTS[1] + 0.4, STARTS[2] - 0.2, 0.83):
    add(np.sin(2 * np.pi * 988 * np.arange(int(0.09 * SR)) / SR) * np.hanning(int(0.09 * SR)), start=b, gain=0.06, pan=-0.3)
    add(np.sin(2 * np.pi * 1175 * np.arange(int(0.07 * SR)) / SR) * np.hanning(int(0.07 * SR)), start=b + 0.31, gain=0.025, pan=0.5)

# ---------- scene 3: cemetery wind + distant crow-less quiet ----------
wind = band(rng.standard_normal(N), 120, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * t + 1)) * env_seg(STARTS[2] - 0.3, STARTS[3] + 0.3, 1.0, 0.8)
add(wind, gain=0.09)

# ---------- scene 4: crowd murmur ----------
mur = band(rng.standard_normal(N), 180, 1400) * (0.8 + 0.2 * np.sin(2 * np.pi * 2.3 * t) * np.sin(2 * np.pi * 0.9 * t)) * env_seg(STARTS[3] - 0.2, STARTS[4] + 0.2, 0.8, 0.6)
add(mur, gain=0.12)

# ---------- scene 5: market alarm ticks ----------
for b in np.arange(STARTS[4] + 0.3, STARTS[5] - 0.2, 0.25):
    add(tone(0.04, 1600, 90), start=b, gain=0.07, pan=0.2)
for b in np.arange(STARTS[4] + 0.5, STARTS[5] - 0.5, 1.0):
    add(tone(0.5, 55, 6), start=b, gain=0.25)

# ---------- scene 6: winter wind ----------
w6 = band(rng.standard_normal(N), 300, 2200) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * t) ** 2) * env_seg(STARTS[5] - 0.3, STARTS[6] + 0.3, 1.0, 0.8)
add(w6, gain=0.07)

# ---------- scene 7: ocean swell ----------
sea = band(rng.standard_normal(N), 80, 1200) * (0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.16 * t)) ** 2) * env_seg(STARTS[6] - 0.3, STARTS[7] + 0.3, 1.0, 0.8)
add(sea, gain=0.16)

# ---------- scene 8: rocket ----------
ign, lift = STARTS[7] + 1.0, STARTS[7] + 2.4
rumble = band(rng.standard_normal(N), 20, 260) * np.clip((t - ign) / 1.6, 0, 1) ** 1.5 * env_seg(ign, STARTS[8] + 0.6, 0.05, 0.9)
rumble *= 1 + 0.5 * band(rng.standard_normal(N), 4, 25) * 8
add(rumble, gain=0.9)
crackle = band(rng.standard_normal(N), 900, 5000) * (rng.random(N) < 0.02) * np.clip((t - lift) / 1.0, 0, 1) * env_seg(lift, STARTS[8] + 0.2, 0.3, 0.6)
add(crackle, gain=0.5)

# ---------- transitions: whoosh into each cut + soft low hit ----------
for c in STARTS[1:]:
    n = int(1.0 * SR); tt = np.arange(n) / SR
    wh = band(rng.standard_normal(n), 400, 5000) * (tt / 1.0) ** 3 * np.exp(-np.clip(tt - 0.85, 0, None) * 30)
    add(wh, start=c - 0.85, gain=0.12)
    add(tone(1.2, 62, 4, 44), start=c, gain=0.35)

# ---------- master ----------
mix = np.stack([L, R], 1)
mix *= np.clip(t / 0.4, 0, 1)[:, None] * np.clip((TOTAL - t) / 1.5, 0, 1)[:, None]
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
mix /= np.max(np.abs(mix)) / 0.89
out = os.path.join(os.path.dirname(__file__), '..', 'media', 'soundtrack.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', os.path.abspath(out), f'{TOTAL:.1f}s')
