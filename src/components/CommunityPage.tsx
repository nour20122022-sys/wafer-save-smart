import { Play, Headphones, Heart, MessageCircle, Share2 } from "lucide-react";

export function CommunityPage() {
  const shorts = [
    { title: "Save 30% on your AC bill!", author: "Ahmed M.", views: "12K", likes: 340 },
    { title: "LED vs Incandescent: The real cost", author: "Sara K.", views: "8.5K", likes: 210 },
    { title: "Water heater hacks for Egyptian homes", author: "Mohamed R.", views: "15K", likes: 520 },
  ];

  const podcasts = [
    { title: "Solar Energy in Egypt: 2025 Update", duration: "12 min", episode: 15 },
    { title: "How I Cut My Bill by 40%", duration: "8 min", episode: 14 },
    { title: "Smart Meters: Are They Worth It?", duration: "10 min", episode: 13 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground">Learn, share, and inspire</p>
      </div>

      {/* Wafer Shorts */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          Wafer Shorts
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {shorts.map((s, i) => (
            <div
              key={i}
              className="min-w-[200px] aspect-[9/14] rounded-2xl overflow-hidden relative bg-energy-dark flex-shrink-0"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-energy-dark/90 to-transparent">
                <p className="text-primary-foreground text-xs font-semibold line-clamp-2">{s.title}</p>
                <p className="text-primary-foreground/60 text-[10px] mt-1">@{s.author} · {s.views} views</p>
              </div>
              <div className="absolute right-2 bottom-20 flex flex-col items-center gap-3">
                <button className="flex flex-col items-center">
                  <Heart className="w-5 h-5 text-primary-foreground/80" />
                  <span className="text-[10px] text-primary-foreground/60">{s.likes}</span>
                </button>
                <button>
                  <MessageCircle className="w-5 h-5 text-primary-foreground/80" />
                </button>
                <button>
                  <Share2 className="w-5 h-5 text-primary-foreground/80" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wafer Podcast */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Headphones className="w-4 h-4 text-accent" />
          Wafer Podcast
        </h2>
        <div className="space-y-2.5">
          {podcasts.map((p, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 shadow-sm flex items-center gap-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">Ep. {p.episode} · {p.duration}</p>
              </div>
              <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity">
                <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
