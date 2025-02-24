import "./App.css";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover"; // ✅ Fix Radix import
import { motion, AnimatePresence } from "framer-motion"; // ✅ Ensure Framer Motion is installed
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Authorized from "./Authorized";
import ApplicationViews from "./ApplicationViews";
library.add(fas, far, fab);

function App() {
  const [open, setOpen] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<div>Login Placeholder</div>} />
        <Route path="/register" element={<div>Register Placeholder</div>} />
        <Route path="*" element={<ApplicationViews />} />
      </Routes>
    </Router>
  );
}

export default App;
