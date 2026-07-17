import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { detectCountry, getCurrencySymbol, CURRENCIES } from "../services/countryCurrency";
import { useAuth } from "./AuthContext";

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const { profile, updateProfile } = useAuth();
  const [currency, setCurrency] = useState("KES");
  const [country, setCountry] = useState({ code: "KE", name: "Kenya", flag: "🇰🇪" });
  const [detected, setDetected] = useState(false);

  // Detect once on mount (if not logged in)
  useEffect(() => {
    if (profile?.currency) {
      setCurrency(profile.currency);
      setCountry({
        code: profile.country_code || "KE",
        name: profile.country_name || "Kenya",
        flag: "🌍",
      });
      return;
    }
    if (detected) return;
    detectCountry().then((d) => {
      setCurrency(d.currency);
      setCountry({ code: d.countryCode, name: d.countryName, flag: d.flag });
      setDetected(true);
    });
  }, [profile, detected]);

  const changeCurrency = useCallback(
    async (code) => {
      setCurrency(code);
      if (profile?.id) {
        try {
          await updateProfile({ currency: code });
        } catch (e) {
          console.error("currency update failed", e);
        }
      }
    },
    [profile, updateProfile]
  );

  const symbol = getCurrencySymbol(currency);

  const formatMoney = useCallback(
    (amount) => {
      const n = Number(amount || 0);
      return `${symbol} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [symbol]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, country, symbol, currencies: CURRENCIES, changeCurrency, formatMoney }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};

export default CurrencyContext;
