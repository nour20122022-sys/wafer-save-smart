import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useRealtimeChallenges } from "@/hooks/useRealtimeChallenges";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { DashboardPage } from "@/components/DashboardPage";
import { CalculatorPage } from "@/components/CalculatorPage";
import { ChallengesPage } from "@/components/ChallengesPage";
import { SupportPage } from "@/components/SupportPage";
import { UserProfile } from "@/components/UserProfile";

const Index = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  useRealtimeChallenges();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "calculator": return <CalculatorPage />;
      case "challenges": return <ChallengesPage />;
      case "chat": return <SupportPage />;
      case "profile": return <UserProfile />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {renderPage()}
      </div>
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default Index;
