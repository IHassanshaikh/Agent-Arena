import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Canvas Configuration
WIDTH = 1920
HEIGHT = 1080
FPS = 30
OUTPUT_FILE = "AgentArena_Demo.mp4"

# Colors (Hex to BGR / RGB)
BG_DARK = (8, 10, 16)          # Pitch black-blue
CARD_BG = (15, 23, 42)
BORDER_COLOR = (38, 45, 62)
ACCENT_CYAN = (6, 182, 212)    # Cyan
ACCENT_GREEN = (16, 185, 129)  # Emerald
ACCENT_PURPLE = (168, 85, 247)
TEXT_WHITE = (255, 255, 255)
TEXT_MUTED = (148, 163, 184)
TEXT_DIM = (100, 116, 139)

# Load Fonts
FONT_TITLE_PATH = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_BODY_PATH = r"C:\Windows\Fonts\segoeui.ttf"
FONT_MONO_PATH = r"C:\Windows\Fonts\consolab.ttf"

font_huge = ImageFont.truetype(FONT_TITLE_PATH, 68)
font_large = ImageFont.truetype(FONT_TITLE_PATH, 44)
font_medium = ImageFont.truetype(FONT_BODY_PATH, 28)
font_sub = ImageFont.truetype(FONT_BODY_PATH, 22)
font_badge = ImageFont.truetype(FONT_MONO_PATH, 18)
font_mono = ImageFont.truetype(FONT_MONO_PATH, 24)

# Load screenshot images
raw_dir = "video_frames_raw"
img_topo = Image.open(os.path.join(raw_dir, "02_topology.png")).convert("RGB") if os.path.exists(os.path.join(raw_dir, "02_topology.png")) else None
img_split = Image.open(os.path.join(raw_dir, "03_split.png")).convert("RGB") if os.path.exists(os.path.join(raw_dir, "03_split.png")) else None
img_result = Image.open(os.path.join(raw_dir, "04_result.png")).convert("RGB") if os.path.exists(os.path.join(raw_dir, "04_result.png")) else None
img_timeline = Image.open(os.path.join(raw_dir, "05_timeline.png")).convert("RGB") if os.path.exists(os.path.join(raw_dir, "05_timeline.png")) else None
img_compare = Image.open(os.path.join(raw_dir, "06_compare.png")).convert("RGB") if os.path.exists(os.path.join(raw_dir, "06_compare.png")) else None

scenes = [
    {
        "id": "intro",
        "duration_sec": 7,
        "type": "title",
        "tag": "GEEK ROOM AI GLOBAL HACKATHON 2026",
        "title": "AgentArena",
        "subtitle": "Flight Recorder & Benchmark Arena for Autonomous AI Agents",
        "caption": "Live Execution Traces • Real-Time DAG Topology • Automated Failover & Recovery"
    },
    {
        "id": "problem",
        "duration_sec": 8,
        "type": "graphic_problem",
        "tag": "THE CRITICAL PROBLEM",
        "title": "The AI Agent Black Box Dilemma",
        "subtitle": "Agents execute recursive multi-step tool calls in opaque loops.",
        "caption": "Silent failures, unbounded token consumption, and hallucinated tool calls happen with zero observability."
    },
    {
        "id": "topology",
        "duration_sec": 12,
        "type": "screenshot",
        "image": img_topo,
        "tag": "LIVE TOPOLOGY GRAPH",
        "title": "Interactive Execution Flight Recorder",
        "subtitle": "Full DAG visualization: User Task ➔ Planner ➔ Gemini 2.5 Flash ➔ Tools ➔ Artifact.",
        "caption": "Real-time streaming telemetry captures every tool call, latency spike, and recovery attempt via SSE."
    },
    {
        "id": "timeline",
        "duration_sec": 10,
        "type": "screenshot",
        "image": img_timeline,
        "tag": "DEEP TELEMETRY & RECOVERY",
        "title": "Granular Step-by-Step Trace & Failover",
        "subtitle": "Live event timeline with sub-second latencies and token usage breakdowns.",
        "caption": "When a tool fails or hits a rate limit, AgentArena logs the retry recovery attempt and preserves execution integrity."
    },
    {
        "id": "split",
        "duration_sec": 12,
        "type": "screenshot",
        "image": img_split,
        "tag": "DUAL-PANE SANDBOX",
        "title": "Split-View Code & Live Artifact Preview",
        "subtitle": "Inspect generated code and rendered artifacts side-by-side in real time.",
        "caption": "Engineers can verify HTML, CSS, JavaScript, and Markdown artifacts in an isolated live browser sandbox."
    },
    {
        "id": "compare",
        "duration_sec": 11,
        "type": "screenshot",
        "image": img_compare,
        "tag": "BENCHMARK ARENA",
        "title": "Head-to-Head Agent & Model Evaluation",
        "subtitle": "Compare agent architectures on speed, token efficiency, cost, and reliability.",
        "caption": "Transparent scoring matrix with automated winner calculation and comparative performance charts."
    },
    {
        "id": "outro",
        "duration_sec": 8,
        "type": "outro",
        "tag": "OPEN SOURCE & EXTENSIBLE",
        "title": "AgentArena: Ship Reliable AI Agents",
        "subtitle": "Next.js 14 • React Flow • FastAPI • Gemini 2.5 Flash • PGlite Serverless DB",
        "caption": "Explore on GitHub: https://github.com/IHassanshaikh/Agent-Arena"
    }
]

total_duration = sum(s["duration_sec"] for s in scenes)
total_frames = total_duration * FPS
print(f"Total video duration: {total_duration}s ({total_frames} frames at {FPS} FPS)")

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(OUTPUT_FILE, fourcc, FPS, (WIDTH, HEIGHT))

def draw_top_bar(draw, current_scene_idx, progress_pct):
    # Top progress line
    draw.rectangle([0, 0, WIDTH, 3], fill=(30, 41, 59))
    draw.rectangle([0, 0, int(WIDTH * progress_pct), 3], fill=ACCENT_CYAN)
    
    # Header badge
    draw.text((40, 24), "● AGENTARENA // FLIGHT RECORDER", fill=ACCENT_GREEN, font=font_badge)
    draw.text((WIDTH - 360, 24), "LIVE TELEMETRY STREAMING", fill=TEXT_MUTED, font=font_badge)

def draw_lower_third(draw, scene, progress_in_scene):
    # Fade in lower third
    alpha = min(1.0, progress_in_scene * 3.0)
    
    # Lower third container
    y_card = HEIGHT - 180
    draw.rectangle([40, y_card, WIDTH - 40, HEIGHT - 30], fill=(10, 14, 22))
    draw.rectangle([40, y_card, WIDTH - 40, HEIGHT - 30], outline=BORDER_COLOR, width=1)
    # Accent indicator on left
    draw.rectangle([40, y_card, 46, HEIGHT - 30], fill=ACCENT_CYAN)
    
    # Tag
    draw.text((64, y_card + 16), scene["tag"], fill=ACCENT_CYAN, font=font_badge)
    # Title
    draw.text((64, y_card + 42), scene["title"], fill=TEXT_WHITE, font=font_large)
    # Subtitle / Caption
    draw.text((64, y_card + 92), scene["subtitle"], fill=TEXT_MUTED, font=font_sub)
    draw.text((64, y_card + 120), scene["caption"], fill=ACCENT_GREEN, font=font_sub)

def render_title_frame(scene, t_scene, dur_scene):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    # Subtle grid dots
    for x in range(60, WIDTH, 80):
        for y in range(60, HEIGHT, 80):
            draw.point((x, y), fill=(25, 35, 50))
            
    # Center Card
    cx, cy = WIDTH // 2, HEIGHT // 2 - 30
    
    # Pulsing glow ring
    pulse = int(12 * np.sin(t_scene * 3.0))
    draw.rounded_rectangle([cx - 480 - pulse, cy - 200 - pulse, cx + 480 + pulse, cy + 200 + pulse], radius=24, outline=(20, 35, 55), width=2)
    draw.rounded_rectangle([cx - 460, cy - 180, cx + 460, cy + 180], radius=20, fill=(13, 18, 30), outline=(40, 55, 80), width=1)
    
    # Badges
    tag_text = scene["tag"]
    draw.text((cx - 240, cy - 140), tag_text, fill=ACCENT_CYAN, font=font_badge)
    
    # Main Title
    title_text = scene["title"]
    draw.text((cx - 210, cy - 90), title_text, fill=TEXT_WHITE, font=font_huge)
    
    # Accent Underline
    draw.line([(cx - 210, cy - 10), (cx + 210, cy - 10)], fill=ACCENT_GREEN, width=4)
    
    # Subtitle
    sub_lines = [
        "Live Execution Traces & Benchmark Flight Recorder",
        "for Autonomous AI Agents & Multi-Step LLM Graphs"
    ]
    draw.text((cx - 360, cy + 20), sub_lines[0], fill=TEXT_WHITE, font=font_medium)
    draw.text((cx - 360, cy + 60), sub_lines[1], fill=TEXT_MUTED, font=font_medium)
    
    # Feature Badges
    pills = ["Real-time DAG Flow", "SSE Telemetry", "Dual Split Sandbox", "Automated Failover"]
    px = cx - 400
    for pill in pills:
        draw.rounded_rectangle([px, cy + 120, px + 190, cy + 155], radius=8, fill=(20, 30, 48), outline=BORDER_COLOR)
        draw.text((px + 12, cy + 128), pill, fill=ACCENT_CYAN, font=font_badge)
        px += 205
        
    return img

def render_problem_frame(scene, t_scene, dur_scene):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    # Top Section
    draw.text((80, 80), "THE OBSERVABILITY GAP IN AI AGENTS", fill=ACCENT_CYAN, font=font_badge)
    draw.text((80, 110), "Why Developers Are Blind to Agent Failures", fill=TEXT_WHITE, font=font_huge)
    
    # Two Columns Comparison
    col_w = 840
    col_h = 580
    top_y = 220
    
    # Left Column: The Problem (Red / Dark)
    left_x = 80
    draw.rounded_rectangle([left_x, top_y, left_x + col_w, top_y + col_h], radius=16, fill=(18, 14, 18), outline=(80, 30, 40), width=1)
    draw.rectangle([left_x, top_y, left_x + col_w, top_y + 60], fill=(35, 18, 24))
    draw.text((left_x + 30, top_y + 18), "✕ WITHOUT AGENTARENA : THE BLACK BOX", fill=(244, 63, 94), font=font_large)
    
    problems = [
        ("Silent Failures", "Agent enters an infinite retry loop; crashes silently without alerts."),
        ("Unbounded Token Waste", "Opaque recursive calls consume thousands of dollars in LLM API credits."),
        ("Opaque Tool Hallucinations", "Model calls nonexistent tools ('no_verification') with zero runtime schema enforcement."),
        ("No Ground-Truth Verification", "Developers can't inspect what the agent actually built until the run terminates.")
    ]
    
    py = top_y + 90
    for p_title, p_desc in problems:
        draw.ellipse([left_x + 30, py + 6, left_x + 44, py + 20], fill=(244, 63, 94))
        draw.text((left_x + 60, py), p_title, fill=TEXT_WHITE, font=font_medium)
        draw.text((left_x + 60, py + 34), p_desc, fill=TEXT_MUTED, font=font_sub)
        py += 110
        
    # Right Column: The Solution (Emerald / Dark)
    right_x = left_x + col_w + 80
    draw.rounded_rectangle([right_x, top_y, right_x + col_w, top_y + col_h], radius=16, fill=(12, 22, 24), outline=(20, 80, 60), width=1)
    draw.rectangle([right_x, top_y, right_x + col_w, top_y + 60], fill=(16, 40, 36))
    draw.text((right_x + 30, top_y + 18), "✓ WITH AGENTARENA : REAL-TIME FLIGHT RECORDER", fill=ACCENT_GREEN, font=font_large)
    
    solutions = [
        ("Live DAG Topology Graph", "Interactive nodes visualize User Task ➔ Planner ➔ Gateway ➔ Tools in real time."),
        ("Sub-second Telemetry (SSE)", "Streaming event engine monitors duration, token counts, and cost per second."),
        ("Intelligent Retry Recovery", "Interception layer catches bad tool calls and heals execution traces automatically."),
        ("Live Split-View Sandbox", "Dual pane inspects raw generated code side-by-side with rendered live preview.")
    ]
    
    sy = top_y + 90
    for s_title, s_desc in solutions:
        draw.ellipse([right_x + 30, sy + 6, right_x + 44, sy + 20], fill=ACCENT_GREEN)
        draw.text((right_x + 60, sy), s_title, fill=TEXT_WHITE, font=font_medium)
        draw.text((right_x + 60, sy + 34), s_desc, fill=TEXT_MUTED, font=font_sub)
        sy += 110
        
    # Animated scan line
    scan_y = int(top_y + (t_scene / dur_scene) * col_h)
    draw.line([(right_x, scan_y), (right_x + col_w, scan_y)], fill=(6, 182, 212, 100), width=2)
    
    return img

def render_screenshot_frame(scene, t_scene, dur_scene):
    # Ken Burns pan/zoom effect
    base_img = scene["image"]
    if base_img is None:
        return render_title_frame(scene, t_scene, dur_scene)
        
    progress = t_scene / dur_scene
    zoom = 1.0 + 0.08 * np.sin(progress * np.pi) # Smooth subtle zoom
    
    # Calculate crop
    w_crop = int(WIDTH / zoom)
    h_crop = int(HEIGHT / zoom)
    
    # Slight pan
    pan_x = int(50 * np.sin(progress * 2.0))
    pan_y = int(30 * np.cos(progress * 2.0))
    
    x1 = max(0, min(base_img.width - w_crop, (base_img.width - w_crop) // 2 + pan_x))
    y1 = max(0, min(base_img.height - h_crop, (base_img.height - h_crop) // 2 + pan_y))
    
    cropped = base_img.crop((x1, y1, x1 + w_crop, y1 + h_crop))
    frame = cropped.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
    
    draw = ImageDraw.Draw(frame)
    
    # Vignette darkening at bottom for lower-third legibility
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vignette)
    v_draw.rectangle([0, HEIGHT - 220, WIDTH, HEIGHT], fill=(5, 8, 15, 230))
    frame.paste(vignette, (0, 0), vignette)
    
    return frame

def render_outro_frame(scene, t_scene, dur_scene):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    cx, cy = WIDTH // 2, HEIGHT // 2 - 40
    
    # Badge
    draw.text((cx - 260, cy - 180), "BUILT FOR GEEK ROOM AI GLOBAL HACKATHON", fill=ACCENT_GREEN, font=font_badge)
    
    # Title
    draw.text((cx - 230, cy - 130), "AgentArena", fill=TEXT_WHITE, font=font_huge)
    draw.text((cx - 380, cy - 50), "Empowering Autonomous Agents With Developer-Grade Observability", fill=ACCENT_CYAN, font=font_large)
    
    # Tech Specs Box
    draw.rounded_rectangle([cx - 450, cy + 30, cx + 450, cy + 180], radius=16, fill=(15, 22, 36), outline=BORDER_COLOR)
    
    specs = [
        ("Architecture", "Next.js 14 App Router + FastAPI Backend"),
        ("Orchestration", "LangGraph-Style State Machine & DAG Flow"),
        ("Model Gateway", "Gemini 2.5 Flash + Claude 3.5 Sonnet Support"),
        ("Database & Stream", "PGlite Serverless DB + Server-Sent Events (SSE)"),
        ("GitHub Repository", "https://github.com/IHassanshaikh/Agent-Arena")
    ]
    
    sy = cy + 45
    for k, v in specs:
        draw.text((cx - 420, sy), k + ":", fill=ACCENT_CYAN, font=font_badge)
        draw.text((cx - 180, sy), v, fill=TEXT_WHITE, font=font_badge)
        sy += 25
        
    draw.text((cx - 280, cy + 220), "Ready to Deploy. Open Source. MIT Licensed.", fill=TEXT_MUTED, font=font_sub)
    
    return img

print("Starting video frame rendering...")
global_frame = 0

for s_idx, scene in enumerate(scenes):
    dur = scene["duration_sec"]
    f_count = dur * FPS
    print(f"Rendering scene {s_idx + 1}/{len(scenes)}: {scene['title']} ({f_count} frames)")
    
    for f in range(f_count):
        t_scene = f / FPS
        progress_in_scene = f / f_count
        progress_total = global_frame / total_frames
        
        # Render base frame
        if scene["type"] == "title":
            frame_img = render_title_frame(scene, t_scene, dur)
        elif scene["type"] == "graphic_problem":
            frame_img = render_problem_frame(scene, t_scene, dur)
        elif scene["type"] == "screenshot":
            frame_img = render_screenshot_frame(scene, t_scene, dur)
        elif scene["type"] == "outro":
            frame_img = render_outro_frame(scene, t_scene, dur)
            
        draw = ImageDraw.Draw(frame_img)
        
        # Draw Top Navigation & Progress Bar
        draw_top_bar(draw, s_idx, progress_total)
        
        # Draw Lower-Third Narration Box (except on title and outro)
        if scene["type"] in ["screenshot"]:
            draw_lower_third(draw, scene, progress_in_scene)
            
        # Convert PIL Image to OpenCV BGR numpy array
        frame_cv = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGB2BGR)
        out.write(frame_cv)
        global_frame += 1

out.release()
print(f"Video rendering complete! File saved as: {OUTPUT_FILE}")
print(f"File size: {os.path.getsize(OUTPUT_FILE)} bytes")
