/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext } from "react";
import { useCheckAuth } from "../hooks";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  console.log(isAuthenticated, user);

  const { data: authData, isLoading } = useCheckAuth();

  useEffect(() => {
    if (!isLoading) {
      // ✅ Si authentifié
      if (authData?.data?.authenticated) {
        setIsAuthenticated(true);
        setUser({ id: authData.data.userID });
      } else {
        // ❌ Si pas authentifié
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    }
  }, [authData, isLoading]);

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
