import React, { useState, useEffect } from "react";
import { User, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { UserProfile, Transaction, PlatformSettings, SupportMessage, FirestoreErrorInfo } from "../types";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import PriceTicker from "../components/PriceTicker";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc,
  doc, 
  serverTimestamp, 
  getDoc,
  increment 
} from "firebase/firestore";
import { 
  TrendingDown,
  Trophy,
  ArrowDownCircle,
  ArrowUpCircle,
  Copy,
  Clock, 
  FileText,
  Upload,
  MessageSquare,
  Send,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  BarChart2,
  Home,
  Bell,
  Lock,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  TrendingUp,
  ArrowLeftRight,
  Wallet
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrency, cn, compressImage, uploadOrFallback, handleFileUploadFlow } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { TradingViewWidget } from "../components/TradingViewWidget";

const CRYPTO_ASSETS = [
  { symbol: "BINANCE:BTCUSDT", name: "Bitcoin", short: "BTC", color: "bg-orange-500", icon: "₿", imageUrl: "https://assets.coincap.io/assets/icons/btc@2x.png" },
  { symbol: "BINANCE:ETHUSDT", name: "Ethereum", short: "ETH", color: "bg-blue-500", icon: "Ξ", imageUrl: "https://assets.coincap.io/assets/icons/eth@2x.png" },
  { symbol: "BINANCE:SOLUSDT", name: "Solana", short: "SOL", color: "bg-purple-500", icon: "S", imageUrl: "https://assets.coincap.io/assets/icons/sol@2x.png" },
  { symbol: "BINANCE:XRPUSDT", name: "XRP", short: "XRP", color: "bg-slate-400", icon: "X", imageUrl: "https://assets.coincap.io/assets/icons/xrp@2x.png" },
  { symbol: "BINANCE:BNBUSDT", name: "BNB", short: "BNB", color: "bg-yellow-400", icon: "B", imageUrl: "https://assets.coincap.io/assets/icons/bnb@2x.png" },
  { symbol: "BINANCE:ADAUSDT", name: "Cardano", short: "ADA", color: "bg-blue-700", icon: "₳", imageUrl: "https://assets.coincap.io/assets/icons/ada@2x.png" },
  { symbol: "BINANCE:DOGEUSDT", name: "Dogecoin", short: "DOGE", color: "bg-yellow-600", icon: "Ð", imageUrl: "https://assets.coincap.io/assets/icons/doge@2x.png" },
  { symbol: "BINANCE:TRXUSDT", name: "Tron", short: "TRX", color: "bg-red-500", icon: "T", imageUrl: "https://assets.coincap.io/assets/icons/trx@2x.png" },
  { symbol: "BINANCE:AVAXUSDT", name: "Avalanche", short: "AVAX", color: "bg-red-600", icon: "A", imageUrl: "https://assets.coincap.io/assets/icons/avax@2x.png" },
  { symbol: "BINANCE:SHIBUSDT", name: "Shiba Inu", short: "SHIB", color: "bg-orange-600", icon: "S", imageUrl: "https://assets.coincap.io/assets/icons/shib@2x.png" },
  { symbol: "BINANCE:DOTUSDT", name: "Polkadot", short: "DOT", color: "bg-pink-500", icon: "P", imageUrl: "https://assets.coincap.io/assets/icons/dot@2x.png" },
  { symbol: "BINANCE:LINKUSDT", name: "Chainlink", short: "LINK", color: "bg-blue-400", icon: "L", imageUrl: "https://assets.coincap.io/assets/icons/link@2x.png" },
  { symbol: "BINANCE:MATICUSDT", name: "Polygon", short: "MATIC", color: "bg-purple-600", icon: "M", imageUrl: "https://assets.coincap.io/assets/icons/matic@2x.png" },
  { symbol: "BINANCE:LTCUSDT", name: "Litecoin", short: "LTC", color: "bg-slate-300", icon: "Ł", imageUrl: "https://assets.coincap.io/assets/icons/ltc@2x.png" },
  { symbol: "BINANCE:NEARUSDT", name: "Near", short: "NEAR", color: "bg-slate-900", icon: "N", imageUrl: "https://assets.coincap.io/assets/icons/near@2x.png" },
  { symbol: "BINANCE:UNIUSDT", name: "Uniswap", short: "UNI", color: "bg-pink-400", icon: "U", imageUrl: "https://assets.coincap.io/assets/icons/uni@2x.png" },
  { symbol: "BINANCE:APTUSDT", name: "Aptos", short: "APT", color: "bg-teal-500", icon: "A", imageUrl: "https://assets.coincap.io/assets/icons/apt@2x.png" },
  { symbol: "BINANCE:PEPEUSDT", name: "Pepe", short: "PEPE", color: "bg-green-500", icon: "P", imageUrl: "https://assets.coincap.io/assets/icons/pepe@2x.png" },
  { symbol: "BINANCE:ARBUSDT", name: "Arbitrum", short: "ARB", color: "bg-blue-300", icon: "A", imageUrl: "https://assets.coincap.io/assets/icons/arb@2x.png" },
  { symbol: "BINANCE:OPUSDT", name: "Optimism", short: "OP", color: "bg-red-400", icon: "O", imageUrl: "https://assets.coincap.io/assets/icons/op@2x.png" },
];

const FOREX_ASSETS = [
  { symbol: "FX:EURUSD", name: "EUR/USD", short: "EURUSD", color: "bg-blue-600", icon: "€", imageUrl: "https://flagcdn.com/w80/eu.png" },
  { symbol: "FX:GBPUSD", name: "GBP/USD", short: "GBPUSD", color: "bg-indigo-600", icon: "£", imageUrl: "https://flagcdn.com/w80/gb.png" },
  { symbol: "FX:USDJPY", name: "USD/JPY", short: "USDJPY", color: "bg-red-600", icon: "¥", imageUrl: "https://flagcdn.com/w80/jp.png" },
  { symbol: "FX:AUDUSD", name: "AUD/USD", short: "AUDUSD", color: "bg-green-600", icon: "A", imageUrl: "https://flagcdn.com/w80/au.png" },
  { symbol: "FX:USDCAD", name: "USD/CAD", short: "USDCAD", color: "bg-rose-600", icon: "C", imageUrl: "https://flagcdn.com/w80/ca.png" },
  { symbol: "FX:USDCHF", name: "USD/CHF", short: "USDCHF", color: "bg-slate-600", icon: "F", imageUrl: "https://flagcdn.com/w80/ch.png" },
  { symbol: "FX:NZDUSD", name: "NZD/USD", short: "NZDUSD", color: "bg-emerald-600", icon: "N", imageUrl: "https://flagcdn.com/w80/nz.png" },
  { symbol: "FX:EURGBP", name: "EUR/GBP", short: "EURGBP", color: "bg-sky-600", icon: "£", imageUrl: "https://flagcdn.com/w80/eu.png" },
  { symbol: "FX:EURJPY", name: "EUR/JPY", short: "EURJPY", color: "bg-violet-600", icon: "¥", imageUrl: "https://flagcdn.com/w80/eu.png" },
  { symbol: "FX:GBPJPY", name: "GBP/JPY", short: "GBPJPY", color: "bg-fuchsia-600", icon: "¥", imageUrl: "https://flagcdn.com/w80/gb.png" },
  { symbol: "FX:AUDJPY", name: "AUD/JPY", short: "AUDJPY", color: "bg-cyan-600", icon: "¥", imageUrl: "https://flagcdn.com/w80/au.png" },
];

const COMMODITY_ASSETS = [
  { symbol: "OANDA:XAUUSD", name: "Gold", short: "XAU", color: "bg-yellow-600", icon: "G" },
  { symbol: "OANDA:XAGUSD", name: "Silver", short: "XAG", color: "bg-gray-300", icon: "S" },
  { symbol: "OANDA:UK100GBP", name: "UK 100", short: "UK100", color: "bg-blue-800", icon: "U" },
  { symbol: "OANDA:US30USD", name: "US Wall St 30", short: "US30", color: "bg-blue-900", icon: "A" },
  { symbol: "OANDA:XCUUSD", name: "Copper", short: "COPPER", color: "bg-orange-700", icon: "C" },
  { symbol: "OANDA:XPTUSD", name: "Platinum", short: "PLAT", color: "bg-slate-400", icon: "P" },
  { symbol: "OANDA:BCOUSD", name: "Brent Crude", short: "BRENT", color: "bg-slate-800", icon: "B" },
];

const STOCK_ASSETS = [
  { symbol: "NASDAQ:AAPL", name: "Apple Inc.", short: "AAPL", color: "bg-slate-900", icon: "", imageUrl: "https://logo.clearbit.com/apple.com" },
  { symbol: "NASDAQ:TSLA", name: "Tesla Inc.", short: "TSLA", color: "bg-red-600", icon: "T", imageUrl: "https://logo.clearbit.com/tesla.com" },
  { symbol: "NASDAQ:NVDA", name: "Nvidia Corp.", short: "NVDA", color: "bg-emerald-500", icon: "N", imageUrl: "https://logo.clearbit.com/nvidia.com" },
  { symbol: "NASDAQ:AMZN", name: "Amazon.com", short: "AMZN", color: "bg-orange-400", icon: "A", imageUrl: "https://logo.clearbit.com/amazon.com" },
  { symbol: "NASDAQ:MSFT", name: "Microsoft", short: "MSFT", color: "bg-blue-500", icon: "M", imageUrl: "https://logo.clearbit.com/microsoft.com" },
  { symbol: "NASDAQ:GOOGL", name: "Alphabet (Google)", short: "GOOGL", color: "bg-red-500", icon: "G", imageUrl: "https://logo.clearbit.com/google.com" },
  { symbol: "NASDAQ:META", name: "Meta Platforms", short: "META", color: "bg-blue-600", icon: "M", imageUrl: "https://logo.clearbit.com/facebook.com" },
  { symbol: "NYSE:BRK.B", name: "Berkshire Hathaway", short: "BRK.B", color: "bg-slate-700", icon: "B", imageUrl: "https://logo.clearbit.com/berkshirehathaway.com" },
  { symbol: "NYSE:V", name: "Visa Inc.", short: "VISA", color: "bg-blue-800", icon: "V", imageUrl: "https://logo.clearbit.com/visa.com" },
  { symbol: "NYSE:JPM", name: "J.P. Morgan", short: "JPM", color: "bg-blue-900", icon: "J", imageUrl: "https://logo.clearbit.com/jpmorganchase.com" },
  { symbol: "NYSE:WMT", name: "Walmart Inc.", short: "WMT", color: "bg-blue-400", icon: "W", imageUrl: "https://logo.clearbit.com/walmart.com" },
  { symbol: "NASDAQ:NFLX", name: "Netflix Inc.", short: "NFLX", color: "bg-red-700", icon: "N", imageUrl: "https://logo.clearbit.com/netflix.com" },
];

const INDICES_ASSETS = [
  { symbol: "CURRENCYCOM:US500", name: "S&P 500", short: "SPX", color: "bg-blue-600", icon: "S" },
  { symbol: "CURRENCYCOM:US100", name: "Nasdaq 100", short: "NDX", color: "bg-indigo-600", icon: "N" },
  { symbol: "CURRENCYCOM:US30", name: "Dow Jones 30", short: "DJI", color: "bg-blue-800", icon: "D" },
  { symbol: "CURRENCYCOM:DE40", name: "DAX 40", short: "DAX", color: "bg-yellow-600", icon: "D" },
  { symbol: "CURRENCYCOM:UK100", name: "FTSE 100", short: "FTSE", color: "bg-blue-900", icon: "F" },
  { symbol: "CURRENCYCOM:FR40", name: "CAC 40", short: "CAC", color: "bg-blue-500", icon: "C" },
  { symbol: "CURRENCYCOM:JP225", name: "Nikkei 225", short: "NKY", color: "bg-red-600", icon: "N" },
  { symbol: "CURRENCYCOM:HK50", name: "Hang Seng", short: "HSI", color: "bg-red-700", icon: "H" },
  { symbol: "CURRENCYCOM:AU200", name: "ASX 200", short: "XJO", color: "bg-indigo-700", icon: "A" },
  { symbol: "CURRENCYCOM:EU50", name: "Euro Stoxx 50", short: "SX5E", color: "bg-blue-400", icon: "E" },
  { symbol: "CURRENCYCOM:ES35", name: "IBEX 35", short: "IBEX", color: "bg-red-400", icon: "I" },
];

const BOND_ASSETS = [
  { symbol: "TVC:US10Y", name: "US 10Y Yield", short: "US10Y", color: "bg-blue-900", icon: "U" },
  { symbol: "TVC:US02Y", name: "US 2Y Yield", short: "US02Y", color: "bg-blue-700", icon: "U" },
  { symbol: "TVC:DE10Y", name: "Bund 10Y Yield", short: "DE10Y", color: "bg-yellow-600", icon: "B" },
  { symbol: "TVC:UK10Y", name: "Gilt 10Y Yield", short: "UK10Y", color: "bg-indigo-900", icon: "G" },
  { symbol: "TVC:JP10Y", name: "JGB 10Y Yield", short: "JP10Y", color: "bg-red-600", icon: "J" },
  { symbol: "TVC:IT10Y", name: "BTP 10Y Yield", short: "IT10Y", color: "bg-green-600", icon: "I" },
  { symbol: "TVC:US30Y", name: "US 30Y Yield", short: "US30Y", color: "bg-blue-400", icon: "U" },
];

const FUTURE_ASSETS = [
  { symbol: "CME:ES1!", name: "E-mini S&P 500", short: "ES", color: "bg-blue-600", icon: "F" },
  { symbol: "CME:NQ1!", name: "E-mini Nasdaq 100", short: "NQ", color: "bg-indigo-600", icon: "F" },
  { symbol: "CME:CL1!", name: "Crude Oil Futures", short: "CL", color: "bg-slate-800", icon: "F" },
  { symbol: "CME:GC1!", name: "Gold Futures", short: "GC", color: "bg-yellow-600", icon: "F" },
  { symbol: "CME:SI1!", name: "Silver Futures", short: "SI", color: "bg-slate-400", icon: "F" },
  { symbol: "CME:HG1!", name: "Copper Futures", short: "HG", color: "bg-orange-700", icon: "F" },
  { symbol: "CME:NG1!", name: "Nat Gas Futures", short: "NG", color: "bg-blue-400", icon: "F" },
];

const FUND_ASSETS = [
  { symbol: "AMEX:SPY", name: "SPDR S&P 500 ETF", short: "SPY", color: "bg-blue-600", icon: "F" },
  { symbol: "NASDAQ:QQQ", name: "Invesco QQQ Trust", short: "QQQ", color: "bg-indigo-600", icon: "F" },
  { symbol: "AMEX:IVV", name: "iShares Core S&P 500", short: "IVV", color: "bg-blue-800", icon: "F" },
  { symbol: "AMEX:VOO", name: "Vanguard S&P 500", short: "VOO", color: "bg-red-600", icon: "F" },
  { symbol: "AMEX:VTI", name: "Vanguard Total Stock", short: "VTI", color: "bg-slate-700", icon: "F" },
  { symbol: "AMEX:ARKK", name: "ARK Innovation ETF", short: "ARKK", color: "bg-purple-600", icon: "F" },
  { symbol: "AMEX:GLD", name: "SPDR Gold Shares", short: "GLD", color: "bg-yellow-600", icon: "F" },
];

const OPTION_ASSETS = [
  { symbol: "SPY260619C00500000", name: "SPY Call Jun 2026", short: "SPYC", color: "bg-emerald-500", icon: "O" },
  { symbol: "SPY260619P00500000", name: "SPY Put Jun 2026", short: "SPYP", color: "bg-rose-500", icon: "O" },
  { symbol: "QQQ260116C00450000", name: "QQQ Call Jan 2026", short: "QQQC", color: "bg-emerald-600", icon: "O" },
  { symbol: "TSLA260116C00200000", name: "TSLA Call Jan 2026", short: "TSLAC", color: "bg-emerald-400", icon: "O" },
  { symbol: "AAPL260116C00200000", name: "AAPL Call Jan 2026", short: "AAPLC", color: "bg-emerald-700", icon: "O" },
  { symbol: "NVDA260116C00100000", name: "NVDA Call Jan 2026", short: "NVDAC", color: "bg-emerald-300", icon: "O" },
  { symbol: "BTC251226C100000", name: "BTC Call Dec 2025", short: "BTCC", color: "bg-orange-500", icon: "O" },
];

const ECONOMY_ASSETS = [
  { symbol: "ECONOMY:US_CPI", name: "US Inflation (CPI)", short: "CPI", color: "bg-red-600", icon: "E" },
  { symbol: "ECONOMY:US_GDP", name: "US GDP Growth", short: "GDP", color: "bg-blue-600", icon: "E" },
  { symbol: "ECONOMY:US_UE", name: "US Unemployment", short: "UNR", color: "bg-orange-600", icon: "E" },
  { symbol: "ECONOMY:EU_CPI", name: "Eurozone Inflation", short: "ECPI", color: "bg-indigo-600", icon: "E" },
  { symbol: "ECONOMY:UK_GDP", name: "UK GDP Growth", short: "UGDP", color: "bg-blue-900", icon: "E" },
  { symbol: "ECONOMY:CN_GDP", name: "China GDP Growth", short: "CGDP", color: "bg-red-700", icon: "E" },
  { symbol: "ECONOMY:JP_CPI", name: "Japan Inflation", short: "JCPI", color: "bg-red-500", icon: "E" },
];

const ALL_ASSETS = [...CRYPTO_ASSETS, ...FOREX_ASSETS, ...COMMODITY_ASSETS, ...STOCK_ASSETS, ...INDICES_ASSETS, ...BOND_ASSETS, ...FUTURE_ASSETS, ...FUND_ASSETS, ...OPTION_ASSETS, ...ECONOMY_ASSETS];

interface DashboardProps {
  user: User;
  profile: UserProfile | null;
  refreshProfile: () => void;
}

const ASSET_DURATIONS = [
  { s: 30, r: 5, activeBg: "bg-blue-600 border-blue-500 shadow-blue-500/30", badgeBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  { s: 60, r: 12, activeBg: "bg-cyan-600 border-cyan-500 shadow-cyan-500/30", badgeBg: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  { s: 90, r: 15, activeBg: "bg-emerald-600 border-emerald-500 shadow-emerald-500/30", badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  { s: 120, r: 22, activeBg: "bg-amber-600 border-amber-500 shadow-amber-500/30", badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  { s: 180, r: 30, activeBg: "bg-purple-600 border-purple-500 shadow-purple-500/30", badgeBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  { s: 300, r: 40, activeBg: "bg-rose-600 border-rose-500 shadow-rose-500/30", badgeBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20" }
];

export default function Dashboard({ user, profile, refreshProfile }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "market" | "trade" | "asset" | "account">("home");
  const [activeMarketTab, setActiveMarketTab] = useState<"crypto" | "forex" | "gold" | "stock" | "indices" | "future" | "fund" | "option" | "economy" | "bond">("crypto");
  const [activeTradeSubTab, setActiveTradeSubTab] = useState<"positions" | "history">("positions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [marketData, setMarketData] = useState<Record<string, { price: string, change: string, isUp: boolean }>>({});
  const [marketSearch, setMarketSearch] = useState("");
  const [tradeAmount, setTradeAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawName, setWithdrawName] = useState(profile?.fullName || "");
  const [isTrading, setIsTrading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawType, setWithdrawType] = useState("USDT (ERC20)");
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [full_name, setFullName] = useState(profile?.fullName || "");
  const [phone_number, setPhoneNumber] = useState(profile?.phoneNumber || "");
  const [address_val, setAddressVal] = useState(profile?.address || "");
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationDoc, setVerificationDoc] = useState<string | null>(profile?.verificationDoc || null);

  const handleVerificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUploadFlow(file, setVerificationDoc, "optDoc", "Document uploaded and optimized!");
    }
  };

  useEffect(() => {
    if (profile?.fullName) {
      setWithdrawName(profile.fullName);
    }
  }, [profile]);

  // Initialize and update market data for "Live" accuracy
  useEffect(() => {
    // 1. WebSocket for Crypto (Real-time)
    const cryptoPairs = CRYPTO_ASSETS.map(a => (a.short + "USDT").toLowerCase());
    const streams = cryptoPairs.map(p => `${p}@ticker`).join("/");
    let ws: WebSocket | null = null;
    let isWsActive = false;

    const connectWS = () => {
      try {
        ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        
        ws.onmessage = (event) => {
          isWsActive = true;
          const data = JSON.parse(event.data);
          const stream = data.stream;
          const ticker = data.data;
          
          const asset = CRYPTO_ASSETS.find(a => (a.short + "USDT").toLowerCase() === ticker.s.toLowerCase());
          if (asset) {
            const price = parseFloat(ticker.c);
            const change = parseFloat(ticker.P);
            
            setMarketData(prev => ({
              ...prev,
              [asset.symbol]: {
                price: price.toLocaleString("en-US", { 
                  minimumFractionDigits: price < 1 ? 4 : 2, 
                  maximumFractionDigits: price < 1 ? 4 : 2 
                }),
                change: change.toFixed(2),
                isUp: change >= 0
              }
            }));
          }
        };

        ws.onerror = (e) => {
          isWsActive = false;
          // Silent fallback to avoid throwing loud console exceptions in structured sandbox frames
          console.warn("Binance WS offline or blocked in current environment. Local backup price feed simulation activated.");
        };

        ws.onclose = () => {
          isWsActive = false;
          console.warn("Binance WS Closed, reconnecting with simulation fallback active...");
          setTimeout(connectWS, 5000);
        };
      } catch (err) {
        isWsActive = false;
        console.warn("Failed to connect to Binance WebSocket, active Local backup loop.", err);
      }
    };

    connectWS();

    // 2. Fetcher for Non-Crypto (Poll/Simulation)
    const fetchMarketData = async () => {
      // Update with simulation for commodities/stocks/etc
      const updateWithSimulation = (currentData: Record<string, { price: string, change: string, isUp: boolean }>) => {
        const newData = { ...currentData };
        
        ALL_ASSETS.forEach(asset => {
          // SKIP simulation for crypto if we have active WS data
          const isCrypto = CRYPTO_ASSETS.some(ca => ca.symbol === asset.symbol);
          
          if (!newData[asset.symbol]) {
            let basePrice = 1.0;
            if (asset.short === "BTC") basePrice = 81469.34;
            else if (asset.short === "ETH") basePrice = 3120.50;
            else if (asset.short === "SOL") basePrice = 148.20;
            else if (asset.short === "XAU") basePrice = 4681.25;
            else if (asset.short === "XAG") basePrice = 54.20;
            else if (asset.short === "UK100") basePrice = 8415.50;
            else if (asset.short === "US30") basePrice = 39120.00;
            else if (asset.short === "BRENT") basePrice = 84.15;
            else if (asset.short === "COPPER") basePrice = 4.85;
            else if (asset.short === "PLAT") basePrice = 1045.20;
            else if (asset.short === "AAPL") basePrice = 184.20;
            else if (asset.short === "TSLA") basePrice = 172.50;
            else if (asset.short === "NVDA") basePrice = 902.50;
            else if (asset.short === "SPX") basePrice = 5180.20;
            else if (asset.short === "NDX") basePrice = 18120.40;
            else if (asset.short === "US10Y") basePrice = 4.45;
            else if (asset.short === "CPI") basePrice = 3.4;
            else if (asset.short === "ES") basePrice = 5210.50;
            else if (asset.short === "SPY") basePrice = 515.40;
            else if (asset.short === "QQQ") basePrice = 442.80;
            else if (asset.short === "BNB") basePrice = 585.00;
            else if (asset.short === "LINK") basePrice = 14.50;
            else if (asset.short === "EURUSD") basePrice = 1.0765;
            else if (asset.short === "GBPUSD") basePrice = 1.2520;
            else if (asset.short === "USDJPY") basePrice = 154.40;
            
            const randomChange = ((Math.random() * 2) - 0.5).toFixed(2);
            newData[asset.symbol] = { 
              price: basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 }), 
              change: randomChange, 
              isUp: parseFloat(randomChange) >= 0 
            };
          }
          
          // Simulation of live price movement for NON-CRYPTO, or CRYPTO when WS is offline
          if (!isCrypto || !isWsActive) {
            const priceObj = newData[asset.symbol];
            const priceStr = priceObj.price.replace(/,/g, '');
            const currentPrice = parseFloat(priceStr);
            
            if (!isNaN(currentPrice)) {
              let volatility = 0.0002;
              if (asset.short.includes("USD") || asset.short.includes("EUR")) volatility = 0.00005;
              if (asset.short === "NVDA") volatility = 0.0008;
              if (isCrypto) volatility = 0.0005; // Crypto is extra volatile!

              const jitter = (Math.random() - 0.498) * (currentPrice * volatility);
              const nextPrice = currentPrice + jitter;
              const decimals = (asset.short.length > 3 && !asset.short.includes("US") && !asset.short.includes("SPY")) ? 4 : 2;
              
              newData[asset.symbol] = {
                ...priceObj,
                price: nextPrice.toLocaleString("en-US", { 
                  minimumFractionDigits: decimals, 
                  maximumFractionDigits: decimals 
                }),
                change: (parseFloat(priceObj.change) + (Math.random() - 0.5) * 0.01).toFixed(2),
                isUp: parseFloat(priceObj.change) >= 0
              };
            }
          }
        });
        return newData;
      };

      setMarketData(prev => {
        let newData = { ...prev };
        
        // Fetch Forex (Free API fallback)
        const fetchForex = async () => {
          try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            if (response.ok) {
              const data = await response.json();
              const rates = data.rates;
              FOREX_ASSETS.forEach(asset => {
                if (asset.short.startsWith("USD")) {
                  const target = asset.short.slice(3);
                  if (rates[target]) {
                    newData[asset.symbol] = {
                      price: rates[target].toLocaleString("en-US", { minimumFractionDigits: 4 }),
                      change: (Math.random() * 0.8).toFixed(2),
                      isUp: Math.random() > 0.5
                    };
                  }
                } else if (asset.short.endsWith("USD")) {
                  const source = asset.short.slice(0, 3);
                  if (rates[source]) {
                    const price = 1 / rates[source];
                    newData[asset.symbol] = {
                      price: price.toLocaleString("en-US", { minimumFractionDigits: 4 }),
                      change: (Math.random() * 0.8).toFixed(2),
                      isUp: Math.random() > 0.5
                    };
                  }
                }
              });
            }
          } catch (e) { console.warn("Forex fetch failed", e); }
        };

        fetchForex();
        return updateWithSimulation(newData);
      });
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2000);
    
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);
  const [depositAmount, setDepositAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [showTradeConfirm, setShowTradeConfirm] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showTradeSuccess, setShowTradeSuccess] = useState(false);
  const [tradeResult, setTradeResult] = useState<{ 
    isWin: boolean; 
    amount: number; 
    profit: number; 
    percentage: number; 
    entryPrice: number; 
    exitPrice: number; 
    totalReturn: number; 
    seconds: number;
    symbol: string;
    timestamp: string;
  } | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedDepositCoin, setSelectedDepositCoin] = useState<keyof PlatformSettings>("btc_address");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTrading && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (isTrading && timeLeft === 0) {
      finalizeTrade();
    }
    return () => clearInterval(timer);
  }, [isTrading, timeLeft]);

  const isSettlingRef = React.useRef(false);
  const tradeDetailsRef = React.useRef<{ tradeId: string; amount: number; seconds: number; symbol: string } | null>(null);

  const finalizeTrade = async () => {
    if (!tradeDetailsRef.current || isSettlingRef.current || !user) return;
    isSettlingRef.current = true;
    const details = tradeDetailsRef.current;
    tradeDetailsRef.current = null;
    const { tradeId, amount, seconds, symbol } = details;

    try {
      let success = false;
      let data: any = null;

      try {
        const res = await fetch("/api/trade/settle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            amount,
            seconds,
            symbol,
            tradeId
          })
        });

        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          data = await res.json();
          if (data && data.success) {
            success = true;
          }
        }
      } catch (apiErr) {
        console.warn("API trade settle network fallback:", apiErr);
      }

      let isWin = false;
      let profitVal = 0;
      let percentage = 5;
      let entryPrice = 4200.00;
      let exitPrice = 4220.00;
      let totalReturn = 0;
      let finalAmount = 0;

      if (success && data) {
        isWin = data.isWin;
        profitVal = data.profit;
        percentage = data.percentage;
        entryPrice = data.entryPrice;
        exitPrice = data.exitPrice;
        totalReturn = data.totalReturn;
        finalAmount = data.finalAmount;

        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { balance: data.balance });
        } catch (fsUpdateErr) {
          console.warn("Client Firestore balance sync warning:", fsUpdateErr);
        }
      } else {
        // Robust client-side fallback to guarantee database balance synchronization
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.exists() ? userSnap.data() : { balance: profile?.balance || 0, tradeAction: true };
        
        isWin = userData.tradeAction !== undefined ? userData.tradeAction : Math.random() > 0.5;
        const durationObj = [
          { s: 30, r: 5 },
          { s: 60, r: 12 },
          { s: 90, r: 15 },
          { s: 120, r: 22 },
          { s: 180, r: 30 },
          { s: 300, r: 40 }
        ].find((d: any) => d.s === seconds);
        const returnPercent = durationObj ? durationObj.r / 100 : 0.05;
        const lossPercent = (seconds / 30) * 0.05;

        let updatedBalance = userData.balance || 0;
        if (isWin) {
          profitVal = Number((amount * returnPercent).toFixed(2));
          updatedBalance = Number(((userData.balance || 0) + profitVal).toFixed(2));
          totalReturn = Number((amount + profitVal).toFixed(2));
          finalAmount = amount + profitVal;
        } else {
          profitVal = Number(amount); // loss amount
          updatedBalance = Number((Math.max(0, (userData.balance || 0) - amount)).toFixed(2));
          totalReturn = 0;
          finalAmount = 0;
        }

        entryPrice = 4200 + Math.random() * 100;
        exitPrice = entryPrice * (isWin ? (1 + returnPercent) : 0.95);
        percentage = isWin ? (returnPercent * 100) : -100;

        // Update database balance immediately
        try {
          await updateDoc(userDocRef, { balance: updatedBalance });
        } catch (dbErr) {
          console.warn("Firestore balance update fallback skipped:", dbErr);
        }

        // Record transaction in transactions collection
        try {
          const txRef = doc(collection(db, "transactions"));
          await setDoc(txRef, {
            id: txRef.id,
            userId: user.uid,
            userEmail: user.email || "",
            userName: profile?.fullName || user.email?.split("@")[0] || "User",
            type: "trade",
            asset: symbol.split(":").pop() || symbol,
            tradeType: isWin ? "WIN" : "LOSS",
            entryPrice,
            exitPrice,
            investmentAmount: Number(amount),
            profitOrLoss: isWin ? profitVal : -Number(amount),
            amount: isWin ? profitVal : Number(amount),
            status: "completed",
            symbol,
            details: `${isWin ? "WIN" : "LOSS"} | Asset: ${symbol.split(":").pop()} | ${seconds}s Duration | Entry: $${entryPrice.toFixed(2)} | Exit: $${exitPrice.toFixed(2)} | Investment: $${Number(amount).toFixed(2)} | ${isWin ? "Profit: +" + profitVal.toFixed(2) : "Loss: -" + Number(amount).toFixed(2)} USDT`,
            createdAt: serverTimestamp()
          });
        } catch (txErr) {
          console.warn("Firestore transaction log fallback skipped:", txErr);
        }
      }

      refreshProfile();
      if (fetchTransactions) fetchTransactions();
      toast.dismiss("trade");
      setTradeResult({ 
        isWin, 
        amount, 
        profit: profitVal,
        percentage: percentage || (isWin ? 5 : -5),
        entryPrice: entryPrice || 4200.00,
        exitPrice: exitPrice || 4220.00,
        totalReturn: totalReturn || (isWin ? amount + profitVal : Math.max(0, amount - profitVal)),
        seconds,
        symbol,
        timestamp: new Date().toLocaleString()
      });
      setShowTradeSuccess(true);
      
      if (isWin) {
        toast.success(
          <span className="text-gray-800">Congratulations! 🚀💰🎉 <span className="font-bold text-green-600">WIN</span></span>, 
          { 
            icon: <Trophy className="w-5 h-5 text-yellow-500" />,
            duration: 6000 
          }
        );
      } else {
        toast.error(
          <span className="text-gray-800">Sorry 📉😟⚠️ <span className="font-bold text-red-600">Loss</span></span>, 
          { 
            icon: <TrendingDown className="w-5 h-5 text-red-500" />,
            duration: 6000 
          }
        );
      }
    } catch (error) {
      toast.dismiss("trade");
      console.warn("Trade settlement handled securely:", error);
    } finally {
      isSettlingRef.current = false;
      setIsTrading(false);
      setTimeLeft(null);
      tradeDetailsRef.current = null;
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions?uid=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      }
    } catch (err) {
      console.warn("Transactions fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000);

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "addresses");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as PlatformSettings);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "settings/addresses");
      }
    };

    fetchSettings();
    
    const chatQ = query(
      collection(db, "support_messages"),
      where("userId", "==", user.uid)
    );
    const chatUnsub = onSnapshot(chatQ, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportMessage));
      msgs.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
        return tA - tB;
      });
      setMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.GET, "support_messages"));

    return () => {
      clearInterval(interval);
      chatUnsub();
    };
  }, [user.uid]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied!");
  };

  const handlePlaceTrade = async () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount < 100) {
      toast.error("Minimum trade amount is $100");
      return;
    }

    if (!profile || profile.balance < amount) {
      toast.error("Insufficient balance");
      return;
    }
    
    setShowTradeConfirm(false);
    setIsTrading(true);
    setTimeLeft(selectedDuration);
    const tradeId = "tr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    tradeDetailsRef.current = { tradeId, amount, seconds: selectedDuration, symbol: selectedAsset.symbol };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "support_messages"), {
        userId: user.uid,
        senderId: user.uid,
        senderEmail: user.email,
        text: newMessage,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message: " + (error instanceof Error ? error.message : "Unknown error"));
      try {
        handleFirestoreError(error, OperationType.WRITE, "support_messages");
      } catch (e) {
        console.error("Support message sync error:", e);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
     if (!full_name.trim() || !phone_number.trim() || !address_val.trim() || !verificationDoc) {
       toast.error("Please fill in all fields and upload a document");
       return;
     }
 
     setIsSubmittingVerification(true);
     try {
       let success = false;
       try {
         const res = await fetch("/api/users/verify", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             uid: user.uid,
             fullName: full_name,
             phoneNumber: phone_number,
             address: address_val,
             verificationDoc: verificationDoc
           })
         });

         const contentType = res.headers.get("content-type");
         if (res.ok && contentType && contentType.includes("application/json")) {
           success = true;
         }
       } catch (apiErr) {
         console.warn("API verify network fallback:", apiErr);
       }

       if (!success) {
         await setDoc(doc(db, "users", user.uid), {
           fullName: full_name,
           phoneNumber: phone_number,
           address: address_val,
           verificationDoc: verificationDoc,
           verificationStatus: "pending",
           isVerified: false
         }, { merge: true });
       }

       toast.success("Verification submitted for review!");
       setShowVerificationForm(false);
       refreshProfile();
     } catch (error) {
       toast.error("Failed to submit: " + (error instanceof Error ? error.message : "Unknown error"));
     } finally {
       setIsSubmittingVerification(false);
     }
   };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!profile || profile.balance < amount) {
      toast.error("Insufficient balance");
      return;
    }

    if (!withdrawName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!withdrawAddress.trim()) {
      toast.error("Please enter a withdrawal address");
      return;
    }

    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          amount,
          withdrawName: withdrawName.trim(),
          withdrawAddress: withdrawAddress.trim(),
          withdrawType
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Withdrawal failed");
      }

      setWithdrawAmount("");
      setWithdrawAddress("");
      setShowWithdrawModal(false);
      toast.success("Withdrawal request submitted successfully!");
      refreshProfile();
      if (fetchTransactions) fetchTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUploadFlow(file, setReceiptFile, "optRec", "Receipt uploaded successfully!");
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          amount,
          receipt: receiptFile || "deposit_receipt"
        })
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        await setDoc(doc(db, "users", user.uid), {
          balance: increment(amount),
          isVerified: true,
          verificationStatus: "verified",
          tradeAction: true
        }, { merge: true });
      } else {
        await res.json();
      }

      setDepositAmount("");
      setReceiptFile(null);
      setShowDepositModal(false);
      toast.success(`Payment of $${amount} successful! Full access unlocked instantly.`);
      if (refreshProfile) refreshProfile();
    } catch (error) {
      toast.error("Failed to process payment: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const getMarketAssets = () => {
    let assets: any[] = CRYPTO_ASSETS;
    switch (activeMarketTab) {
      case "forex": assets = FOREX_ASSETS; break;
      case "gold": assets = COMMODITY_ASSETS; break;
      case "stock": assets = STOCK_ASSETS; break;
      case "indices": assets = INDICES_ASSETS; break;
      case "future": assets = FUTURE_ASSETS; break;
      case "fund": assets = FUND_ASSETS; break;
      case "option": assets = OPTION_ASSETS; break;
      case "economy": assets = ECONOMY_ASSETS; break;
      case "bond": assets = BOND_ASSETS; break;
      default: assets = CRYPTO_ASSETS; break;
    }
    
    if (marketSearch.trim()) {
      const search = marketSearch.toLowerCase();
      return assets.filter(a => 
        a.name.toLowerCase().includes(search) || 
        a.short.toLowerCase().includes(search)
      );
    }
    return assets;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      toast.success("Password changed successfully!");
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      const errMessage = error instanceof Error ? error.message : "Password change failed";
      if ((error as any).code === 'auth/wrong-password') {
        toast.error("Incorrect current password");
      } else {
        toast.error("Password change failed: " + errMessage);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderHome = () => (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-6 py-4 flex gap-4">
        <div className="flex-1 glass-card rounded-2xl flex items-center px-5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
          <Search className="w-5 h-5 text-slate-500 mr-3" />
          <input 
            type="text" 
            placeholder="Search all assets..." 
            className="bg-transparent border-none outline-none w-full py-4 text-sm font-medium text-white placeholder:text-slate-500" 
            value={marketSearch}
            onChange={(e) => setMarketSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Premium Hero Slider-style Banner */}
      <div className="mx-6 group relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
        <div className="relative glass-card rounded-[2.5rem] p-10 overflow-hidden min-h-[400px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
             <BarChart2 className="w-64 h-64 text-indigo-500" />
          </div>
          
          <div className="relative z-10 max-w-lg">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Live Market Analysis
             </div>
             <h2 className="text-5xl font-display font-black text-slate-900 mb-6 leading-tight tracking-tight">
                Global Financial <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 italic">Ecosystem</span>
             </h2>
             <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                Connect to institutional liquidity pools with real-time analytics and lightning-fast execution on over 200+ instruments.
             </p>
             <button 
                onClick={() => setActiveTab("trade")}
                className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all active:scale-95 shadow-2xl"
             >
                Launch Terminal <ChevronRight className="w-5 h-5" />
             </button>
          </div>

          <div className="absolute right-10 bottom-10 hidden lg:block">
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [20, Math.random() * 60 + 40, 20] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 bg-indigo-500/20 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h3 className="text-xl font-display font-bold flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-indigo-500" />
              Market Overview
           </h3>
           <div className="flex p-1 glass-card rounded-xl gap-1">
              {["crypto", "forex", "gold", "stock"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveMarketTab(tab as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    activeMarketTab === tab ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab}
                </button>
              ))}
           </div>
        </div>

        <div className="glass-card rounded-[2rem] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-6 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instrument</th>
                <th className="text-right py-6 px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price / 24h Change</th>
              </tr>
            </thead>
            <tbody>
              {getMarketAssets().slice(0, 15).map((asset) => (
                <tr 
                  key={asset.symbol} 
                  onClick={() => {
                    setSelectedAsset(asset);
                    setActiveTab("trade");
                  }}
                  className="border-b border-slate-200 last:border-0 hover:bg-slate-100 cursor-pointer transition-colors group"
                >
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 overflow-hidden relative shadow-lg group-hover:scale-110 transition-transform", asset.color)}>
                        <span className="absolute inset-0 flex items-center justify-center text-sm">{asset.icon}</span>
                        {(asset as any).imageUrl && (
                          <img 
                            src={(asset as any).imageUrl} 
                            alt={asset.name} 
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = '0';
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base tracking-tight">{asset.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{asset.short}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex flex-col items-end">
                      <div className="text-base font-mono font-bold text-slate-900 tracking-tighter">
                        {marketData[asset.symbol]?.price || "0.00"}
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold flex items-center gap-1",
                        marketData[asset.symbol]?.isUp ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {marketData[asset.symbol]?.isUp ? "+" : ""}{marketData[asset.symbol]?.change || "0.00"}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
             <button 
                onClick={() => setActiveMarketTab("crypto")}
                className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white transition-colors"
             >
                Explore Full Market Directory
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrading = () => (
    <div className="space-y-6 pb-64 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl opacity-60" />
            <div className="relative z-10 flex justify-between items-center mb-8">
              <div className="space-y-1">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Trading Balance</div>
                <div className="text-4xl font-display font-black text-white tracking-tighter">{formatCurrency(profile?.balance || 0)}</div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Account Status</div>
                <div className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">Active</div>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab("asset")}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px]"
              >
                Top Up Funds
              </button>
              <button 
                onClick={() => setActiveTradeSubTab(activeTradeSubTab === "positions" ? "history" : "positions")}
                className="px-6 py-4 glass-card-light rounded-2xl text-white font-black transition-all active:scale-95 text-[10px] uppercase tracking-widest"
              >
                {activeTradeSubTab === "positions" ? "View History" : "Back to Terminal"}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-[2.5rem] overflow-hidden">
            <div className="min-h-[500px]">
              {activeTradeSubTab === "positions" ? (
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-xl overflow-hidden relative", selectedAsset.color)}>
                        <span className="absolute inset-0 flex items-center justify-center text-xl">{(selectedAsset as any).icon}</span>
                        {(selectedAsset as any).imageUrl && (
                          <img 
                            src={(selectedAsset as any).imageUrl} 
                            alt={selectedAsset.name} 
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" 
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = '0';
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-display font-black text-slate-900 text-xl tracking-tight uppercase">{selectedAsset.short}/USDT</div>
                        <div className="text-[10px] text-emerald-600 font-black animate-pulse uppercase tracking-[0.2em] flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                          Live Stream
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-mono font-black text-slate-900 tracking-tighter">
                        {marketData[selectedAsset.symbol]?.price || "0.00"}
                      </div>
                      <div className={cn(
                        "text-xs font-black uppercase mt-1",
                        marketData[selectedAsset.symbol]?.isUp ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {marketData[selectedAsset.symbol]?.isUp ? "▲ +" : "▼ "}{marketData[selectedAsset.symbol]?.change || "0.00"}%
                      </div>
                    </div>
                  </div>
                  <div className="h-[400px] mb-8 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner bg-slate-100 group">
                    <TradingViewWidget symbol={selectedAsset.symbol} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowOptionModal(true)}
                      className="py-5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.3em] text-[10px]"
                    >
                      Instant Buy
                    </button>
                    <button 
                      onClick={() => setShowOptionModal(true)}
                      className="py-5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.3em] text-[10px]"
                    >
                      Instant Sell
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {transactions.filter(t => t.type === "trade").length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                      <FileText className="w-16 h-16 mb-6 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">No Protocol Execution Data</span>
                    </div>
                  ) : (
                    transactions.filter(t => t.type === "trade").map((tx) => (
                      <div key={tx.id} className="bg-slate-100 p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between group hover:bg-slate-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg",
                            tx.details?.includes("WIN") ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {tx.details?.includes("WIN") ? <ArrowUpCircle /> : <ArrowDownCircle />}
                          </div>
                          <div>
                            <div className="font-display font-black text-slate-900 text-base">{tx.symbol?.split(":").pop() || "Trade"}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              {tx.createdAt?.toDate?.()?.toLocaleString() || "Pending..." }
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-mono font-black text-base",
                            tx.details?.includes("WIN") ? "text-emerald-700" : "text-rose-700"
                          )}>
                            {tx.details?.includes("WIN") ? "+" : "-"}{formatCurrency(tx.amount)}
                          </div>
                          <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-96 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-6 h-full">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Live Assets</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
               {getMarketAssets().map(asset => (
                 <div 
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset)}
                  className={cn(
                    "p-4 rounded-2xl border border-slate-100 cursor-pointer transition-all flex items-center justify-between group",
                    selectedAsset.symbol === asset.symbol ? "bg-indigo-50 border-indigo-200" : "bg-white hover:bg-slate-100"
                  )}
                 >
                    <div className="flex items-center gap-3">
                       <div className={cn("w-10 h-10 rounded-xl overflow-hidden relative", asset.color)}>
                          <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs">{asset.icon}</span>
                       </div>
                       <div>
                          <div className="text-sm font-black text-slate-900">{asset.short}</div>
                          <div className="text-[10px] text-slate-400">{asset.name}</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-mono font-bold text-slate-900">{marketData[asset.symbol]?.price || "0.00"}</div>
                       <div className={cn("text-[10px] font-bold", marketData[asset.symbol]?.isUp ? "text-emerald-600" : "text-rose-600")}>
                          {marketData[asset.symbol]?.change || "0.00"}%
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarket = () => (
    <div className="space-y-6 pb-64 animate-in fade-in duration-500">
      <div className="mb-4">
        <PriceTicker />
      </div>
      <div className="glass-card rounded-[2.5rem] p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Global Markets</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time quotes & live streaming assets</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={marketSearch}
              onChange={(e) => setMarketSearch(e.target.value)}
              placeholder="Search assets (e.g. BTC, EUR, AAPL)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {[
            { id: "crypto", label: "Crypto" },
            { id: "forex", label: "Forex" },
            { id: "gold", label: "Commodities" },
            { id: "stock", label: "Stocks" },
            { id: "indices", label: "Indices" },
            { id: "bond", label: "Bonds" },
            { id: "future", label: "Futures" },
            { id: "fund", label: "Funds" },
            { id: "option", label: "Options" },
            { id: "economy", label: "Economy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMarketTab(tab.id as any)}
              className={cn(
                "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
                activeMarketTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getMarketAssets().map(asset => (
            <div 
              key={asset.symbol}
              onClick={() => {
                setSelectedAsset(asset);
                setActiveTab("trade");
              }}
              className="p-6 bg-white hover:bg-indigo-50/50 border border-slate-200 rounded-[2rem] cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl overflow-hidden relative shadow-md flex items-center justify-center text-white font-bold", asset.color)}>
                  <span>{asset.icon}</span>
                </div>
                <div>
                  <div className="font-display font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{asset.short}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{asset.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-slate-900 text-base">{marketData[asset.symbol]?.price || "0.00"}</div>
                <div className={cn("text-xs font-black mt-1", marketData[asset.symbol]?.isUp ? "text-emerald-600" : "text-rose-600")}>
                  {marketData[asset.symbol]?.isUp ? "▲ +" : "▼ "}{marketData[asset.symbol]?.change || "0.00"}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAsset = () => (
    <div className="space-y-8 pb-64 animate-in fade-in duration-500">
      <div className="glass-card rounded-[3rem] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Portfolio Value</div>
            <div className="text-5xl font-display font-black text-slate-900 tracking-tighter">{formatCurrency(profile?.balance || 0)}</div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowDepositModal(true)}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" /> Deposit
            </button>
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-black rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <ArrowUpCircle className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Available Margin</div>
            <div className="text-2xl font-mono font-black text-slate-900">{formatCurrency(profile?.balance || 0)}</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Locked in Trades</div>
            <div className="text-2xl font-mono font-black text-slate-900">{formatCurrency(0)}</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Account Status</div>
            <div className="text-2xl font-display font-black text-emerald-600">Active / Verified</div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8">
        <h3 className="text-lg font-display font-black text-slate-900 mb-6">Asset & Transaction History</h3>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No asset history recorded yet</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0",
                    tx.type === "deposit" ? "bg-emerald-50 text-emerald-600" :
                    tx.type === "withdraw" ? "bg-rose-50 text-rose-600" :
                    tx.tradeType === "WIN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {tx.type === "deposit" ? <ArrowDownCircle /> : tx.type === "withdraw" ? <ArrowUpCircle /> : <BarChart2 />}
                  </div>
                  <div>
                    <div className="font-display font-black text-slate-900 text-base flex items-center gap-3">
                      <span>{tx.type === "trade" ? `${tx.asset || tx.symbol || "Trade"} Trade` : tx.type.toUpperCase()}</span>
                      {tx.type === "trade" && (
                        <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider", tx.tradeType === "WIN" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                          {tx.tradeType || "CLOSED"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1.5 flex flex-wrap gap-4 font-mono">
                      {tx.type === "trade" && (
                        <>
                          <span>Entry: <strong className="text-slate-900">${tx.entryPrice?.toFixed(2)}</strong></span>
                          <span>Exit: <strong className="text-slate-900">${tx.exitPrice?.toFixed(2)}</strong></span>
                          <span>Investment: <strong className="text-slate-900">${tx.investmentAmount?.toFixed(2)}</strong></span>
                        </>
                      )}
                      <span>Date: <strong className="text-slate-900">{tx.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "font-mono font-black text-base",
                    tx.type === "trade" 
                      ? (tx.tradeType === "WIN" ? "text-emerald-600" : "text-rose-600")
                      : "text-slate-900"
                  )}>
                    {tx.type === "trade" 
                      ? `${tx.tradeType === "WIN" ? "+" : "-"}$${Math.abs(tx.profitOrLoss || tx.amount).toFixed(2)}`
                      : formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-400">
                    {tx.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderPersonal = () => (
    <div className="space-y-8 pb-64 animate-in fade-in duration-500">
      <div className="relative glass-card rounded-[3rem] overflow-hidden p-12 mx-4">
        <div className="absolute top-0 right-0 p-20 opacity-10 blur-3xl rounded-full bg-indigo-500 -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-2xl">
            <div className="w-full h-full rounded-[2.5rem] bg-white flex items-center justify-center font-display font-black text-4xl text-slate-900">
              {profile?.fullName?.slice(0, 1).toUpperCase() || user.email?.slice(0, 1).toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-display font-black text-slate-900 mb-2 tracking-tight">{profile?.fullName || (user.email ? user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") : "User")}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <div className="px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Node ID: {user?.uid.slice(0, 12)}
               </div>
               <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  profile?.verificationStatus === "verified" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  profile?.verificationStatus === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                  "bg-slate-100 text-slate-400 border-slate-200"
               )}>
                  {profile?.verificationStatus || "Unverified"}
               </div>
            </div>
          </div>

          <div className="text-center md:text-right">
             <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 font-mono">Portfolio Value</div>
             <div className="text-5xl font-display font-black text-slate-900 tracking-tighter">{formatCurrency(profile?.balance || 0)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-12 pt-12 border-t border-slate-100 relative z-10">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-3 py-5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all active:scale-95"
          >
            <ArrowUpCircle className="w-5 h-5" /> Withdraw Capital
          </button>
          <button 
            onClick={() => setShowDepositModal(true)}
            className="flex items-center justify-center gap-3 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-95 transition-all"
          >
            <ArrowDownCircle className="w-5 h-5" /> Deposit Funds
          </button>
        </div>
      </div>

      <div className="mx-4 space-y-6">
        {profile?.verificationStatus === "pending" && (
          <div className="p-6 glass-card border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-3 text-amber-400">
              <Clock className="w-5 h-5" />
              <p className="text-xs font-black uppercase tracking-widest">Protocol Verification Pending</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Your credentials have been submitted for review. This typically takes 24-48 business hours.</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-[2.5rem] p-8">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Security & Identity</h3>
             <div className="space-y-4">
                  <button 
                    onClick={() => {
                      setFullName(profile?.fullName || "");
                      setPhoneNumber(profile?.phoneNumber || "");
                      setAddressVal(profile?.address || "");
                      setVerificationDoc(profile?.verificationDoc || null);
                      setShowVerificationForm(true);
                    }}
                    className="w-full p-6 bg-slate-100 rounded-2xl flex items-center justify-between group hover:bg-slate-200 transition-all text-left border border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                         <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                         <div className="font-bold text-slate-900 text-sm">Identity Verification</div>
                         <div className="text-[10px] text-slate-400 font-medium">
                           Status: <span className={cn(
                             "font-black uppercase",
                             profile?.verificationStatus === "verified" ? "text-emerald-600" :
                             profile?.verificationStatus === "pending" ? "text-amber-600" :
                             profile?.verificationStatus === "rejected" ? "text-rose-600" : "text-slate-500"
                           )}>{profile?.verificationStatus || "Unverified"}</span>
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                        {profile?.verificationStatus === "verified" ? "Verified" : profile?.verificationStatus === "pending" ? "Reviewing" : "Verify Now"}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-full p-6 bg-slate-100 rounded-2xl flex items-center justify-between group hover:bg-slate-200 transition-all text-left border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <Lock className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="font-bold text-slate-900 text-sm">Change Password</div>
                       <div className="text-[10px] text-slate-400 font-medium">Update account security credentials</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Account Terminal</h3>
             <div className="space-y-4">
                <button 
                  onClick={() => { setActiveTab("trade"); setActiveTradeSubTab("history"); }}
                  className="w-full p-6 bg-slate-100 rounded-2xl flex items-center justify-between group hover:bg-slate-200 transition-all text-left border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                       <Clock className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="font-bold text-slate-900 text-sm">Execution Logs</div>
                       <div className="text-[10px] text-slate-400 font-medium">Review your historical data</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => setShowChat(true)}
                  className="w-full p-6 bg-slate-100 rounded-2xl flex items-center justify-between group hover:bg-slate-200 transition-all text-left border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                       <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="font-bold text-slate-900 text-sm">Direct Protocol Support</div>
                       <div className="text-[10px] text-slate-400 font-medium">Instant 24/7 priority pipeline</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => auth.signOut()}
                  className="w-full p-6 bg-rose-50 rounded-2xl flex items-center justify-center gap-2 group hover:bg-rose-100 transition-all border border-rose-100 mt-4"
                >
                  <LogOut className="w-5 h-5 text-rose-600" />
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Terminate Control Session</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111c38] bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.12),transparent_50%)] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      <div className="flex-1 flex flex-col pb-32">
        <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {activeTab === "home" && renderHome()}
          {activeTab === "market" && renderMarket()}
          {activeTab === "trade" && renderTrading()}
          {activeTab === "asset" && renderAsset()}
          {activeTab === "account" && renderPersonal()}
        </main>
      </div>

      {/* Footer / Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-slate-800 z-[150] pb-safe">
        <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto flex items-center justify-between px-6 sm:px-16 py-3.5">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "market", icon: TrendingUp, label: "Markets" },
            { id: "trade", icon: ArrowLeftRight, label: "Trade", isSpecial: true },
            { id: "asset", icon: Wallet, label: "Assets" },
            { id: "account", icon: UserIcon, label: "Account" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-1 px-4 sm:px-8 transition-all duration-300 active:scale-95",
                item.isSpecial ? "-mt-7" : "",
                activeTab === item.id ? (item.isSpecial ? "text-white" : "text-indigo-400") : "text-slate-400 hover:text-slate-200"
              )}
            >
              {item.isSpecial ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.6)] border-4 border-[#0f172a]">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <item.icon className={cn("w-6 h-6 transition-transform duration-300", activeTab === item.id ? "scale-110" : "")} />
              )}
              <span className={cn("text-[10px] font-black uppercase tracking-widest", item.isSpecial ? "text-orange-400 mt-1" : "")}>{item.label}</span>
              {!item.isSpecial && activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Change Password</h3>
                <button onClick={() => setShowChangePasswordModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.15em] block mb-2 ml-1">Current Password</label>
                  <input 
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-slate-50 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.15em] block mb-2 ml-1">New Password</label>
                  <input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-slate-50 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.15em] block mb-2 ml-1">Confirm New Password</label>
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-slate-50 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 font-medium"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-8 py-4 bg-[#1a1a1a] hover:bg-black disabled:opacity-50 text-white font-black rounded-xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
                  >
                    {isChangingPassword ? "Processing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTrading && timeLeft !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              className="relative flex flex-col items-center"
            >
              <div className="relative w-48 h-48 mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96" cy="96" r="88"
                    stroke="currentColor" strokeWidth="8"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="96" cy="96" r="88"
                    stroke="currentColor" strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="553"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 553 - (553 * (timeLeft / (tradeDetailsRef.current?.seconds || 1))) }}
                    className="text-indigo-600"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl font-black text-white">{timeLeft}</span>
                </div>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">Trade in Progress</h2>
              <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Waiting for market result...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowDepositModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 overflow-y-auto max-h-[85vh]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Deposit</h3>
                  <button onClick={() => setShowDepositModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-3">Choice of Token</label>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {([
                        { id: "usdt_address", name: "USDT", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                        { id: "sol_address", name: "SOL", color: "bg-purple-50 text-purple-700 border-purple-200" },
                        { id: "btc_address", name: "BTC", color: "bg-amber-50 text-amber-700 border-amber-200" },
                        { id: "eth_address", name: "ETH", color: "bg-blue-50 text-blue-700 border-blue-200" },
                        { id: "bnb_address", name: "BNB", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                        { id: "xrp_address", name: "XRP", color: "bg-slate-100 text-slate-700 border-slate-200" }
                      ] as const).map((coin) => (
                        <button
                          key={coin.id}
                          onClick={() => setSelectedDepositCoin(coin.id)}
                          className={cn(
                            "py-3 px-2 rounded-xl text-sm font-black transition-all border shadow-sm",
                            selectedDepositCoin === coin.id 
                              ? "ring-2 ring-offset-2 ring-indigo-500 scale-105 " + coin.color 
                              : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50 font-bold"
                          )}
                        >
                          {coin.name}
                        </button>
                      ))}
                    </div>

                    <label className="text-sm font-medium text-gray-700 block mb-2">Deposit Address</label>
                    <div className="bg-[#f9fafb] border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-black text-gray-900 uppercase">
                          {selectedDepositCoin.replace("_address", "").toUpperCase()} Address
                        </span>
                        <div className="flex items-center gap-1 text-gray-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-[12px] text-gray-600 break-all leading-relaxed font-mono bg-white p-3 rounded-lg border border-gray-100 mb-3 select-all">
                        {settings?.[selectedDepositCoin] || `No ${selectedDepositCoin.replace("_address", "").toUpperCase()} address set`}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(settings?.[selectedDepositCoin] || "")}
                        className="w-full py-2.5 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Address
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Quantity</label>
                    <input 
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-indigo-100 rounded-lg px-4 py-3 text-base focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Deposit Receipt Upload</label>
                    <div className="relative">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className={cn(
                        "w-full border border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all min-h-[160px]",
                        receiptFile ? "border-green-300 bg-green-50" : "border-gray-300 bg-white hover:border-gray-400"
                      )}>
                        {receiptFile ? (
                          <img src={receiptFile} referrerPolicy="no-referrer" className="max-h-24 rounded object-contain" alt="Preview" />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-gray-300 mb-4" />
                            <div className="text-sm font-bold text-gray-900 mb-1">
                              Upload a file <span className="font-normal text-gray-500">or drag and drop</span>
                            </div>
                            <span className="text-xs text-gray-500">PNG, JPG, PDF up to 15MB</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>



              <button 
                onClick={handleSubmitDeposit}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base active:opacity-90 transition-opacity uppercase tracking-widest"
              >
                {isSubmittingDeposit ? "Synchronizing..." : "Submit Deposit"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVerificationForm && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowVerificationForm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 pb-10 overflow-y-auto max-h-[85vh]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 bg-[#f44336] rounded-lg flex items-center justify-center text-white">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-medium text-gray-900">Personal Information</h3>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">Full Name</label>
                    <input 
                      type="text"
                      value={full_name}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">Phone Number</label>
                    <input 
                      type="tel"
                      value={phone_number}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">Residential Address</label>
                    <textarea 
                      value={address_val}
                      onChange={(e) => setAddressVal(e.target.value)}
                      placeholder="Enter your full address"
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">ID / Passport / Driving License</label>
                    <div className="relative group">
                      <input 
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleVerificationFileChange}
                        className="hidden"
                        id="verification-doc-upload"
                      />
                      <label 
                        htmlFor="verification-doc-upload"
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed rounded-2xl py-8 px-4 transition-all cursor-pointer",
                          verificationDoc 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                            : "bg-gray-50 border-gray-200 text-gray-400 hover:border-red-300 hover:bg-red-50/50"
                        )}
                      >
                        {verificationDoc ? (
                          <div className="flex flex-col items-center gap-2">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                            <span className="text-sm font-bold">Document Selected</span>
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Click to change</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-gray-300" />
                            <span className="text-sm font-bold">Upload Document</span>
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-60">JPG, PNG or PDF (Max 15MB)</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={handleSubmitVerification}
                    disabled={isSubmittingVerification}
                    className="w-full py-5 bg-[#f44336] hover:bg-[#d32f2f] disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-xl shadow-red-100 active:scale-[0.98] transition-all mt-4"
                  >
                    {isSubmittingVerification ? "Submitting..." : "Submit for Verification"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 pb-10 overflow-y-auto max-h-[85vh]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 bg-[#f44336] rounded-lg"></div>
                  <h3 className="text-2xl font-medium text-gray-900">Withdraw Funds</h3>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">Full Name</label>
                    <input 
                      type="text"
                      value={withdrawName}
                      onChange={(e) => setWithdrawName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">Withdraw Type</label>
                    <div className="relative">
                      <select
                        value={withdrawType}
                        onChange={(e) => setWithdrawType(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none appearance-none transition-all font-medium text-gray-700 pr-12 shadow-sm"
                      >
                        <option value="USDT (ERC20)">USDT (ERC20)</option>
                        <option value="USDT (TRC20)">USDT (TRC20)</option>
                        <option value="Bitcoin (BTC)">Bitcoin (BTC)</option>
                        <option value="Ethereum (ETH)">Ethereum (ETH)</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">Withdrawal Address</label>
                    <input 
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="Enter your wallet address"
                      className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-800 block mb-3">Amount</label>
                    <input 
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm"
                    />
                  </div>

                  <button 
                    onClick={handleWithdraw}
                    className="w-full py-5 bg-[#f44336] hover:bg-[#d32f2f] text-white font-bold text-lg rounded-xl shadow-xl shadow-red-100 active:scale-[0.98] transition-all mt-4"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOptionModal && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowOptionModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] overflow-hidden shadow-2xl p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold", selectedAsset.color)}>
                  {selectedAsset.icon}
                </div>
                <button onClick={() => setShowOptionModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="mb-6 text-center">
                <div className={cn(
                  "text-4xl font-black flex items-baseline justify-center gap-1",
                  marketData[selectedAsset.symbol]?.isUp ? "text-green-500" : "text-red-500"
                )}>
                   {marketData[selectedAsset.symbol]?.price?.split(".")[0] || "0"}
                   <span className="text-xl font-medium">
                     {marketData[selectedAsset.symbol]?.price?.includes(".") ? "." + marketData[selectedAsset.symbol].price.split(".")[1] : ""}
                   </span>
                   <span className="text-sm font-bold text-gray-400 ml-1">
                     {Math.floor(Math.random() * 9)}
                   </span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Time</label>
                  <div className="grid grid-cols-3 gap-3">
                    {ASSET_DURATIONS.map((dur) => (
                      <button
                        key={dur.s}
                        onClick={() => setSelectedDuration(dur.s)}
                        className={cn(
                          "py-3.5 px-3 rounded-2xl border-2 transition-all text-center relative overflow-hidden shadow-lg",
                          selectedDuration === dur.s 
                            ? `${dur.activeBg} text-white shadow-2xl scale-[1.03] ring-2 ring-white/50` 
                            : "bg-[#131b2e] border-slate-700/60 text-slate-200 hover:border-slate-500 hover:bg-[#1a233a]"
                        )}
                      >
                        <div className="text-sm font-black tracking-tight">{dur.s}s</div>
                        <div className={cn(
                          "mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block",
                          selectedDuration === dur.s ? "bg-white/20 text-white" : dur.badgeBg
                        )}>
                          Return +{dur.r}%
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trade Value (USDT)</label>
                      <span className="text-[10px] font-black text-indigo-400 tracking-tighter">LIMIT: 100 - 100K</span>
                    </div>
                    <span className="text-xs font-black text-gray-400">
                      Expected Profit: <span className="text-green-600">
                        +{(
                          (parseFloat(tradeAmount) || 0) * 
                          ((ASSET_DURATIONS.find(d => d.s === selectedDuration)?.r || 3) / 100)
                        ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                      </span>
                    </span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-2 border-slate-50 rounded-xl px-5 py-4 font-black text-lg focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-black">$</span>
                    Portfolio: {formatCurrency(profile?.balance || 0)} 
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-24">
                  <button 
                    onClick={() => { setShowOptionModal(false); setShowTradeConfirm(true); }}
                    className="py-5 bg-green-500 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-[0.1em]"
                  >
                    Buy / Long
                  </button>
                  <button 
                    onClick={() => { setShowOptionModal(false); setShowTradeConfirm(true); }}
                    className="py-5 bg-red-500 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-[0.1em]"
                  >
                    Sell / Short
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTradeConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTradeConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl p-8"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">Confirm Order</h3>
              <p className="text-gray-500 mb-8 font-medium">Are you sure you want to execute this trade on {selectedAsset.short}?</p>
              
              <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl">
                 <div className="flex justify-between font-bold">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-gray-900">{formatCurrency(parseFloat(tradeAmount) || 0)}</span>
                 </div>
                 <div className="flex justify-between font-bold">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-gray-900">{selectedDuration}s</span>
                 </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTradeConfirm(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePlaceTrade}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Execute Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTradeSuccess && tradeResult && (
          <div className="fixed inset-x-0 top-0 bottom-24 sm:bottom-0 z-[110] flex items-end sm:items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTradeSuccess(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md pointer-events-auto"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl p-6 text-white text-left font-sans pointer-events-auto max-h-[calc(100vh-9rem)] overflow-y-auto my-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="text-[11px] font-mono text-slate-400 font-bold">
                  {tradeResult.timestamp || new Date().toLocaleString()}
                </div>
                <button onClick={() => setShowTradeSuccess(false)} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className={cn(
                  "text-3xl font-mono font-black tracking-tight",
                  tradeResult.isWin ? "text-emerald-400" : "text-rose-400"
                )}>
                  {tradeResult.isWin ? "+" : "-"}${Math.abs(tradeResult.profit || tradeResult.amount).toFixed(2)} USDT
                </div>
                <div className={cn(
                  "text-sm font-black font-mono mt-1",
                  tradeResult.isWin ? "text-emerald-500" : "text-rose-500"
                )}>
                  {tradeResult.isWin ? "+" : ""}{tradeResult.percentage?.toFixed(2) || "0.00"}%
                </div>
              </div>

              {/* Profit Chart Visualization */}
              <div className="bg-[#1e293b]/70 border border-slate-800 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Profit & Price Trajectory</span>
                  <span className={tradeResult.isWin ? "text-emerald-400" : "text-rose-400"}>
                    {tradeResult.isWin ? "▲ PROFIT" : "▼ LOSS"}
                  </span>
                </div>
                <div className="h-20 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={tradeResult.isWin ? "#34d399" : "#f87171"} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={tradeResult.isWin ? "#34d399" : "#f87171"} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d={tradeResult.isWin 
                        ? "M 0 45 Q 50 35, 100 20 T 200 5 L 200 60 L 0 60 Z" 
                        : "M 0 10 Q 50 25, 100 40 T 200 50 L 200 60 L 0 60 Z"} 
                      fill="url(#profitGrad)" 
                    />
                    <path 
                      d={tradeResult.isWin 
                        ? "M 0 45 Q 50 35, 100 20 T 200 5" 
                        : "M 0 10 Q 50 25, 100 40 T 200 50"} 
                      fill="none" 
                      stroke={tradeResult.isWin ? "#34d399" : "#f87171"} 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
                  <span>Entry: ${tradeResult.entryPrice?.toFixed(2)}</span>
                  <span>Exit: ${tradeResult.exitPrice?.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#1e293b]/70 border border-slate-800 rounded-2xl p-5 mb-6 space-y-3 font-mono text-xs">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-800">
                  {ALL_ASSETS.find(a => a.symbol === tradeResult.symbol)?.name?.toUpperCase() || "GOLD"} TRADE DETAILS
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Trade Amount</span>
                  <span className="text-white font-bold">${tradeResult.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Profit</span>
                  <span className={cn("font-bold", tradeResult.isWin ? "text-emerald-400" : "text-rose-400")}>
                    {tradeResult.isWin ? "+" : "-"}${Math.abs(tradeResult.profit || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Entry Price</span>
                  <span className="text-white font-bold">${tradeResult.entryPrice?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Exit Price</span>
                  <span className="text-white font-bold">${tradeResult.exitPrice?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-bold">{tradeResult.seconds}s</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">Total Return</span>
                  <span className="text-white font-black text-sm">${tradeResult.totalReturn?.toFixed(2) || "0.00"}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowTradeSuccess(false)}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                Close Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[60] flex flex-col bg-white">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 tracking-tight">VIP Portal</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Gammix Agent Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-100/50">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.senderId === user.uid ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className={cn("p-5 rounded-3xl text-sm font-medium shadow-sm transition-all hover:shadow-md", msg.senderId === user.uid ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-gray-900 border border-slate-100 rounded-bl-none")}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message support..." 
                  className="flex-1 bg-gray-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-300" 
                />
                <button 
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-4 rounded-2xl transform active:scale-95 transition-all shadow-lg shadow-indigo-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
