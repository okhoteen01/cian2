import { Link } from 'react-router-dom';
import { auctionGoals, METRIKA_COUNTER_ID } from '@/lib/auctionMetrics';
import { Badge, Icon } from '@/ui';
import s from './AuctionMapPage.module.css';

type Screen = { title: string; caption: string; goal: string; tone?: 'main' | 'positive' | 'negative' | 'warning' };

function ScreenNode({ title, caption, goal, tone = 'main' }: Screen) {
  return (
    <article className={s.screen}>
      <div className={s.miniHeader}><span>Ц</span><i /></div>
      <div className={s.miniBody}>
        <Badge tone={tone}>{caption}</Badge>
        <strong>{title}</strong>
        <span className={s.miniLine} />
        <span className={s.miniLine} />
        <span className={s.miniButton}>Действие</span>
      </div>
      <code>{goal}</code>
    </article>
  );
}

function Arrow({ event }: { event: string }) {
  return <div className={s.arrow} aria-label={`Переход: ${event}`}><span>→</span><code>{event}</code></div>;
}

const sellerScreens: Screen[] = [
  { title: 'Условия аукциона', caption: 'Шаг 1 из 2', goal: auctionGoals.screenView },
  { title: 'Проверка условий', caption: 'Шаг 2 из 2', goal: auctionGoals.screenView },
  { title: 'Аукцион опубликован', caption: 'Успех', goal: auctionGoals.screenView, tone: 'positive' },
];

const buyerScreens: Screen[] = [
  { title: 'Карточка и ставка', caption: 'Аукцион', goal: auctionGoals.screenView },
  { title: 'Проверяем ставку', caption: 'Ожидание', goal: auctionGoals.screenView, tone: 'warning' },
  { title: 'Вы лидируете', caption: 'Ставка принята', goal: auctionGoals.screenView, tone: 'positive' },
];

const buyerBranches: Screen[] = [
  { title: 'Ставка ниже допустимой', caption: 'Валидация', goal: auctionGoals.bidTooLow, tone: 'warning' },
  { title: 'Ошибка отправки', caption: 'Ошибка', goal: auctionGoals.bidError, tone: 'negative' },
  { title: 'Аукцион завершён', caption: 'Финал', goal: auctionGoals.auctionFinished },
];

export function AuctionMapPage() {
  return (
    <main className={s.page}>
      <header className={s.header}>
        <Link className={s.brand} to="/auction" aria-label="К прототипу аукциона">Ц</Link>
        <div><p>КАРТА СЦЕНАРИЕВ</p><h1>Аукцион квартиры</h1></div>
        <Link className={s.back} to="/auction">К прототипу <Icon name="ActionArrowUpRight16" size={16} /></Link>
      </header>

      <section className={s.intro}>
        <div><Badge tone="main">Яндекс Метрика · заглушка № {METRIKA_COUNTER_ID}</Badge><h2>Все экраны и события в одном месте</h2><p>Код события указан на миниатюре; подписи на стрелках фиксируют действие, которое переводит пользователя дальше.</p></div>
        <div className={s.legend}><span><i className={s.dot} /> экран</span><span><i className={s.line} /> событие</span></div>
      </section>

      <section className={s.scenario} aria-labelledby="seller-flow">
        <div className={s.scenarioTitle}><Badge tone="main">Продавец</Badge><h2 id="seller-flow">Публикация аукциона</h2></div>
        <div className={s.flow}>
          <ScreenNode {...sellerScreens[0]} />
          <Arrow event={auctionGoals.sellerReviewOpened} />
          <ScreenNode {...sellerScreens[1]} />
          <Arrow event={auctionGoals.sellerPublished} />
          <ScreenNode {...sellerScreens[2]} />
        </div>
      </section>

      <section className={s.scenario} aria-labelledby="buyer-flow">
        <div className={s.scenarioTitle}><Badge tone="positive">Покупатель</Badge><h2 id="buyer-flow">Ставка на квартиру</h2></div>
        <div className={s.flow}>
          <ScreenNode {...buyerScreens[0]} />
          <Arrow event={auctionGoals.bidSubmitted} />
          <ScreenNode {...buyerScreens[1]} />
          <Arrow event={auctionGoals.bidAccepted} />
          <ScreenNode {...buyerScreens[2]} />
        </div>
        <div className={s.branchFlow}>
          {buyerBranches.map((screen) => <div className={s.branch} key={screen.title}><Arrow event={screen.goal} /><ScreenNode {...screen} /></div>)}
        </div>
      </section>

      <section className={s.metrics} aria-labelledby="metrics">
        <div className={s.metricsTitle}><p>АНАЛИТИКА</p><h2 id="metrics">Как проверить фичу</h2><span>Все события передают обязательные параметры <code>role</code> и <code>step</code>; экран передаётся в <code>screen</code>.</span></div>
        <div className={s.tableWrap}>
          <table>
            <thead><tr><th>Показатель</th><th>Расчёт из событий</th><th>Цель</th></tr></thead>
            <tbody>
              <tr><td>Публикация аукциона</td><td><code>auction_seller_published / screen_view(role=seller, step=form)</code></td><td>≥ 65%</td></tr>
              <tr><td>Попытка ставки</td><td><code>auction_bid_submitted / screen_view(role=buyer, step=active)</code></td><td>≥ 20%</td></tr>
              <tr><td>Принятые ставки</td><td><code>auction_bid_accepted / auction_bid_submitted</code></td><td>≥ 85%</td></tr>
              <tr><td>Ставки ниже минимума</td><td><code>auction_bid_too_low / auction_bid_submitted</code></td><td>≤ 10%</td></tr>
              <tr><td>Технические ошибки</td><td><code>auction_bid_error / auction_bid_submitted</code></td><td>≤ 2%</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
