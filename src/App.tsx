import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import IntentChat from './components/IntentChat';
import ClusterStatus from './pages/ClusterStatus';

const App: React.FC = () => {
  return (
    /* The Layout is OUTSIDE the Routes so it never unmounts */
    <Layout>
      <Routes>
        <Route path="/" element={<IntentChat />} />
        <Route path="/status" element={<ClusterStatus />} />
      </Routes>
    </Layout>
  );
};

export default App;