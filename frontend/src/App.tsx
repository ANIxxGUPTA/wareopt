import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardHome } from './pages/DashboardHome';
import { ShiftAssignmentsView } from './pages/ShiftAssignmentsView';
import { DeliverySlotView } from './pages/DeliverySlotView';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/shifts" element={<ShiftAssignmentsView />} />
          <Route path="/deliveries" element={<DeliverySlotView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
