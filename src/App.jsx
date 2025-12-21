import Betslip from "./components/betslip/Betslip";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import Detail from "./pages/detail/Detail";
import Home from "./pages/home/Home";
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Virtuals from "./pages/virtuals/Virtuals";
import { useState } from "react";
import Fixtures from "./pages/home/Fixtures";
import LiveMatches from "./pages/home/LiveMatches";
import Player from "./pages/player/Player";

const Layout = () => {
  const [visible, setVisible] = useState(false);

  const handleToggle = () => {
    setVisible(!visible)
  }
  return (
    <div className="container" >
      <Header />
      <Outlet />
      <Betslip visible={visible} setVisible={setVisible}/>
      < Footer />
      <div className="slip-toggle" id="slipToggle" onClick={handleToggle}>
        <i className="fas fa-receipt"></i>
        <span className="slip-count" id="toggleCount">2</span>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/fixtures",
        element: <Fixtures />
      },
      {
        path: "/live",
        element: <LiveMatches />
      },
      {
        path: "/live/:id",
        element: <Detail />
      },
      {
        path: "/virtuals",
        element: <Virtuals />
      },
      {
        path: "/player/:id",
        element: <Player />
      }
    ]
  },
]);


function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;