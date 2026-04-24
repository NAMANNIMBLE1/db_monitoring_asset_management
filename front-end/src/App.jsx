import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import InstanceDetail from './pages/InstanceDetail';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import GroupsPage from './pages/GroupsPage';
import './styles/index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/device/:ip/instance/:instanceName" element={<InstanceDetail />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
