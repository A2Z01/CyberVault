import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CyberVault from "@/components/CyberVault";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CyberVault />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" theme="dark" />
      </div>
    </AuthProvider>
  );
}

export default App;