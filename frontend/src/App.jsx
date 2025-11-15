import { useState ,useEffect } from 'react'
import './App.css'
import { Auth } from './pages/auth'
import 'primeicons/primeicons.css';
import AOS from "aos";
import "aos/dist/aos.css";
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard';
import { MyProfile} from './pages/MyProfile';
import { StockDetails } from './pages/StockDetails';
import {HelpSupport} from './pages/HelpSupport';
import {Preference} from './pages/Preference'
import AiInsight from './pages/AiInsight';
import Watchlist from './pages/WatchList';
import {createBrowserRouter,RouterProvider} from "react-router-dom";
const router = createBrowserRouter(
  [
    {
      path:"/",
      element:<Home/>
    },
     {
      path:"/auth",
      element:<Auth/>      
    },
    {
      path:"/dashboard",
      element:<Dashboard/>
    },
    {
      path:"/my-profile",
      element:<MyProfile/>
    }
    ,{
      path:"/ai-insight",
      element:<AiInsight/>
    },
    {
      path: "/stockdetails/:symbol",
      element: <StockDetails />
    },
    {
      path:"/preferences",
      element:<Preference/>
    },
    {
      path:"/help-support",
      element:<HelpSupport/>
    }
    ,{
      path:"/watchlist",
      element:<Watchlist/>
    }
  ]
);
function App() {
  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: false,
    });
  }, []);
  return (
    <>
         <RouterProvider router={router} />
    </>
  )
}

export default App
