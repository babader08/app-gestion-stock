import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./guards/ProtectedRoute";
import Register from "./pages/Register";
import ValideCode from "./pages/ValideCode";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ duration: 5000 }}
      />
      <div className="min-h-screen flex-col text-white">
        <div>
          <Routes>
            {/* Pages Publiques */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/password" element={<ForgotPassword />} />
            <Route path="/validCode" element={<ValideCode />} />

            {/* Pages Protégées */}
            <Route element={<DashboardLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
