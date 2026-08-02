import axios from "axios";

const RATES_CACHE_KEY = "ushindibets_exchange_rates";
const RATES_CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const fetchExchangeRates = async () => {
  // Check cache first
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < RATES_CACHE_TTL) {
        return parsed.rates;
      }
    }
  } catch {
    // ignore cache errors
  }

  try {
    const { data } = await axios.get("https://apip.cc/rates.json", { timeout: 10000 });
    const rates = data?.rates || {};
    localStorage.setItem(
      RATES_CACHE_KEY,
      JSON.stringify({ rates, fetchedAt: Date.now() })
    );
    return rates;
  } catch {
    // Fallback: return a minimal set of common rates (USD base)
    return {
      USD: 1, KES: 129.08, NGN: 1361.61, GHS: 11.66, UGX: 3743.77,
      TZS: 2641.63, RWF: 1464.3, ZAR: 16.46, ZMW: 18.73, GBP: 0.741,
      EUR: 0.866, INR: 95.39, CAD: 1.4, AUD: 1.42,
    };
  }
};

// Convert an amount from one currency to another using USD-based rates.
export const convertCurrency = (rates, amount, fromCurrency, toCurrency) => {
  if (!rates || !fromCurrency || !toCurrency) return amount;
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  if (!fromRate || !toRate) return amount;
  // amount_in_USD = amount / fromRate; result = amount_in_USD * toRate
  return (amount / fromRate) * toRate;
};

export default { fetchExchangeRates, convertCurrency };
