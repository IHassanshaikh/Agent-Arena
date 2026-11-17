#!/usr/bin/env python3
"""
AgentArena Pitch Deck Generator
Creates an executive, high-contrast, 16:9 widescreen presentation deck
matching the solid MVP design system of AgentArena.
"""

import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path="AgentArena_Hackathon_Pitch.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Solid MVP Color Palette
    COLOR_BG = RGBColor(9, 9, 11)              # #09090b Pure dark canvas
    COLOR_CARD = RGBColor(17, 17, 20)          # #111114 Solid panel
    COLOR_CARD_INNER = RGBColor(24, 24, 27)    # #18181b Card surface
    COLOR_BORDER = RGBColor(39, 39, 42)        # #27272a Crisp 1px border
    COLOR_TEXT_PRIMARY = RGBColor(250, 250, 250) # #fafafa High contrast
    COLOR_TEXT_MUTED = RGBColor(161, 161, 170)   # #a1a1aa Secondary text
    COLOR_TEXT_SUB = RGBColor(113, 113, 122)     # #71717a Muted labels

    COLOR_BLUE = RGBColor(37, 99, 235)         # #2563eb Primary brand blue
    COLOR_SKY = RGBColor(56, 189, 248)         # #38bdf8 Accent sky
    COLOR_GREEN = RGBColor(16, 185, 129)       # #10b981 Emerald success
    COLOR_AMBER = RGBColor(245, 158, 11)       # #f59e0b Amber warning/retry
    COLOR_ROSE = RGBColor(239, 68, 68)         # #ef4444 Error red
    COLOR_INDIGO = RGBColor(99, 102, 241)      # #6366f1 LLM purple

    FONT_BODY = "Segoe UI"
    FONT_MONO = "Consolas"

    LIVE_URL = "https://agent-arena-benchmark.vercel.app/"
    REPO_URL = "https://github.com/IHassanshaikh/Agent-Arena"

    def set_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, title, category="AGENTARENA • FLIGHT RECORDER"):
        # Category tracking pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(11.7), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_right = tf_cat.margin_top = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.name = FONT_MONO
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_SKY

        # Slide Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.7), Inches(0.75))
        tf = title_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_BODY
        p.font.size = Pt(25)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY

    def add_card(slide, x, y, w, h, accent_color=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        # Top accent indicator strip
        if accent_color:
            accent_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, Inches(0.06))
            accent_bar.fill.solid()
            accent_bar.fill.fore_color.rgb = accent_color
            accent_bar.line.fill.background()

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.28)
        tf.margin_right = Inches(0.28)
        tf.margin_top = Inches(0.28)
        tf.margin_bottom = Inches(0.25)
        return card, tf

    # ==========================================================
    # SLIDE 1: Title Slide (Executive Hero)
    # ==========================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide1)

    # Top Brand Status Badge
    badge = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.1), Inches(3.8), Inches(0.42))
    badge.fill.solid()
    badge.fill.fore_color.rgb = COLOR_CARD
    badge.line.color.rgb = COLOR_GREEN
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    tf_b.margin_top = Inches(0.08)
    p_b = tf_b.paragraphs[0]
    p_b.text = "● LIVE AGENT OBSERVABILITY & BENCHMARKS"
    p_b.font.name = FONT_MONO
    p_b.font.size = Pt(10)
    p_b.font.bold = True
    p_b.font.color.rgb = COLOR_GREEN
    p_b.alignment = PP_ALIGN.CENTER

    # Hero Title Box
    hero_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.75), Inches(11.7), Inches(3.2))
    tf_hero = hero_box.text_frame
    tf_hero.word_wrap = True
    tf_hero.margin_left = tf_hero.margin_right = tf_hero.margin_top = tf_hero.margin_bottom = 0

    p1 = tf_hero.paragraphs[0]
    p1.text = "AgentArena"
    p1.font.name = FONT_BODY
    p1.font.size = Pt(54)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TEXT_PRIMARY

    p2 = tf_hero.add_paragraph()
    p2.text = "Live Execution Traces & Benchmark Flight Recorder for Autonomous AI Agents"
    p2.font.name = FONT_BODY
    p2.font.size = Pt(21)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_SKY
    p2.space_before = Pt(8)

    p3 = tf_hero.add_paragraph()
    p3.text = "AI agents fail silently in non-deterministic black boxes. AgentArena delivers real-time DAG execution topology, zero-gap trace streaming, self-healing retry recovery, and instant sandboxed artifact previews."
    p3.font.name = FONT_BODY
    p3.font.size = Pt(13)
    p3.font.color.rgb = COLOR_TEXT_MUTED
    p3.space_before = Pt(12)

    # Live Production Deployment Callout Bar
    live_banner = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.7), Inches(11.7), Inches(0.65))
    live_banner.fill.solid()
    live_banner.fill.fore_color.rgb = RGBColor(16, 26, 38)
    live_banner.line.color.rgb = COLOR_BLUE
    live_banner.line.width = Pt(1)
    tf_lb = live_banner.text_frame
    tf_lb.margin_left = Inches(0.25)
    tf_lb.margin_top = Inches(0.12)
    p_lb = tf_lb.paragraphs[0]
    p_lb.text = f"⚡ LIVE PRODUCTION APP: {LIVE_URL}   •   📦 GITHUB: {REPO_URL}"
    p_lb.font.name = FONT_MONO
    p_lb.font.size = Pt(11)
    p_lb.font.bold = True
    p_lb.font.color.rgb = COLOR_SKY

    # Footer Card with Capabilities
    foot_card, tf_fc = add_card(slide1, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.3))
    p_fc = tf_fc.paragraphs[0]
    p_fc.text = "KEY PLATFORM CAPABILITIES"
    p_fc.font.name = FONT_MONO
    p_fc.font.size = Pt(10)
    p_fc.font.bold = True
    p_fc.font.color.rgb = COLOR_TEXT_SUB

    p_fc2 = tf_fc.add_paragraph()
    p_fc2.text = "• Interactive DAG Topology    • Latency Waterfall (Gantt)    • Sandboxed Result Preview    • Embedded PGlite Database"
    p_fc2.font.name = FONT_BODY
    p_fc2.font.size = Pt(13)
    p_fc2.font.bold = True
    p_fc2.font.color.rgb = COLOR_TEXT_PRIMARY
    p_fc2.space_before = Pt(6)

    # ==========================================================
    # SLIDE 2: The Problem: The Agent Black Box Crisis
    # ==========================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide2)
    add_header(slide2, "The Problem: Autonomous Agent Black Box Crisis", "INDUSTRY PAIN POINT")

    cards_data_2 = [
        ("01. Silent Execution Failures",
         "Autonomous agents execute multi-step reasoning, external tool calls, and syntax validators. When models hallucinate tool arguments or loop endlessly, developers only see a generic failure with zero debugging visibility.",
         COLOR_ROSE),
        ("02. Traditional APM Doesn't Fit",
         "Datadog, New Relic, and Prometheus were built for stateless REST microservices. They cannot visualize non-deterministic DAG graphs, recursive planner retries, or LLM token latencies.",
         COLOR_AMBER),
        ("03. Cost & Latency Blindness",
         "Runaway retries and prompt bloat consume thousands of tokens in seconds. Developers lack real-time comparative flight recorders to measure token efficiency, latency deltas, and failure rates.",
         COLOR_BLUE)
    ]

    for i, (title, desc, accent) in enumerate(cards_data_2):
        x = Inches(0.8 + i * 3.95)
        _, tf = add_card(slide2, x, Inches(1.85), Inches(3.75), Inches(5.0), accent)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(14)

    # ==========================================================
    # SLIDE 3: The Solution: AgentArena Flight Recorder
    # ==========================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide3)
    add_header(slide3, "The Solution: Real-Time Observability & Flight Recorder", "INNOVATION & VALUE PROPOSITION")

    cards_data_3 = [
        ("Live Execution DAG Topology",
         "Interactive real-time graph visualization tracing the prompt directly through Agent Reasoning, Model Gateway, Tool Calls, and Verified Artifacts with sub-millisecond Socket.IO telemetry.",
         COLOR_BLUE),
        ("Instant Sandboxed Result Preview",
         "Direct split-screen inspection of the agent's output: live interactive sandboxed HTML rendering (Desktop/Tablet/Mobile), formatted Markdown documents, and raw source code.",
         COLOR_GREEN),
        ("Zero-Docker Embedded Database",
         "Embedded SQL database powered by @electric-sql/pglite. Runs entirely in-process on local disk with zero external Docker or cloud database setup needed.",
         COLOR_INDIGO),
        ("Automated Self-Healing Telemetry",
         "Captures transient timeouts, maps retries and backoff attempts, and validates syntax autonomously with Google Gemini 2.5 Flash live API integration.",
         COLOR_AMBER)
    ]

    for i, (title, desc, accent) in enumerate(cards_data_3):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.85 + row * 2.55)

        _, tf = add_card(slide3, x, y, Inches(5.75), Inches(2.35), accent)

        p_t = tf.paragraphs[0]
        p_t.text = f"✓  {title}"
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(8)

    # ==========================================================
    # SLIDE 4: Architecture & Data Flow
    # ==========================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide4)
    add_header(slide4, "End-to-End System Architecture", "TECHNICAL ARCHITECTURE")

    arch_steps = [
        ("1. AGENT RUNNER", "services/agent-runner",
         "Autonomous Python runner integrated with Gemini 2.5 Flash live API. Generates full code, HTML pages, and documents with tool dispatching.",
         COLOR_BLUE),
        ("2. INGESTION ENGINE", "apps/api (Node/Express)",
         "Validates OpenTelemetry trace events with strict Zod contracts. Real-time broadcast over Socket.IO and recursive PII redaction pipeline.",
         COLOR_AMBER),
        ("3. EMBEDDED SQL", "@electric-sql/pglite",
         "Local embedded relational SQL database at apps/api/data/pgdata. Persists runs, trace envelopes, and benchmark metrics with zero Docker.",
         COLOR_GREEN),
        ("4. STUDIO DASHBOARD", "apps/web (Next.js 14)",
         "Solid MVP developer UI with ReactFlow DAG topology, waterfall Gantt execution spans, and live sandboxed iframe preview.",
         COLOR_INDIGO)
    ]

    for i, (title, subtitle, desc, accent) in enumerate(arch_steps):
        x = Inches(0.8 + i * 2.95)
        _, tf = add_card(slide4, x, Inches(1.85), Inches(2.8), Inches(5.0), accent)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.name = FONT_MONO
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_s = tf.add_paragraph()
        p_s.text = subtitle
        p_s.font.name = FONT_MONO
        p_s.font.size = Pt(9.5)
        p_s.font.color.rgb = COLOR_SKY
        p_s.space_before = Pt(3)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(12)

    # ==========================================================
    # SLIDE 5: Core Technical Innovations
    # ==========================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide5)
    add_header(slide5, "Key Technical Innovations & Competitive Edge", "ENGINEERING EXCELLENCE")

    innovations = [
        ("Live Gemini 2.5 Flash Telemetry",
         "Direct integration with Google's high-speed Gemini 2.5 Flash model. Produces complete responsive web applications and scripts with real-time token counts, latency breakdown, and cost estimation.",
         COLOR_BLUE),
        ("Split-Screen Telemetry & Sandboxing",
         "A unified dashboard combining deep systems observability with instant artifact preview. View the execution DAG graph on the left and the interactive live HTML website on the right simultaneously.",
         COLOR_GREEN),
        ("Self-Healing Retry Telemetry",
         "Captures transient timeout failures, tracks exponential backoffs, records syntax validation retries, and measures recovery deltas without breaking user flow.",
         COLOR_AMBER),
        ("Solid Developer-Grade UI Standards",
         "Engineered with solid high-contrast surfaces, zero AI visual fluff, tabular numerals, hairline borders, and sub-100ms interaction latency.",
         COLOR_INDIGO)
    ]

    for i, (title, desc, accent) in enumerate(innovations):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.85 + row * 2.55)

        _, tf = add_card(slide5, x, y, Inches(5.75), Inches(2.35), accent)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(8)

    # ==========================================================
    # SLIDE 6: Live Product Demo Walkthrough
    # ==========================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide6)
    add_header(slide6, "Live Product Walkthrough: Prompt to Verified Result", "PRODUCT WALKTHROUGH")

    # Banner linking to live site
    demo_banner = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.45), Inches(11.7), Inches(0.4))
    demo_banner.fill.solid()
    demo_banner.fill.fore_color.rgb = RGBColor(16, 26, 38)
    demo_banner.line.color.rgb = COLOR_BLUE
    demo_banner.line.width = Pt(1)
    tf_db = demo_banner.text_frame
    tf_db.margin_left = Inches(0.2)
    tf_db.margin_top = Inches(0.06)
    p_db = tf_db.paragraphs[0]
    p_db.text = f"🌐 INTERACTIVE DEMO AVAILABLE LIVE: {LIVE_URL}"
    p_db.font.name = FONT_MONO
    p_db.font.size = Pt(10)
    p_db.font.bold = True
    p_db.font.color.rgb = COLOR_SKY

    steps_6 = [
        ("Step 1: Enter Prompt",
         "Type any user instruction in the top command bar or choose benchmark presets: 'Build a dark-mode landing page', 'Make a game', or 'Fix login auth bug'.",
         "01", COLOR_BLUE),
        ("Step 2: Planning & Tools",
         "Gemini 2.5 Flash formulates execution plans, selects tools (write_html_page, validate_html), and calculates token allocations.",
         "02", COLOR_INDIGO),
        ("Step 3: Real-Time DAG",
         "Real-time visual node graph streams on canvas: Prompt → Agent → Model Gateway → Tool Operations → Verified Artifact.",
         "03", COLOR_AMBER),
        ("Step 4: Live Inspection",
         "Click 'Result' or switch to Split View: test the live website directly inside the sandboxed iframe, view source code, or download artifacts.",
         "04", COLOR_GREEN)
    ]

    for i, (title, desc, num, accent) in enumerate(steps_6):
        x = Inches(0.8 + i * 2.95)
        _, tf = add_card(slide6, x, Inches(2.0), Inches(2.8), Inches(4.85), accent)

        p_n = tf.paragraphs[0]
        p_n.text = num
        p_n.font.name = FONT_MONO
        p_n.font.size = Pt(26)
        p_n.font.bold = True
        p_n.font.color.rgb = accent

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_TEXT_PRIMARY
        p_t.space_before = Pt(6)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(10)

    # ==========================================================
    # SLIDE 7: Benchmark & A/B Comparison Flight Recorder
    # ==========================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide7)
    add_header(slide7, "A/B Benchmark Flight Recorder: Model vs Model", "COMPARATIVE OBSERVABILITY")

    _, tf_c1 = add_card(slide7, Inches(0.8), Inches(1.85), Inches(5.75), Inches(5.0), COLOR_BLUE)
    p_c1_t = tf_c1.paragraphs[0]
    p_c1_t.text = "Flight Telemetry Metrics"
    p_c1_t.font.name = FONT_BODY
    p_c1_t.font.size = Pt(17)
    p_c1_t.font.bold = True
    p_c1_t.font.color.rgb = COLOR_SKY

    metrics_text = [
        ("Token Efficiency", "Tracks prompt vs completion token consumption and cost down to $0.0001 precision."),
        ("Latency Waterfall", "Detailed Gantt charts dissecting inference time vs tool execution duration."),
        ("Retry Recovery", "Automated scoring of agent resiliency when third-party tools fail or time out."),
        ("Deterministic Replay", "Step-by-step event replay matching timestamps and exact payload diffs.")
    ]
    for label, desc in metrics_text:
        p_m = tf_c1.add_paragraph()
        p_m.text = f"•  {label}: {desc}"
        p_m.font.name = FONT_BODY
        p_m.font.size = Pt(11.5)
        p_m.font.color.rgb = COLOR_TEXT_MUTED
        p_m.space_before = Pt(10)

    _, tf_c2 = add_card(slide7, Inches(6.75), Inches(1.85), Inches(5.75), Inches(5.0), COLOR_GREEN)
    p_c2_t = tf_c2.paragraphs[0]
    p_c2_t.text = "Comparative Run Analysis"
    p_c2_t.font.name = FONT_BODY
    p_c2_t.font.size = Pt(17)
    p_c2_t.font.bold = True
    p_c2_t.font.color.rgb = COLOR_GREEN

    analysis_points = [
        ("Head-to-Head Benchmarks", "Compare Agent Alpha (Resilient) vs Agent Beta on identical tasks."),
        ("Automated Winner Scoring", "Calculates optimal tradeoffs between accuracy, speed, and token cost."),
        ("Regression Detection", "Identify prompt degradations and breaking schema changes before production."),
        ("JSON Trace Export", "Full trace export to standard JSON format for team sharing and postmortems.")
    ]
    for label, desc in analysis_points:
        p_a = tf_c2.add_paragraph()
        p_a.text = f"•  {label}: {desc}"
        p_a.font.name = FONT_BODY
        p_a.font.size = Pt(11.5)
        p_a.font.color.rgb = COLOR_TEXT_MUTED
        p_a.space_before = Pt(10)

    # ==========================================================
    # SLIDE 8: Market Opportunity & Target Audience
    # ==========================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide8)
    add_header(slide8, "Market Opportunity & Target Audience", "MARKET POTENTIAL")

    market_cards = [
        ("Autonomous Agent Developers",
         "Developers building multi-agent workflows with LangChain, LangGraph, CrewAI, AutoGen, and custom LLM tool pipelines who lack dedicated visual tracing.",
         COLOR_BLUE),
        ("Enterprise AI Teams",
         "Engineering organizations deploying autonomous code generation, customer service agents, and automated research workflows requiring auditability and cost governance.",
         COLOR_GREEN),
        ("$4.8B Observability Market",
         "The AI observability and evaluation market is accelerating at 38% CAGR as companies transition from simple prompt-response chat to multi-step agentic systems.",
         COLOR_AMBER)
    ]

    for i, (title, desc, accent) in enumerate(market_cards):
        x = Inches(0.8 + i * 3.95)
        _, tf = add_card(slide8, x, Inches(1.85), Inches(3.75), Inches(5.0), accent)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(14)

    # ==========================================================
    # SLIDE 9: Roadmap & Future Vision
    # ==========================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide9)
    add_header(slide9, "Future Roadmap & Technical Evolution", "LOOKING AHEAD")

    roadmap = [
        ("Phase 1: Now (Hackathon Ready)",
         "• Live Gemini 2.5 Flash API autonomous execution\n• Dynamic DAG workflow topology streaming\n• Embedded SQL database with zero external setup\n• Live sandboxed HTML/code artifact preview\n• Deployed on Vercel at production URL",
         COLOR_GREEN),
        ("Phase 2: Swarm & OpenTelemetry",
         "• Multi-agent swarm topology visualization (10+ agents)\n• OpenTelemetry standard OTLP export\n• Direct Langfuse and Arize Phoenix interoperability\n• Automated cost ceiling circuit breakers",
         COLOR_BLUE),
        ("Phase 3: Autonomous Optimization",
         "• AI-driven prompt refactoring to minimize token spend\n• Self-healing tool contracts with automatic retry tuning\n• Enterprise role-based access control and team workspaces",
         COLOR_AMBER)
    ]

    for i, (title, desc, accent) in enumerate(roadmap):
        x = Inches(0.8 + i * 3.95)
        _, tf = add_card(slide9, x, Inches(1.85), Inches(3.75), Inches(5.0), accent)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.name = FONT_BODY
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(11.5)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(14)

    # ==========================================================
    # SLIDE 10: Conclusion & Call to Action (High-Impact Finish)
    # ==========================================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide10)

    cta_card, tf_cta = add_card(slide10, Inches(0.8), Inches(1.0), Inches(11.7), Inches(5.6), COLOR_BLUE)

    p_c1 = tf_cta.paragraphs[0]
    p_c1.text = "AgentArena: The Future of Agent Observability"
    p_c1.font.name = FONT_BODY
    p_c1.font.size = Pt(32)
    p_c1.font.bold = True
    p_c1.font.color.rgb = COLOR_TEXT_PRIMARY

    p_c2 = tf_cta.add_paragraph()
    p_c2.text = "Don't let autonomous agents remain black boxes. Debug, benchmark, and visualize with flight-recorder precision."
    p_c2.font.name = FONT_BODY
    p_c2.font.size = Pt(16)
    p_c2.font.color.rgb = COLOR_SKY
    p_c2.space_before = Pt(10)

    # Sub-card inside slide 10 highlighting the live links
    link_box = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(2.8), Inches(10.9), Inches(3.3))
    link_box.fill.solid()
    link_box.fill.fore_color.rgb = COLOR_CARD_INNER
    link_box.line.color.rgb = COLOR_BORDER
    link_box.line.width = Pt(1)

    tf_lb2 = link_box.text_frame
    tf_lb2.word_wrap = True
    tf_lb2.margin_left = Inches(0.35)
    tf_lb2.margin_top = Inches(0.3)

    p_link_hdr = tf_lb2.paragraphs[0]
    p_link_hdr.text = "PRODUCTION ACCESS & PROJECT RESOURCES"
    p_link_hdr.font.name = FONT_MONO
    p_link_hdr.font.size = Pt(11)
    p_link_hdr.font.bold = True
    p_link_hdr.font.color.rgb = COLOR_GREEN

    links = [
        ("🌐 Live Production Web App", LIVE_URL),
        ("📦 GitHub Source Repository", REPO_URL),
        ("📡 Ingestion & Trace API", "http://localhost:4000 (Express + Socket.IO)"),
        ("🏆 Hackathon Track", "Geek Room AI Global Hackathon 2026")
    ]

    for title, url in links:
        p_l = tf_lb2.add_paragraph()
        p_l.text = f"{title}:  {url}"
        p_l.font.name = FONT_MONO
        p_l.font.size = Pt(12)
        p_l.font.bold = True
        p_l.font.color.rgb = COLOR_TEXT_PRIMARY if "https://" in url else COLOR_TEXT_MUTED
        p_l.space_before = Pt(10)

    prs.save(output_path)
    print(f"Presentation saved successfully to {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "AgentArena_Hackathon_Pitch.pptx"
    create_deck(out_file)
