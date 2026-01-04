import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import PlanList from '@/pages/PlanList';
import PlanDetail from '@/pages/PlanDetail';
import PlanCreate from '@/pages/PlanCreate';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="plans" element={<PlanList />} />
            <Route path="plans/:id" element={<PlanDetail />} />
            <Route path="plans/new" element={<PlanCreate />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
