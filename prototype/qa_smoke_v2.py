#!/usr/bin/env python3
"""Mobile Playwright smoke flow for the built static game."""
import argparse
import re
import sys
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright


FORBIDDEN = re.compile(
    r"EVD|TRU|EXP|SLF|run_\d+|C\d_E_|S_[A-Z]|WIPE|R-07|"
    r"\b\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?\b"
)


def main():
    parser = argparse.ArgumentParser(description="手机视口 Playwright 冒烟测试")
    parser.add_argument("--url", default="http://localhost:8800/")
    parser.add_argument("--out", default="qa_out/")
    args = parser.parse_args()

    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    failures = []
    bad_responses = []
    console_errors = []
    page_errors = []
    page = None
    browser = None

    def fail(message):
        failures.append(str(message))

    def screenshot(name):
        if page is None:
            return
        try:
            page.screenshot(path=str(out_dir / name), full_page=True)
        except Exception as exc:  # Keep the rest of the smoke report useful.
            fail(f"截图 {name}: {exc}")

    def check_visible_text(stage):
        if page is None:
            return
        try:
            visible = page.locator("body").inner_text()
        except Exception as exc:
            fail(f"{stage}: 无法读取页面可见文字: {exc}")
            return
        match = FORBIDDEN.search(visible)
        if match:
            fail(f"{stage}: 玩家可见文字包含禁用内容 {match.group(0)!r}")

    def click_enabled_button(locator, stage, timeout=10000):
        if locator.count() == 0:
            fail(f"{stage}: 找不到按钮")
            return False
        button = locator.first
        if not button.is_visible():
            fail(f"{stage}: 按钮不可见")
            return False
        if not button.is_enabled():
            fail(f"{stage}: 按钮已禁用")
            return False
        button.click(timeout=timeout)
        return True

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox"],
            )
            context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
            page = context.new_page()
            page.on("response", lambda response: bad_responses.append(
                f"HTTP {response.status} {response.url}"
            ) if response.status >= 400 else None)
            page.on("console", lambda message: console_errors.append(message.text)
                    if message.type == "error" else None)
            page.on("pageerror", lambda error: page_errors.append(str(error)))

            page.goto(args.url, wait_until="networkidle", timeout=30000)
            page.locator("#titleStart").wait_for(state="visible", timeout=10000)
            check_visible_text("标题页")
            screenshot("01-title.png")

            click_enabled_button(page.locator("#titleStart"), "标题页")
            page.locator("#chapterSelectView").wait_for(state="visible", timeout=10000)
            check_visible_text("章节页")
            screenshot("02-chapters.png")

            first_card = page.locator("article.chapter-card").first
            first_card.wait_for(state="visible", timeout=10000)
            card_box = first_card.bounding_box()
            if (not card_box or card_box["width"] < 8 or card_box["height"] < 8 or
                    first_card.get_attribute("aria-disabled") == "true"):
                fail("章节页: 第一张章节卡没有可点击区域")
            else:
                # Click the card's right padding, away from its button and text.
                first_card.click(position={"x": max(2, card_box["width"] - 3),
                                           "y": card_box["height"] * 0.5}, timeout=10000)
                page.locator("#introView").wait_for(state="visible", timeout=10000)
            check_visible_text("导入页")
            screenshot("03-intro.png")

            begin = page.locator("#introActions button").filter(has_text="开始推演").first
            if begin.count() == 0 or not begin.is_visible() or not begin.is_enabled():
                fail("导入页: 找不到可见的「开始推演」按钮")
            else:
                begin.click(timeout=10000)
                page.locator("#gameView").wait_for(state="visible", timeout=10000)
            check_visible_text("游戏页")
            screenshot("04-game.png")

            steps = 0
            while steps < 60 and not page.locator("#reviewView").is_visible():
                button = page.locator("#choiceList button:visible:enabled").first
                try:
                    if button.count() == 0:
                        fail(f"推演第 {steps + 1} 步: 没有可见且启用的选项按钮")
                        break
                    if not button.is_visible() or not button.is_enabled():
                        fail(f"推演第 {steps + 1} 步: 首个选项按钮不可见或已禁用")
                        break
                    button.click(timeout=10000)
                    steps += 1
                    check_visible_text(f"推演第 {steps} 步")
                except PlaywrightError as exc:
                    fail(f"推演第 {steps + 1} 步: 无法点击首个选项按钮: {exc}")
                    break
            if not page.locator("#reviewView").is_visible():
                fail(f"连续点击 {steps} 步后仍未到达复盘页")
            else:
                check_visible_text("复盘页")
                screenshot("05-review.png")

                archive_button = page.get_by_role("button", name="查看档案")
                if archive_button.count() == 0 or not archive_button.is_visible() or not archive_button.is_enabled():
                    fail("复盘页: 找不到可见的「查看档案」按钮")
                else:
                    archive_button.click(timeout=10000)
                    page.locator("#archiveView").wait_for(state="visible", timeout=10000)
                    check_visible_text("档案页")
                    details = page.locator("#archiveRuns details").first
                    if details.count() == 0:
                        fail("档案页: 没有可展开的推演 details")
                    else:
                        details.locator("summary").click(timeout=10000)
                        if not details.evaluate("element => element.open"):
                            fail("档案页: 推演 details 展开失败")
                    check_visible_text("展开档案 details")
                    screenshot("06-archive.png")

            # Confirm the locked card advertises its disabled state without clicking it.
            click_enabled_button(page.locator("#navChapters"), "章节导航")
            page.locator("#chapterSelectView").wait_for(state="visible", timeout=10000)
            locked = page.locator('article.chapter-card[aria-disabled="true"]').first
            if locked.count() == 0:
                fail("章节页: 没有可用于锁定点击检查的章节卡")
            else:
                if not locked.is_visible():
                    fail("章节页: 锁定章节卡不可见")
                if locked.get_attribute("aria-disabled") != "true":
                    fail("章节页: 锁定章节卡缺少 aria-disabled=true")
                if not page.locator("#chapterSelectView").is_visible() or page.locator("#introView").is_visible():
                    fail("锁定章节卡状态检查时不在章节选择页")
            check_visible_text("锁定章节卡")
            screenshot("07-locked-card.png")
            context.close()
    except Exception as exc:
        fail(f"Playwright 执行失败: {type(exc).__name__}: {exc}")
    finally:
        if browser is not None:
            try:
                browser.close()
            except Exception:
                pass

    for response in bad_responses:
        fail(f"响应状态不应达到 400: {response}")
    for error in console_errors:
        fail(f"console error: {error}")
    for error in page_errors:
        fail(f"pageerror: {error}")

    if failures:
        print(f"QA smoke failed ({len(failures)} 项)")
        for item in failures:
            print(f"- {item}")
        print(f"Screenshots: {out_dir}")
        return 1

    print("QA smoke passed")
    print(f"Screenshots: {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
