"""Capture real DOM states and button bounds from the local auction prototype."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

DEST = Path(__file__).resolve().parent / 'assets'


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={'width': 440, 'height': 920}, device_scale_factor=2)
        page.goto('http://127.0.0.1:4173/auction')
        page.locator('h1').wait_for()
        page.evaluate('document.fonts.ready')
        page.clock.install()
        states = {}

        def capture(name, targets=None):
            targets = targets or {}
            page.locator('[data-motion-target]').evaluate_all("nodes => nodes.forEach(node => node.removeAttribute('data-motion-target'))")
            for key, locator in targets.items():
                locator.evaluate('(node, key) => node.setAttribute("data-motion-target", key)', key)
            states[name] = {
                'html': page.locator('main > div').evaluate('''(el) => {
                    const clone = el.cloneNode(true);
                    const inputs = clone.querySelectorAll('input');
                    el.querySelectorAll('input').forEach((source, i) => {
                        inputs[i].setAttribute('value', source.value);
                        if (source.checked) inputs[i].setAttribute('checked', '');
                        else inputs[i].removeAttribute('checked');
                    });
                    clone.querySelectorAll('details').forEach(node => node.remove());
                    return clone.outerHTML;
                }'''),
                'targets': {key: locator.bounding_box() for key, locator in targets.items()},
            }

        buyer_tab = page.get_by_role('tab', name='Покупатель')
        seller_tab = page.get_by_role('tab', name='Продавец')
        seller_tab.click()
        capture('seller-form', {
            'price': page.get_by_role('textbox', name='Стартовая цена, ₽'),
            'step': page.get_by_role('textbox', name='Минимальный шаг, ₽'),
            'review': page.get_by_role('button', name='Проверить условия', exact=True),
        })
        page.get_by_role('button', name='Проверить условия', exact=True).click()
        capture('seller-review', {
            'edit': page.get_by_role('button', name='Изменить', exact=True),
            'publish': page.get_by_role('button', name='Опубликовать аукцион', exact=True),
        })
        page.get_by_role('button', name='Опубликовать аукцион', exact=True).click()
        capture('seller-published', {'buyer': buyer_tab})
        buyer_tab.click()
        capture('buyer-active', {
            'bid': page.get_by_role('textbox', name='Сумма ставки, ₽'),
            'submit': page.get_by_role('button', name='Сделать ставку', exact=True),
            'next': page.get_by_role('button', name='Следующее фото', exact=True),
            'favorite': page.get_by_role('button', name='Добавить в избранное', exact=True),
        })
        page.get_by_role('button', name='Следующее фото', exact=True).click()
        capture('buyer-photo', {'next': page.get_by_role('button', name='Следующее фото', exact=True)})
        page.get_by_role('button', name='Предыдущее фото', exact=True).click()
        page.get_by_role('button', name='Сделать ставку', exact=True).click()
        capture('buyer-loading')
        page.clock.run_for(950)
        capture('buyer-success', {
            'notification': page.get_by_role('checkbox', name='Уведомить, если ставку перебьют'),
            'another': page.get_by_role('button', name='Сделать другую ставку', exact=True),
        })
        page.get_by_role('checkbox', name='Уведомить, если ставку перебьют').uncheck()
        capture('buyer-notification-off')
        page.get_by_role('checkbox', name='Уведомить, если ставку перебьют').check()
        page.get_by_role('button', name='Сделать другую ставку', exact=True).click()
        page.get_by_role('textbox', name='Сумма ставки, ₽').fill('12 400 000')
        capture('buyer-low-input', {'submit': page.get_by_role('button', name='Сделать ставку', exact=True)})
        page.get_by_role('button', name='Сделать ставку', exact=True).click()
        capture('buyer-low', {'bid': page.get_by_role('textbox', name='Сумма ставки, ₽')})
        page.get_by_role('textbox', name='Сумма ставки, ₽').fill('12 500 000')
        page.get_by_text('Проверить состояния прототипа', exact=True).click()
        page.get_by_role('button', name='Ошибка отправки', exact=True).click()
        capture('buyer-error', {'retry': page.get_by_role('button', name='Повторить', exact=True)})
        page.get_by_role('button', name='Повторить', exact=True).click()
        capture('buyer-retry')
        page.clock.run_for(950)
        page.get_by_role('button', name='Аукцион завершён', exact=True).click()
        capture('buyer-finished', {'more': page.get_by_role('button', name='К другим объявлениям', exact=True)})

        css = page.evaluate('''() => [...document.styleSheets].map(sheet => {
          try { return [...sheet.cssRules].map(rule => rule.cssText).join('\\n'); }
          catch { return ''; }
        }).join('\\n')''')
        css = css.replace('/reference/', '../../../public/reference/')
        css = '\n'.join(line.rstrip() for line in css.splitlines()) + '\n'
        DEST.mkdir(exist_ok=True)
        (DEST / 'prototype.css').write_text(css, encoding='utf-8')
        (DEST / 'screens.js').write_text('window.PROTOTYPE = ' + json.dumps(states, ensure_ascii=False) + ';\n', encoding='utf-8')
        (DEST / 'capture-info.json').write_text(json.dumps({
            'source': 'src/pages/AuctionPage.tsx',
            'viewport': [440, 920],
            'states': {key: value['targets'] for key, value in states.items()},
        }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('Captured', len(states), 'real DOM states, source CSS and measured controls.')
        browser.close()


if __name__ == '__main__':
    main()
