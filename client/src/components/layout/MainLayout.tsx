import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isAdminRoute && <Header />}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};
