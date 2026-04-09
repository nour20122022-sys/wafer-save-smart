import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { DashboardPage } from "@/components/DashboardPage";
import { CalculatorPage } from "@/components/CalculatorPage";
import { ChallengesPage } from "@/components/ChallengesPage";
import { CommunityPage } from "@/components/CommunityPage";
import { SupportPage } from "@/components/SupportPage";

const Index = () => {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "calculator": return <CalculatorPage />;
      case "challenges": return <ChallengesPage />;
      case "community": return <CommunityPage />;
      case "support": return <SupportPage />;
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
