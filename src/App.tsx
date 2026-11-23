import { Routes, Route } from 'react-router-dom';
import { UIKitPage } from './pages/UIKitPage';
import { AuctionPage } from './pages/AuctionPage';
import { AuctionMapPage } from './pages/AuctionMapPage';
export default function App() {
  return (
    <Routes>
      <Route path="/auction" element={<AuctionPage />} />
      <Route path="/map" element={<AuctionMapPage />} />
      <Route path="*" element={<UIKitPage />} />
    </Routes>
  );
}
