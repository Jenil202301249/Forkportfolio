import { createContext,useContext,useState,useEffect } from "react";
import { GetUserDetails } from "../utils/getUserDetails.js"; 

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(true);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [userDetails, setUserDetails] = useState(null); 
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const val = { darkMode, setDarkMode ,userDetails,setUserDetails,userLoggedIn,setUserLoggedIn,isSearchActive,setIsSearchActive};
    useEffect(() => {
        GetUserDetails(setUserDetails);
    }, [userLoggedIn]);
    
    return (
        <AppContext.Provider value={val}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
