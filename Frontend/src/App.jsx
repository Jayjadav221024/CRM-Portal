import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./query/queryClient";

import LoginPage from "./pages/LoginPage";
import LeadsPage from "./pages/LeadsPage";

import ProtectedRoute from "./components/common/ProtectedRoute";


import "./styles/global.css";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* LOGIN */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* DASHBOARD */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LeadsPage />
              </ProtectedRoute>
            }
          />

          {/* FALLBACK */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}