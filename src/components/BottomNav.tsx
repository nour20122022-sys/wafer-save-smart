import { Home, Calculator, Trophy, MessageCircle, UserCircle } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "الرئيسية", icon: Home },
  { id: "calculator", label: "الحاسبة", icon: Calculator },
  { id: "challenges", label: "التحديات", icon: Trophy },
  { id: "chat", label: "الشات", icon: MessageCircle },
  { id: "profile", label: "حسابي", icon: UserCircle },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
