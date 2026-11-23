"""Check the actual SVG cursor tip against rendered prototype controls."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.goto((ROOT / 'video.html').as_uri() + '?fmt=h')
        page.wait_for_function('window.READY === true')
        report = page.evaluate('''() => CURSOR_CHECKS.map(check => {
          render(check.time);
          const screen = document.querySelector(`[data-screen="${check.screen}"]`);
          const target = check.target === 'notification'
            ? screen.querySelector('input[type="checkbox"]').nextElementSibling
            : screen.querySelector(`[data-motion-target="${check.target}"]`);
          const rect = target.getBoundingClientRect();
          const svg = document.getElementById('cursor');
          const point = svg.createSVGPoint(); point.x = 6; point.y = 3.5;
          const tip = point.matrixTransform(svg.getScreenCTM());
          const inside = tip.x >= rect.left && tip.x <= rect.right && tip.y >= rect.top && tip.y <= rect.bottom;
          const visible = getComputedStyle(screen).visibility === 'visible';
          const onScreen = tip.x >= 1124 && tip.x < 1816 && tip.y >= 128 && tip.y < 970;
          return {time:check.time, target:check.target, screen:check.screen, tip:[tip.x,tip.y], bounds:[rect.left,rect.top,rect.right,rect.bottom], inside, visible, onScreen};
        })''')
        required = {'seller-form', 'seller-review', 'seller-published', 'buyer-active',
                    'buyer-loading', 'buyer-success', 'buyer-low', 'buyer-error', 'buyer-finished'}
        shown = set(page.evaluate('SCENE_TIMELINE.map(scene => scene.key)'))
        assert required <= shown, 'Missing source states: ' + str(required - shown)
        for check in report:
            assert check['inside'] and check['visible'] and check['onScreen'], check
        destination = ROOT / 'build' / 'cursor_checks_v2.json'
        destination.parent.mkdir(exist_ok=True)
        destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'OK: {len(report)} cursor clicks land inside visible controls; all 9 primary screens are shown.')
        browser.close()


if __name__ == '__main__':
    main()
