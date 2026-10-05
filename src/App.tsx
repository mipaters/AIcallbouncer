import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DemoProvider } from "./context/DemoContext";
import { Home } from "./pages/Home";
import { LiveDemo } from "./pages/LiveDemo";
import { CallHistory } from "./pages/CallHistory";
import { CallDetail } from "./pages/CallDetail";
import { Preferences } from "./pages/Preferences";
import { TrustedCallers } from "./pages/TrustedCallers";
import { HowItWorks } from "./pages/HowItWorks";
import { Privacy } from "./pages/Privacy";
import { Architecture } from "./pages/Architecture";
import { DemoSettings } from "./pages/DemoSettings";
import { About } from "./pages/About";
import { LiveCalls } from "./pages/LiveCalls";

export default function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live-demo" element={<LiveDemo />} />
            <Route path="/live-calls" element={<LiveCalls />} />
            <Route path="/history" element={<CallHistory />} />
            <Route path="/history/:id" element={<CallDetail />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/trusted-callers" element={<TrustedCallers />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/demo-settings" element={<DemoSettings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </DemoProvider>
  );
}
