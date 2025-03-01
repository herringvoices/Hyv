import { Routes, Route, Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import Logout from "./pages/Logout";
import Friends from "./pages/Friends";
import FriendDetails from "./pages/FriendDetails";
import Profile from "./pages/Profile";
import Welcome from "./pages/Welcome";
import Windows from "./pages/Windows";

function ApplicationViews() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <div className="shadow-sm shadow-primary">
              <NavBar />
            </div>
            <Outlet />
          </>
        }
      >
        <Route index element={<Welcome />} />
        <Route path="windows" element={<Windows />} />
        <Route path="hive" element={<div>Hive Placeholder</div>} />
        <Route path="friends">
          <Route index element={<Friends />} />
          <Route path=":friendId" element={<FriendDetails />} />
        </Route>
        <Route path="hangouts" element={<div>Hangouts Placeholder</div>} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default ApplicationViews;
