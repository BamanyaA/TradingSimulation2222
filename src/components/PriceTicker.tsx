import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../lib/utils";

interface CryptoTickerItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

const INITIAL_COINS: CryptoTickerItem[] = [
  { symbol: "BTC", name: "Bitcoin", price: 92450.00, change24h: 3.42 },
  { symbol: "ETH", name: "Ethereum", price: 3420.50, change24h: 2.15 },
  { symbol: "SOL", name: "Solana", price: 184.20, change24h: 7.84 },
  { symbol: "XRP", name: "Ripple", price: 1.15, change24h: -1.20 },
  { symbol: "ADA", name: "Cardano", price: 0.85, change24h: 4.60 },
  { symbol: "AVAX", name: "Avalanche", price: 38.40, change24h: 5.12 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.22, change24h: -2.45 },
  { symbol: "DOT", name: "Polkadot", price: 7.30, change24h: 1.80 },
  { symbol: "LINK", name: "Chainlink", price: 18.90, change24h: 3.10 },
  { symbol: "MATIC", name: "Polygon", price: 0.54, change24h: 0.95 }
];

const BINANCE_MAP: { [key: string]: { symbol: string; name: string } } = {
  "BTCUSDT": { symbol: "BTC", name: "Bitcoin" },
  "ETHUSDT": { symbol: "ETH", name: "Ethereum" },
  "SOLUSDT": { symbol: "SOL", name: "Solana" },
  "XRPUSDT": { symbol: "XRP", name: "Ripple" },
  "ADAUSDT": { symbol: "ADA", name: "Cardano" },
  "AVAXUSDT": { symbol: "AVAX", name: "Avalanche" },
  "DOGEUSDT": { symbol: "DOGE", name: "Dogecoin" },
  "DOTUSDT": { symbol: "DOT", name: "Polkadot" },
  "LINKUSDT": { symbol: "LINK", name: "Chainlink" },
  "MATICUSDT": { symbol: "MATIC", name: "Polygon" }
};

export default function PriceTicker() {
  const [coins, setCoins] = useState<CryptoTickerItem[]>(INITIAL_COINS);
  const [flashing, setFlashing] = useState<{ [key: string]: 'up' | 'down' | null }>({});

  useEffect(() => {
    let isMounted = true;

    const fetchLivePrices = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        if (!res.ok) throw new Error("Failed to fetch live prices");
        const data = await res.json();
        
        if (!isMounted) return;

        const updated: CryptoTickerItem[] = [];
        data.forEach((item: any) => {
          if (BINANCE_MAP[item.symbol]) {
            const meta = BINANCE_MAP[item.symbol];
            const price = parseFloat(item.lastPrice);
            const change24h = parseFloat(item.priceChangePercent);
            
            setCoins(prev => {
              const existing = prev.find(c => c.symbol === meta.symbol);
              if (existing && existing.price !== price) {
                const direction = price > existing.price ? 'up' : 'down';
                setFlashing(f => ({ ...f, [meta.symbol]: direction }));
                setTimeout(() => {
                  setFlashing(f => ({ ...f, [meta.symbol]: null }));
                }, 800);
              }
              return prev;
            });

            updated.push({
              symbol: meta.symbol,
              name: meta.name,
              price,
              change24h: Number(change24h.toFixed(2))
            });
          }
        });

        if (updated.length > 0) {
          setCoins(updated);
        }
      } catch (err) {
        console.warn("Using fallback simulation for ticker prices:", err);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const duplicatedCoins = [...coins, ...coins];

  return (
    <div className="w-full bg-slate-950 text-white border-y border-slate-800/80 overflow-hidden py-3 shadow-inner relative select-none flex items-center">
      <div className="flex items-center gap-2 pl-4 pr-3 border-r border-slate-800 shrink-0 z-20 bg-slate-950">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">Live Feed</span>
      </div>

      <div className="absolute left-28 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
      
      <div className="animate-marquee flex items-center gap-6 overflow-x-hidden pl-4">
        {duplicatedCoins.map((coin, index) => {
          const flash = flashing[coin.symbol];
          const isPositive = coin.change24h >= 0;

          return (
            <div 
              key={`${coin.symbol}-${index}`}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 transition-colors duration-500 shrink-0",
                flash === 'up' && "bg-emerald-950/85 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
                flash === 'down' && "bg-rose-950/85 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-black text-xs tracking-tight text-white">{coin.symbol}</span>
                <span className="text-[11px] text-slate-400 font-medium">{coin.name}</span>
              </div>
              <div className="font-mono font-bold text-xs tracking-tight text-slate-200">
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price < 10 ? 4 : 2 })}
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-[11px] font-mono font-bold",
                isPositive ? "text-emerald-400" : "text-rose-400"
              )}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{coin.change24h}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
