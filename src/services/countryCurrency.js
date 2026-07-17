import axios from "axios";

const COUNTRY_CURRENCY_MAP = {
  KE: { currency: "KES", name: "Kenya", flag: "🇰🇪" },
  NG: { currency: "NGN", name: "Nigeria", flag: "🇳🇬" },
  GH: { currency: "GHS", name: "Ghana", flag: "🇬🇭" },
  UG: { currency: "UGX", name: "Uganda", flag: "🇺🇬" },
  TZ: { currency: "TZS", name: "Tanzania", flag: "🇹🇿" },
  RW: { currency: "RWF", name: "Rwanda", flag: "🇷🇼" },
  ZA: { currency: "ZAR", name: "South Africa", flag: "🇿🇦" },
  ZM: { currency: "ZMW", name: "Zambia", flag: "🇿🇲" },
  US: { currency: "USD", name: "United States", flag: "🇺🇸" },
  GB: { currency: "GBP", name: "United Kingdom", flag: "🇬🇧" },
  EU: { currency: "EUR", name: "Europe", flag: "🇪🇺" },
  IN: { currency: "INR", name: "India", flag: "🇮🇳" },
  CA: { currency: "CAD", name: "Canada", flag: "🇨🇦" },
  AU: { currency: "AUD", name: "Australia", flag: "🇦🇺" },
};

export const CURRENCIES = [
  { code: "KES", symbol: "Ksh", country: "Kenya" },
  { code: "NGN", symbol: "₦", country: "Nigeria" },
  { code: "GHS", symbol: "₵", country: "Ghana" },
  { code: "UGX", symbol: "USh", country: "Uganda" },
  { code: "TZS", symbol: "TSh", country: "Tanzania" },
  { code: "RWF", symbol: "FRw", country: "Rwanda" },
  { code: "ZAR", symbol: "R", country: "South Africa" },
  { code: "ZMW", symbol: "ZK", country: "Zambia" },
  { code: "USD", symbol: "$", country: "United States" },
  { code: "GBP", symbol: "£", country: "United Kingdom" },
  { code: "EUR", symbol: "€", country: "Europe" },
  { code: "INR", symbol: "₹", country: "India" },
  { code: "CAD", symbol: "C$", country: "Canada" },
  { code: "AUD", symbol: "A$", country: "Australia" },
];

export const getCurrencySymbol = (code) =>
  CURRENCIES.find((c) => c.code === code)?.symbol || code;

export const detectCountry = async () => {
  try {
    const { data } = await axios.get("https://ipwho.is/", { timeout: 8000 });
    const code = (data.country_code || "KE").toUpperCase();
    return {
      countryCode: code,
      countryName: data.country || "Kenya",
      currency: COUNTRY_CURRENCY_MAP[code]?.currency || data.currency?.code || "KES",
      flag: COUNTRY_CURRENCY_MAP[code]?.flag || "🌍",
    };
  } catch {
    return { countryCode: "KE", countryName: "Kenya", currency: "KES", flag: "🇰🇪" };
  }
};
