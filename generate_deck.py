import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path):
    prs = Presentation()
    # 16:9 widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]

    # Color Palette: AgentArena Dark Theme
    COLOR_BG = RGBColor(9, 11, 16)          # #090b10 Pure dark
    COLOR_CARD = RGBColor(17, 20, 28)       # #11141c Card background
    COLOR_BORDER = RGBColor(38, 42, 54)     # #262a36 Subtle border
    COLOR_TEXT_PRIMARY = RGBColor(241, 245, 249) # #f1f5f9 Crisp white
    COLOR_TEXT_MUTED = RGBColor(148, 163, 184)   # #94a3b8 Slate text
    COLOR_ACCENT_BLUE = RGBColor(56, 189, 248)   # #38bdf8 Sky blue
    COLOR_ACCENT_GREEN = RGBColor(34, 197, 94)   # #22c55e Emerald
    COLOR_ACCENT_AMBER = RGBColor(245, 158, 11)  # #f59e0b Amber

    def set_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, title, category="AGENTARENA • HACKATHON PITCH DECK"):
        # Category tracking pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(10), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_ACCENT_BLUE

        # Slide Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.8))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY

    # ==========================================================
    # SLIDE 1: Title Slide (Dark, punchy hero)
    # ==========================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide1)

    # Accent badge
    badge = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(3.2), Inches(0.45))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(14, 40, 25)
    badge.line.color.rgb = COLOR_ACCENT_GREEN
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "● LIVE AGENT OBSERVABILITY"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = COLOR_ACCENT_GREEN
    p_b.alignment = PP_ALIGN.CENTER

    # Title & Subtitle
    hero_box = slide1.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.7), Inches(2.8))
    tf_hero = hero_box.text_frame
    tf_hero.word_wrap = True
    p1 = tf_hero.paragraphs[0]
    p1.text = "AgentArena"
    p1.font.size = Pt(56)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TEXT_PRIMARY

    p2 = tf_hero.add_paragraph()
    p2.text = "Live Execution Traces & Benchmark Flight Recorder for Autonomous AI Agents"
    p2.font.size = Pt(22)
    p2.font.color.rgb = COLOR_ACCENT_BLUE
    p2.space_before = Pt(12)

    p3 = tf_hero.add_paragraph()
    p3.text = "AI agents fail silently in black boxes. AgentArena provides real-time DAG execution topology, live sandboxed output preview, and comparative benchmark telemetry."
    p3.font.size = Pt(14)
    p3.font.color.rgb = COLOR_TEXT_MUTED
    p3.space_before = Pt(14)

    # Footer Card with Details
    foot_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.2))
    foot_card.fill.solid()
    foot_card.fill.fore_color.rgb = COLOR_CARD
    foot_card.line.color.rgb = COLOR_BORDER
    foot_card.line.width = Pt(1)
    tf_fc = foot_card.text_frame
    tf_fc.word_wrap = True
    p_fc = tf_fc.paragraphs[0]
    p_fc.text = "HACKATHON SUBMISSION • GEEK ROOM AI GLOBAL HACKATHON 2026"
    p_fc.font.size = Pt(10)
    p_fc.font.bold = True
    p_fc.font.color.rgb = COLOR_ACCENT_BLUE

    p_fc2 = tf_fc.add_paragraph()
    p_fc2.text = "Powered by Google Gemini 2.5 Flash • Next.js 14 Web Studio • Embedded SQL PGlite Database • OpenTelemetry Contract"
    p_fc2.font.size = Pt(12)
    p_fc2.font.color.rgb = COLOR_TEXT_PRIMARY
    p_fc2.space_before = Pt(6)

    # ==========================================================
    # SLIDE 2: The Problem: The Agent Black Box Crisis
    # ==========================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide2)
    add_header(slide2, "The Problem: The Autonomous Agent Black Box Crisis", "INDUSTRY CHALLENGE")

    cards_data_2 = [
        ("01. Silent Execution Failures", "Autonomous agents execute multi-step reasoning, external tool calls, and syntax validators. When models hallucinate tool arguments or loop endlessly, developers only see a generic failure with zero debugging visibility.", COLOR_ACCENT_BLUE),
        ("02. Traditional APM Doesn't Fit", "Datadog, New Relic, and Prometheus were built for stateless REST microservices. They cannot visualize non-deterministic DAG graphs, recursive planner retries, or LLM token latencies.", COLOR_ACCENT_AMBER),
        ("03. Cost & Latency Blindness", "Runaway retries and prompt bloat consume thousands of tokens in seconds. Developers lack real-time comparative flight recorders to measure token efficiency, latency deltas, and failure rates.", COLOR_ACCENT_GREEN)
    ]

    for i, (title, desc, accent) in enumerate(cards_data_2):
        x = Inches(0.8 + i * 3.95)
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.7))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.35)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(14)

    # ==========================================================
    # SLIDE 3: The Solution: AgentArena Flight Recorder
    # ==========================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide3)
    add_header(slide3, "The Solution: Real-Time Observability & Flight Recorder", "INNOVATION & VALUE PROPOSITION")

    cards_data_3 = [
        ("Live Execution DAG Topology", "Interactive real-time graph visualization tracing the prompt directly through Agent Reasoning, Model Gateway, Tool Calls, and Verified Artifacts with sub-millisecond Socket.IO telemetry.", COLOR_ACCENT_BLUE),
        ("Instant Sandboxed Result Preview", "Direct split-screen inspection of the agent's output: live interactive sandboxed HTML rendering (Desktop/Tablet/Mobile), formatted Markdown documents, and raw source code.", COLOR_ACCENT_GREEN),
        ("Zero-Docker Embedded Database", "Embedded SQL database powered by @electric-sql/pglite. Runs entirely in-process on local disk with zero external Docker or cloud database setup needed.", COLOR_ACCENT_BLUE),
        ("Automated Self-Healing & Telemetry", "Captures transient timeouts, maps retries and backoff attempts, and validates syntax autonomously with Google Gemini 2.5 Flash live API integration.", COLOR_ACCENT_AMBER)
    ]

    for i, (title, desc, accent) in enumerate(cards_data_3):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.9 + row * 2.55)

        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.3))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.25)

        p_t = tf.paragraphs[0]
        p_t.text = f"✓  {title}"
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(8)

    # ==========================================================
    # SLIDE 4: Architecture & Data Flow
    # ==========================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide4)
    add_header(slide4, "End-to-End System Architecture", "TECHNICAL STACK")

    arch_steps = [
        ("1. AGENT RUNNER", "services/agent-runner", "Autonomous Python runner integrated with Gemini 2.5 Flash live API. Generates full code, HTML pages, and documents with tool dispatching.", COLOR_ACCENT_BLUE),
        ("2. INGESTION ENGINE", "apps/api (Node/Express)", "Validates OpenTelemetry trace events with strict Zod contracts. Real-time broadcast over Socket.IO and PII redaction pipeline.", COLOR_ACCENT_AMBER),
        ("3. EMBEDDED SQL", "@electric-sql/pglite", "Local embedded relational SQL database at apps/api/data/pgdata. Persists runs, trace envelopes, and benchmark metrics with zero Docker.", COLOR_ACCENT_GREEN),
        ("4. STUDIO DASHBOARD", "apps/web (Next.js 14)", "Pure pitch-black developer UI with ReactFlow DAG topology, waterfall Gantt execution spans, and live sandboxed iframe preview.", COLOR_ACCENT_BLUE)
    ]

    for i, (title, subtitle, desc, accent) in enumerate(arch_steps):
        x = Inches(0.8 + i * 2.95)
        card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(2.8), Inches(4.7))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.3)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_s = tf.add_paragraph()
        p_s.text = subtitle
        p_s.font.size = Pt(10)
        p_s.font.color.rgb = COLOR_ACCENT_BLUE
        p_s.space_before = Pt(4)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(12)

    # ==========================================================
    # SLIDE 5: Core Technical Innovations
    # ==========================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide5)
    add_header(slide5, "Key Technical Innovations & Competitive Edge", "ENGINEERING EXCELLENCE")

    innovations = [
        ("Live Gemini 2.5 Flash Integration", "Direct integration with Google's newest high-speed Gemini 2.5 Flash model. Produces complete multi-kilobyte responsive web applications, scripts, and research documents on demand with real token telemetry.", COLOR_ACCENT_BLUE),
        ("Split-View Telemetry & Sandboxing", "A unified dashboard combining deep systems observability with instant artifact preview. View the execution DAG graph on the left and the interactive live HTML website on the right simultaneously.", COLOR_ACCENT_GREEN),
        ("Self-Healing Retry Telemetry", "Captures transient timeout failures, tracks exponential backoffs, records syntax validation retries, and measures recovery deltas without breaking user flow.", COLOR_ACCENT_AMBER),
        ("Unslopped Developer Craft", "Crafted using the unslop design standard: pure pitch-black #000000 background, zero marketing fluff, tabular numerals, hairline borders, and sub-100ms UI interaction latency.", COLOR_ACCENT_BLUE)
    ]

    for i, (title, desc, accent) in enumerate(innovations):
        row = i // 2
        col = i % 2
        x = Inches(0.8 + col * 5.95)
        y = Inches(1.9 + row * 2.55)

        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.75), Inches(2.3))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.25)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(8)

    # ==========================================================
    # SLIDE 6: Live Product Demo Walkthrough
    # ==========================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide6)
    add_header(slide6, "Live Product Demo: From Prompt to Verified Artifact", "HOW IT WORKS")

    steps_6 = [
        ("Step 1: Enter Any Prompt", "Type any user instruction in the top prompt bar: 'Build an HTML landing page for a dentist clinic', 'make a game', or 'explain quantum computing'.", "01"),
        ("Step 2: Autonomous Planning", "Gemini 2.5 Flash analyzes prompt semantics, selects tools (write_html_page, validate_html), and formulates execution plan with token metrics.", "02"),
        ("Step 3: Live DAG Topology", "Real-time visual node graph streams on canvas: Prompt → Agent → Model Gateway → Tool Operations → Verified Artifact with execution latencies.", "03"),
        ("Step 4: Interactive Inspection", "Click 'Result' or switch to Split View: test the live responsive website directly inside the sandboxed iframe, view source code, or download file.", "04")
    ]

    for i, (title, desc, num) in enumerate(steps_6):
        x = Inches(0.8 + i * 2.95)
        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(2.8), Inches(4.7))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.3)

        p_n = tf.paragraphs[0]
        p_n.text = num
        p_n.font.size = Pt(28)
        p_n.font.bold = True
        p_n.font.color.rgb = COLOR_ACCENT_BLUE

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_TEXT_PRIMARY
        p_t.space_before = Pt(8)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(10)

    # ==========================================================
    # SLIDE 7: Benchmark & A/B Comparison Flight Recorder
    # ==========================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide7)
    add_header(slide7, "A/B Benchmark Flight Recorder: Model vs Model", "COMPARATIVE OBSERVABILITY")

    comp_card1 = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.75), Inches(4.7))
    comp_card1.fill.solid()
    comp_card1.fill.fore_color.rgb = COLOR_CARD
    comp_card1.line.color.rgb = COLOR_BORDER
    comp_card1.line.width = Pt(1)
    tf_c1 = comp_card1.text_frame
    tf_c1.word_wrap = True
    tf_c1.margin_left = Inches(0.3)
    tf_c1.margin_top = Inches(0.3)

    p_c1_t = tf_c1.paragraphs[0]
    p_c1_t.text = "Flight Telemetry Metrics"
    p_c1_t.font.size = Pt(18)
    p_c1_t.font.bold = True
    p_c1_t.font.color.rgb = COLOR_ACCENT_BLUE

    metrics_text = [
        ("Token Efficiency", "Tracks input vs output token consumption and cost down to $0.0001."),
        ("Latency Waterfall", "Detailed Gantt charts dissecting inference time vs tool execution duration."),
        ("Retry Recovery", "Automated scoring of agent resiliency when third-party APIs fail or time out."),
        ("Deterministic Replay", "Step-by-step event replay matching timestamps and exact payload diffs.")
    ]
    for label, desc in metrics_text:
        p_m = tf_c1.add_paragraph()
        p_m.text = f"•  {label}: {desc}"
        p_m.font.size = Pt(12)
        p_m.font.color.rgb = COLOR_TEXT_MUTED
        p_m.space_before = Pt(10)

    comp_card2 = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.75), Inches(2.0), Inches(5.75), Inches(4.7))
    comp_card2.fill.solid()
    comp_card2.fill.fore_color.rgb = COLOR_CARD
    comp_card2.line.color.rgb = COLOR_BORDER
    comp_card2.line.width = Pt(1)
    tf_c2 = comp_card2.text_frame
    tf_c2.word_wrap = True
    tf_c2.margin_left = Inches(0.3)
    tf_c2.margin_top = Inches(0.3)

    p_c2_t = tf_c2.paragraphs[0]
    p_c2_t.text = "Comparative Run Analysis"
    p_c2_t.font.size = Pt(18)
    p_c2_t.font.bold = True
    p_c2_t.font.color.rgb = COLOR_ACCENT_GREEN

    analysis_points = [
        ("Head-to-Head Benchmarks", "Compare Agent Alpha (Gemini 2.5 Flash) vs Agent Beta on identical tasks."),
        ("Automated Winner Scoring", "Calculates optimal tradeoffs between accuracy, speed, and token cost."),
        ("Regression Detection", "Identify prompt degradations and breaking schema changes before production."),
        ("JSON Trace Export", "Full trace export to standard JSON format for team sharing and postmortems.")
    ]
    for label, desc in analysis_points:
        p_a = tf_c2.add_paragraph()
        p_a.text = f"•  {label}: {desc}"
        p_a.font.size = Pt(12)
        p_a.font.color.rgb = COLOR_TEXT_MUTED
        p_a.space_before = Pt(10)

    # ==========================================================
    # SLIDE 8: Market Opportunity & Target Audience
    # ==========================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide8)
    add_header(slide8, "Market Opportunity & Target Audience", "MARKET POTENTIAL")

    market_cards = [
        ("Autonomous Agent Developers", "Developers building multi-agent workflows with LangChain, LangGraph, CrewAI, AutoGen, and custom LLM tool pipelines who lack dedicated visual tracing.", COLOR_ACCENT_BLUE),
        ("Enterprise AI Teams", "Engineering organizations deploying autonomous code generation, customer service agents, and automated research workflows requiring auditability and cost governance.", COLOR_ACCENT_GREEN),
        ("$4.8B Observability Market", "The AI observability and evaluation market is accelerating at 38% CAGR as companies transition from simple prompt-response chat to multi-step agentic systems.", COLOR_ACCENT_AMBER)
    ]

    for i, (title, desc, accent) in enumerate(market_cards):
        x = Inches(0.8 + i * 3.95)
        card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.7))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.35)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(14)

    # ==========================================================
    # SLIDE 9: Roadmap & Future Vision
    # ==========================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide9)
    add_header(slide9, "Future Roadmap & Technical Evolution", "LOOKING AHEAD")

    roadmap = [
        ("Phase 1: Now (Hackathon Ready)", "• Live Gemini 2.5 Flash API autonomous execution\n• Dynamic DAG workflow topology streaming\n• Embedded SQL database with zero external setup\n• Live sandboxed HTML/code artifact preview", COLOR_ACCENT_GREEN),
        ("Phase 2: Swarm & OpenTelemetry", "• Multi-agent swarm topology visualization (10+ agents)\n• OpenTelemetry standard OTLP export\n• Direct Langfuse and Arize Phoenix interoperability\n• Automated cost ceiling circuit breakers", COLOR_ACCENT_BLUE),
        ("Phase 3: Autonomous Optimization", "• AI-driven prompt refactoring to minimize token spend\n• Self-healing tool contracts with automatic retry tuning\n• Enterprise role-based access control and team workspaces", COLOR_ACCENT_AMBER)
    ]

    for i, (title, desc, accent) in enumerate(roadmap):
        x = Inches(0.8 + i * 3.95)
        card = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(2.0), Inches(3.75), Inches(4.7))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.35)

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = accent

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = COLOR_TEXT_MUTED
        p_d.space_before = Pt(14)

    # ==========================================================
    # SLIDE 10: Conclusion & Call to Action
    # ==========================================================
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(slide10)

    cta_card = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.2), Inches(11.7), Inches(5.1))
    cta_card.fill.solid()
    cta_card.fill.fore_color.rgb = COLOR_CARD
    cta_card.line.color.rgb = COLOR_BORDER
    cta_card.line.width = Pt(1)

    tf_cta = cta_card.text_frame
    tf_cta.word_wrap = True
    tf_cta.margin_left = Inches(0.6)
    tf_cta.margin_right = Inches(0.6)
    tf_cta.margin_top = Inches(0.6)

    p_c1 = tf_cta.paragraphs[0]
    p_c1.text = "AgentArena: The Future of Agent Observability"
    p_c1.font.size = Pt(36)
    p_c1.font.bold = True
    p_c1.font.color.rgb = COLOR_TEXT_PRIMARY

    p_c2 = tf_cta.add_paragraph()
    p_c2.text = "Don't let autonomous agents remain black boxes. Debug, benchmark, and visualize with flight-recorder precision."
    p_c2.font.size = Pt(18)
    p_c2.font.color.rgb = COLOR_ACCENT_BLUE
    p_c2.space_before = Pt(16)

    p_c3 = tf_cta.add_paragraph()
    p_c3.text = "• Live Code Repository: https://github.com/IHassanshaikh/Agent-Arena\n• Live Web Dashboard: http://localhost:3000\n• Ingestion & Trace API: http://localhost:4000\n• Built for Geek Room AI Global Hackathon 2026"
    p_c3.font.size = Pt(14)
    p_c3.font.color.rgb = COLOR_TEXT_MUTED
    p_c3.space_before = Pt(24)

    prs.save(output_path)
    print(f"Presentation saved successfully to {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "AgentArena_Hackathon_Pitch.pptx"
    create_deck(out_file)
