import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { detectCountry, getCurrencySymbol, CURRENCIES } from "../services/countryCurrency";
import { fetchExchangeRates, convertCurrency } from "../services/exchangeRates";
import { useAuth } from "./AuthContext";

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const { profile, updateProfile } = useAuth();
  const [currency, setCurrency] = useState("KES");
  const [country, setCountry] = useState({ code: "KE", name: "Kenya", flag: "🇰🇪" });
  const [detected, setDetected] = useState(false);
  const [rates, setRates] = useState({});
  const [baseCurrency] = useState("KES"); // wallet is stored in KES

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

  // Fetch exchange rates on mount
  useEffect(() => {
    fetchExchangeRates().then(setRates);
  }, []);

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

  // Convert from base (KES) wallet amount to display currency
  const convert = useCallback(
    (amount, from = baseCurrency, to = currency) =>
      convertCurrency(rates, Number(amount || 0), from, to),
    [rates, baseCurrency, currency]
  );

  const formatMoney = useCallback(
    (amount, fromCurrency = baseCurrency) => {
      const converted = convert(amount, fromCurrency, currency);
      const n = Number(converted || 0);
      return `${symbol} ${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [symbol, convert, baseCurrency, currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        country,
        symbol,
        currencies: CURRENCIES,
        changeCurrency,
        formatMoney,
        convert,
        rates,
        baseCurrency,
      }}
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
