import { useEffect, useState } from 'react';
import { auctionGoals, trackAuctionGoal } from '@/lib/auctionMetrics';
import { Badge, Button, Checkbox, Icon, Input } from '@/ui';
import s from './AuctionPage.module.css';

type Role = 'seller' | 'buyer';
type SellerStep = 'form' | 'review' | 'published';
type BidState = 'active' | 'loading' | 'low' | 'error' | 'success' | 'finished';

const currentBid = 12_450_000;
const minBid = 12_500_000;
const formatPrice = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const parsePrice = (value: string) => Number(value.replace(/\D/g, ''));

function ApartmentCover({ variant = 0, label = 'Фотография светлой гостиной' }: { variant?: number; label?: string }) {
  return (
    <div className={`${s.cover} ${s[`photo${variant}`]}`} aria-label={label} role="img">
      <span className={s.window} />
      <span className={s.plant} />
      <span className={s.sofa} />
    </div>
  );
}

function PhotoSlider({ onPhotoChange }: { onPhotoChange: (photo: number) => void }) {
  const photos = ['Светлая гостиная', 'Кухня с окном', 'Спальня'];
  const [photo, setPhoto] = useState(0);
  const showPhoto = (next: number) => {
    const selected = (next + photos.length) % photos.length;
    setPhoto(selected);
    onPhotoChange(selected);
  };
  return (
    <div className={s.photoSlider} aria-label="Фотографии квартиры">
      <ApartmentCover variant={photo} label={`Фото ${photo + 1}: ${photos[photo]}`} />
      <button className={`${s.sliderButton} ${s.sliderPrev}`} type="button" aria-label="Предыдущее фото" onClick={() => showPhoto(photo - 1)}>
        <Icon name="ActionChevronLeft16" size={20} />
      </button>
      <button className={`${s.sliderButton} ${s.sliderNext}`} type="button" aria-label="Следующее фото" onClick={() => showPhoto(photo + 1)}>
        <Icon name="ActionChevronRight16" size={20} />
      </button>
      <div className={s.sliderDots} aria-label="Выбор фотографии">
        {photos.map((name, index) => (
          <button key={name} type="button" aria-label={`Показать: ${name}`} aria-current={photo === index ? 'true' : undefined} onClick={() => showPhoto(index)} />
        ))}
      </div>
    </div>
  );
}

export function AuctionPage() {
  const [role, setRole] = useState<Role>('buyer');
  const [sellerStep, setSellerStep] = useState<SellerStep>('form');
  const [startPrice, setStartPrice] = useState('12 000 000');
  const [increment, setIncrement] = useState('50 000');
  const [bid, setBid] = useState('12 500 000');
  const [bidState, setBidState] = useState<BidState>('active');
  const [notified, setNotified] = useState(true);

  useEffect(() => {
    if (bidState !== 'loading') return;
    const timer = window.setTimeout(() => {
      trackAuctionGoal(auctionGoals.bidAccepted, { role: 'buyer', step: 'bid_result', state: 'success' });
      setBidState('success');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [bidState]);

  useEffect(() => {
    const isSeller = role === 'seller';
    trackAuctionGoal(auctionGoals.screenView, {
      role,
      step: isSeller ? sellerStep : bidState,
      screen: isSeller ? `seller_${sellerStep}` : `buyer_${bidState}`,
    });
  }, [role, sellerStep, bidState]);

  const makeBid = () => {
    trackAuctionGoal(auctionGoals.bidSubmitted, { role: 'buyer', step: 'bid_form' });
    if (parsePrice(bid) < minBid) {
      trackAuctionGoal(auctionGoals.bidTooLow, { role: 'buyer', step: 'bid_validation', state: 'low' });
      setBidState('low');
      return;
    }
    trackAuctionGoal(auctionGoals.bidPending, { role: 'buyer', step: 'bid_request', state: 'loading' });
    setBidState('loading');
  };

  const switchRole = (nextRole: Role) => {
    trackAuctionGoal(auctionGoals.roleSwitched, { role: nextRole, step: 'role_switcher' });
    setRole(nextRole);
    if (nextRole === 'buyer') setBidState('active');
  };

  return (
    <main className={s.page}>
      <div className={s.phone}>
        <header className={s.header}>
          <div className={s.brand} aria-label="Циан">
            Ц
          </div>
          <div>
            <p className={s.kicker}>ПРОТОТИП</p>
            <strong>Продажа на аукционе</strong>
          </div>
          <Button theme="stroke_secondary" size="XS" aria-label="Уведомления" onClick={() => {
            trackAuctionGoal(auctionGoals.notificationToggled, { role, step: 'header' });
            setNotified(!notified);
          }}>
            <Icon name="Bell" size={18} />
          </Button>
        </header>

        <div className={s.roleSwitch} role="tablist" aria-label="Роль в сценарии">
          <button
            className={role === 'buyer' ? s.activeRole : undefined}
            type="button"
            role="tab"
            aria-selected={role === 'buyer'}
            onClick={() => switchRole('buyer')}
          >
            Покупатель
          </button>
          <button
            className={role === 'seller' ? s.activeRole : undefined}
            type="button"
            role="tab"
            aria-selected={role === 'seller'}
            onClick={() => switchRole('seller')}
          >
            Продавец
          </button>
        </div>

        {role === 'seller' ? (
          <SellerFlow
            step={sellerStep}
            startPrice={startPrice}
            increment={increment}
            onStartPrice={setStartPrice}
            onIncrement={setIncrement}
            onReview={() => {
              trackAuctionGoal(auctionGoals.sellerReviewOpened, { role: 'seller', step: 'conditions_form' });
              setSellerStep('review');
            }}
            onEdit={() => setSellerStep('form')}
            onPublish={() => {
              trackAuctionGoal(auctionGoals.sellerPublished, { role: 'seller', step: 'review' });
              setSellerStep('published');
            }}
          />
        ) : (
          <BuyerFlow
            bid={bid}
            bidState={bidState}
            notified={notified}
            onBid={setBid}
            onNotified={setNotified}
            onMakeBid={makeBid}
            onPhotoChange={(photo) => trackAuctionGoal(auctionGoals.photoChanged, { role: 'buyer', step: 'gallery', photo })}
            onFavorite={() => trackAuctionGoal(auctionGoals.favoriteToggled, { role: 'buyer', step: 'listing_card' })}
            onState={(state) => {
              if (state === 'error') trackAuctionGoal(auctionGoals.bidError, { role: 'buyer', step: 'bid_request', state });
              if (state === 'finished') trackAuctionGoal(auctionGoals.auctionFinished, { role: 'buyer', step: 'auction_status', state });
              setBidState(state);
            }}
          />
        )}
      </div>
    </main>
  );
}

function SellerFlow({
  step,
  startPrice,
  increment,
  onStartPrice,
  onIncrement,
  onReview,
  onEdit,
  onPublish,
}: {
  step: SellerStep;
  startPrice: string;
  increment: string;
  onStartPrice: (value: string) => void;
  onIncrement: (value: string) => void;
  onReview: () => void;
  onEdit: () => void;
  onPublish: () => void;
}) {
  if (step === 'published') {
    return (
      <section className={s.content} aria-live="polite">
        <div className={s.publicationStatus}>
          <div className={s.successMark}><Icon name="FunctionalSuccess16" size={24} /></div>
          <Badge tone="positive">Аукцион опубликован</Badge>
        </div>
        <h1>Квартира ждёт первых ставок</h1>
        <p className={s.lead}>Мы уведомим вас, когда покупатель сделает ставку или аукцион завершится.</p>
        <div className={s.summary}>
          <span>Стартовая цена</span><strong>{formatPrice(parsePrice(startPrice))}</strong>
          <span>Минимальный шаг</span><strong>{formatPrice(parsePrice(increment))}</strong>
        </div>
        <Button fullWidth onClick={onEdit}>Посмотреть объявление</Button>
      </section>
    );
  }

  const isReview = step === 'review';
  return (
    <section className={s.content}>
      <p className={s.kicker}>ШАГ {isReview ? '2 ИЗ 2' : '1 ИЗ 2'}</p>
      <h1>{isReview ? 'Проверьте условия' : 'Настройте аукцион'}</h1>
      <p className={s.lead}>{isReview ? 'После публикации покупатели увидят эти условия.' : 'Укажите стартовую цену и шаг ставки.'}</p>
      <div className={s.apartmentMini}><ApartmentCover /><div><strong>2-комн. квартира, 54 м²</strong><span>Москва, Сокол</span></div></div>
      {isReview ? (
        <div className={s.summary}>
          <span>Стартовая цена</span><strong>{formatPrice(parsePrice(startPrice))}</strong>
          <span>Минимальный шаг</span><strong>{formatPrice(parsePrice(increment))}</strong>
          <span>Аукцион закончится</span><strong>Сегодня в 21:00</strong>
        </div>
      ) : (
        <div className={s.fields}>
          <Input label="Стартовая цена, ₽" value={startPrice} inputMode="numeric" onChange={(e) => onStartPrice(e.target.value)} hint="Покупатели смогут повышать цену." />
          <Input label="Минимальный шаг, ₽" value={increment} inputMode="numeric" onChange={(e) => onIncrement(e.target.value)} hint="Следующая ставка будет не ниже предыдущей + шага." />
        </div>
      )}
      {isReview ? (
        <div className={s.actions}><Button theme="stroke_primary" fullWidth onClick={onEdit}>Изменить</Button><Button fullWidth onClick={onPublish}>Опубликовать аукцион</Button></div>
      ) : <Button fullWidth onClick={onReview}>Проверить условия</Button>}
    </section>
  );
}

function BuyerFlow({
  bid,
  bidState,
  notified,
  onBid,
  onNotified,
  onMakeBid,
  onPhotoChange,
  onFavorite,
  onState,
}: {
  bid: string;
  bidState: BidState;
  notified: boolean;
  onBid: (value: string) => void;
  onNotified: (value: boolean) => void;
  onMakeBid: () => void;
  onPhotoChange: (photo: number) => void;
  onFavorite: () => void;
  onState: (value: BidState) => void;
}) {
  const reset = () => onState('active');
  if (bidState === 'finished') {
    return <section className={s.content} aria-live="polite"><ApartmentCover /><Badge tone="neutral">Аукцион завершён</Badge><h1>Квартиру купили за 12 850 000 ₽</h1><p className={s.lead}>Победителю уже отправили дальнейшие инструкции.</p><Button theme="stroke_primary" fullWidth onClick={reset}>К другим объявлениям</Button></section>;
  }
  return (
    <section className={`${s.content} ${s.buyerContent}`}>
      <article className={s.propertyCard}>
        <PhotoSlider onPhotoChange={onPhotoChange} />
        <div className={s.titleRow}><div><Badge tone="main">Аукцион</Badge><h1>2-комн. квартира, 54 м²</h1><p className={s.address}>Москва, ул. Усиевича, 23</p></div><button className={s.heart} aria-label="Добавить в избранное" type="button" onClick={onFavorite}><Icon name="Heart" size={26} /></button></div>
      </article>
      <div className={s.auctionInfo}><div className={s.metricCard}><span>Текущая ставка</span><strong>{formatPrice(currentBid)}</strong></div><div className={s.metricCard}><span>До конца</span><strong>01:42:18</strong></div></div>
      {bidState === 'success' ? (
        <div className={s.stateCard} aria-live="polite"><Badge tone="positive">Ставка принята</Badge><h2>Вы лидируете</h2><p>Ваша ставка {formatPrice(parsePrice(bid))} сейчас самая высокая.</p><Checkbox label="Уведомить, если ставку перебьют" checked={notified} onChange={(event) => { trackAuctionGoal(auctionGoals.notificationToggled, { role: 'buyer', step: 'bid_success' }); onNotified(event.target.checked); }} /><Button theme="stroke_primary" fullWidth onClick={reset}>Сделать другую ставку</Button></div>
      ) : bidState === 'loading' ? (
        <div className={s.stateCard} aria-live="polite"><div className={s.loader} /><h2>Проверяем ставку</h2><p>Это займёт несколько секунд.</p></div>
      ) : bidState === 'error' ? (
        <div className={s.stateCard} role="alert"><Badge tone="negative">Не удалось отправить</Badge><h2>Что-то пошло не так</h2><p>Проверьте интернет-соединение и повторите попытку.</p><Button fullWidth onClick={onMakeBid}>Повторить</Button></div>
      ) : (
        <div className={s.bidPanel}>
          <h2>{bidState === 'low' ? 'Ставка слишком низкая' : 'Ваша ставка'}</h2>
          <Input label="Сумма ставки, ₽" value={bid} inputMode="numeric" onChange={(e) => { onBid(e.target.value); if (bidState === 'low') reset(); }} error={bidState === 'low' ? `Минимальная ставка — ${formatPrice(minBid)}` : undefined} hint={bidState === 'active' ? `Шаг ставки — от ${formatPrice(50_000)}` : undefined} />
          <Button fullWidth onClick={onMakeBid}>Сделать ставку</Button>
        </div>
      )}
      <details className={s.demoStates}>
        <summary>Проверить состояния прототипа</summary>
        <div><button type="button" onClick={() => onState('error')}>Ошибка отправки</button><button type="button" onClick={() => onState('finished')}>Аукцион завершён</button></div>
      </details>
    </section>
  );
}
