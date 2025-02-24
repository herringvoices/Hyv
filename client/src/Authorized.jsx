import { useEffect, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "./services/authServices";
import { UserContext } from "./context/UserContext";

function Authorized({ children }) {
  console.log("Authorized component rendered");

  const { loggedInUser, setLoggedInUser } = useContext(UserContext);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      console.log("Checking auth via /api/Auth/Me...");
      const result = await getMe();
      console.log("Result from /api/Auth/Me:", result);
      if (result?.success) {
        setLoggedInUser(result.user);
      }
      setCheckedAuth(true);
    }
    checkAuth();
  }, [setLoggedInUser]);

  if (!checkedAuth) {
    console.log("Auth check not completed yet");
    return null;
  }

  console.log("Auth check completed, loggedInUser:", loggedInUser);
  return loggedInUser ? children : <Navigate to="/login" replace />;
}

export default Authorized;
