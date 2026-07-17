import Betslip from "./components/betslip/Betslip";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import Detail from "./pages/detail/Detail";
import Home from "./pages/home/Home";
import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation } from "react-router-dom";
import Virtuals from "./pages/virtuals/Virtuals";
import { useEffect, useState } from "react";
import Fixtures from "./pages/home/Fixtures";
import LiveMatches from "./pages/home/LiveMatches";
import Player from "./pages/player/Player";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Account from "./pages/account/Account";
import Wallet from "./pages/wallet/Wallet";
import Boost from "./pages/boost/Boost";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { BetslipProvider, useBetslip } from "./context/BetslipContext";
import { NotificationProvider } from "./context/NotificationContext";
import Toasts from "./components/toasts/Toasts";

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading">Loading...</div>;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const SlipToggle = () => {
  const { setVisible, count } = useBetslip();
  return (
    <div className="slip-toggle" id="slipToggle" onClick={() => setVisible(true)}>
      <i className="fas fa-receipt"></i>
      {count > 0 && <span className="slip-count" id="toggleCount">{count}</span>}
    </div>
  );
};

const Layout = () => {
  return (
    <div className="container">
      <Header />
      <Outlet />
      <Betslip />
      <Footer />
      <SlipToggle />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <RouterProvider
      router={createBrowserRouter([
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/register",
          element: <Register />,
        },
        {
          path: "/",
          element: <Layout />,
          children: [
            { path: "/", element: <Home /> },
            { path: "/fixtures", element: <Fixtures /> },
            { path: "/live", element: <LiveMatches /> },
            { path: "/live/:id", element: <Detail /> },
            { path: "/virtuals", element: <Virtuals /> },
            { path: "/boost", element: <Boost /> },
            { path: "/player/:id", element: <Player /> },
            {
              path: "/account",
              element: (
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              ),
            },
            {
              path: "/wallet",
              element: (
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              ),
            },
          ],
        },
      ])}
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <NotificationProvider>
          <BetslipProvider>
            <AppRoutes />
            <Toasts />
          </BetslipProvider>
        </NotificationProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
