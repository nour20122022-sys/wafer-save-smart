// Egyptian residential electricity tariff brackets (2024/2025)
export interface TariffBracket {
  id: number;
  nameAr: string;
  nameEn: string;
  minKwh: number;
  maxKwh: number;
  pricePerKwh: number; // EGP
}

export const TARIFF_BRACKETS: TariffBracket[] = [
  { id: 1, nameAr: "الشريحة الأولى", nameEn: "Bracket 1", minKwh: 0, maxKwh: 100, pricePerKwh: 0.58 },
  { id: 2, nameAr: "الشريحة الثانية", nameEn: "Bracket 2", minKwh: 101, maxKwh: 200, pricePerKwh: 0.78 },
  { id: 3, nameAr: "الشريحة الثالثة", nameEn: "Bracket 3", minKwh: 201, maxKwh: 350, pricePerKwh: 1.04 },
  { id: 4, nameAr: "الشريحة الرابعة", nameEn: "Bracket 4", minKwh: 351, maxKwh: 650, pricePerKwh: 1.35 },
  { id: 5, nameAr: "الشريحة الخامسة", nameEn: "Bracket 5", minKwh: 651, maxKwh: 1000, pricePerKwh: 1.55 },
  { id: 6, nameAr: "الشريحة السادسة", nameEn: "Bracket 6", minKwh: 1001, maxKwh: Infinity, pricePerKwh: 1.65 },
];

export function calculateBill(kwhUsage: number): { totalBill: number; bracket: TariffBracket; breakdown: { bracket: TariffBracket; kwh: number; cost: number }[] } {
  let remaining = kwhUsage;
  const breakdown: { bracket: TariffBracket; kwh: number; cost: number }[] = [];
  let totalBill = 0;
  let currentBracket = TARIFF_BRACKETS[0];

  for (const bracket of TARIFF_BRACKETS) {
    if (remaining <= 0) break;
    const bracketRange = bracket.maxKwh === Infinity ? remaining : bracket.maxKwh - bracket.minKwh + (bracket.id === 1 ? 1 : 0);
    const kwhInBracket = Math.min(remaining, bracketRange);
    const cost = kwhInBracket * bracket.pricePerKwh;
    breakdown.push({ bracket, kwh: kwhInBracket, cost });
    totalBill += cost;
    remaining -= kwhInBracket;
    currentBracket = bracket;
  }

  return { totalBill, bracket: currentBracket, breakdown };
}

export function getBracketForUsage(kwhUsage: number): TariffBracket {
  return TARIFF_BRACKETS.find(b => kwhUsage >= b.minKwh && kwhUsage <= b.maxKwh) || TARIFF_BRACKETS[TARIFF_BRACKETS.length - 1];
}

export function getNextBracketThreshold(kwhUsage: number): number | null {
  const current = getBracketForUsage(kwhUsage);
  if (current.maxKwh === Infinity) return null;
  return current.maxKwh;
}

export interface Appliance {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  wattage: number;
  hoursPerDay: number;
}

export const DEFAULT_APPLIANCES: Omit<Appliance, "id" | "hoursPerDay">[] = [
  { name: "Air Conditioner", nameAr: "تكييف", icon: "❄️", wattage: 1500 },
  { name: "Refrigerator", nameAr: "ثلاجة", icon: "🧊", wattage: 150 },
  { name: "Washing Machine", nameAr: "غسالة", icon: "👕", wattage: 500 },
  { name: "Water Heater", nameAr: "سخان مياه", icon: "🔥", wattage: 2000 },
  { name: "Television", nameAr: "تلفزيون", icon: "📺", wattage: 100 },
  { name: "Lighting", nameAr: "إضاءة", icon: "💡", wattage: 60 },
  { name: "Electric Oven", nameAr: "فرن كهربائي", icon: "🍳", wattage: 2000 },
  { name: "Iron", nameAr: "مكواة", icon: "👔", wattage: 1200 },
  { name: "Computer", nameAr: "كمبيوتر", icon: "💻", wattage: 200 },
  { name: "Fan", nameAr: "مروحة", icon: "🌀", wattage: 75 },
];

export function calculateApplianceMonthlyKwh(wattage: number, hoursPerDay: number): number {
  return (wattage * hoursPerDay * 30) / 1000;
}

export const DAILY_MISSIONS = [
  { id: 1, textAr: "افصل الغلاية الكهربائية بعد الاستخدام مباشرة", textEn: "Unplug the electric kettle immediately after use", points: 10 },
  { id: 2, textAr: "اضبط التكييف على 24 درجة", textEn: "Set your AC to 24°C", points: 15 },
  { id: 3, textAr: "أطفئ الأنوار في الغرف الفارغة", textEn: "Turn off lights in empty rooms", points: 10 },
  { id: 4, textAr: "استخدم الغسالة بحمولة كاملة فقط", textEn: "Use the washing machine with full loads only", points: 20 },
  { id: 5, textAr: "افصل الشاحن من الكهرباء عند عدم الاستخدام", textEn: "Unplug chargers when not in use", points: 10 },
  { id: 6, textAr: "نظف فلتر التكييف", textEn: "Clean your AC filter", points: 25 },
  { id: 7, textAr: "استخدم لمبات LED بدلاً من العادية", textEn: "Switch to LED bulbs", points: 30 },
];

export const RANKS = [
  { level: 1, nameAr: "مبذر", nameEn: "Spender", minPoints: 0, color: "destructive" as const },
  { level: 2, nameAr: "مبتدئ", nameEn: "Beginner", minPoints: 100, color: "secondary" as const },
  { level: 3, nameAr: "صديق للبيئة", nameEn: "Eco-Friendly", minPoints: 300, color: "default" as const },
  { level: 4, nameAr: "خبير توفير", nameEn: "Saving Expert", minPoints: 600, color: "default" as const },
];

export function getRank(points: number) {
  return [...RANKS].reverse().find(r => points >= r.minPoints) || RANKS[0];
}
