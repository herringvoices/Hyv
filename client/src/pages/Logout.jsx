import { useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import { logout } from "../services/authServices";
import { UserContext } from "../context/UserContext";

export default function Logout() {
  const { setLoggedInUser } = useContext(UserContext);

  useEffect(() => {
    async function handleLogout() {
      await logout();
      setLoggedInUser(null);
    }
    handleLogout();
  }, [setLoggedInUser]);

  return <Navigate to="/login" replace />;
}