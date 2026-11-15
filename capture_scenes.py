from playwright.sync_api import sync_playwright
import time
import os

os.makedirs("video_frames_raw", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    
    print("Navigating to home...")
    page.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(2)
    page.screenshot(path="video_frames_raw/01_overview.png")
    print("01_overview.png saved")
    
    # Click on the latest run in the sidebar (first run item)
    run_items = page.query_selector_all("button:has(span)")
    print(f"Found buttons: {len(run_items)}")
    
    # Topology screenshot
    page.screenshot(path="video_frames_raw/02_topology.png")
    
    # Click Split tab
    buttons = page.query_selector_all("button")
    for b in buttons:
        text = b.inner_text().strip()
        if "Split" in text:
            print("Clicking Split tab...")
            b.click()
            time.sleep(1.5)
            page.screenshot(path="video_frames_raw/03_split.png")
            print("03_split.png saved")
            break

    # Click Result tab
    buttons = page.query_selector_all("button")
    for b in buttons:
        text = b.inner_text().strip()
        if "Result" in text:
            print("Clicking Result tab...")
            b.click()
            time.sleep(1.5)
            page.screenshot(path="video_frames_raw/04_result.png")
            print("04_result.png saved")
            break

    # Click Timeline tab
    buttons = page.query_selector_all("button")
    for b in buttons:
        text = b.inner_text().strip()
        if "Timeline" in text:
            print("Clicking Timeline tab...")
            b.click()
            time.sleep(1.5)
            page.screenshot(path="video_frames_raw/05_timeline.png")
            print("05_timeline.png saved")
            break

    # Go to Compare page
    print("Navigating to compare page...")
    page.goto("http://localhost:3000/compare", wait_until="networkidle")
    time.sleep(2)
    page.screenshot(path="video_frames_raw/06_compare.png")
    print("06_compare.png saved")

    browser.close()
    print("Done capturing scenes!")
