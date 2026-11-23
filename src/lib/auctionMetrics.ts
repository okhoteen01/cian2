export const METRIKA_COUNTER_ID = 99999999;

export const auctionGoals = {
  screenView: 'auction_screen_view',
  roleSwitched: 'auction_role_switched',
  sellerReviewOpened: 'auction_seller_review_opened',
  sellerPublished: 'auction_seller_published',
  bidSubmitted: 'auction_bid_submitted',
  bidPending: 'auction_bid_pending',
  bidAccepted: 'auction_bid_accepted',
  bidTooLow: 'auction_bid_too_low',
  bidError: 'auction_bid_error',
  auctionFinished: 'auction_finished',
  photoChanged: 'auction_photo_changed',
  favoriteToggled: 'auction_favorite_toggled',
  notificationToggled: 'auction_notification_toggled',
} as const;

export type AuctionGoal = (typeof auctionGoals)[keyof typeof auctionGoals];
export type AuctionMetricParams = {
  role: 'seller' | 'buyer';
  step: string;
  screen?: string;
  state?: string;
  photo?: number;
};

/**
 * Заглушка вызова Яндекс Метрики. При подключении счётчика заменяется на ym().
 */
export function trackAuctionGoal(goal: AuctionGoal, params: AuctionMetricParams) {
  console.info('[Metrika stub]', { counterId: METRIKA_COUNTER_ID, goal, params });
}
