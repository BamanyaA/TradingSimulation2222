import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState, lazy, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { auth, db } from "./firebase";
import { UserProfile } from "./types";

// Pages
import Home from "./pages/Home";
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PriceTicker from "./components/PriceTicker";

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchProfile = async (uid: string) => {
    try {
      const res = await fetch(`/api/users/profile?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile({ id: uid, ...data.profile } as UserProfile);
          return;
        }
      }
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    } catch (err) {
      console.warn("Profile fetch error:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.uid);
    const interval = setInterval(() => {
      fetchProfile(user.uid);
    }, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const docRef = doc(db, "users", firebaseUser.uid);
          
          if (profileUnsub) {
            profileUnsub();
          }

          profileUnsub = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            } else {
              const isAdminEmail = firebaseUser.email === "habeshatilaye@gmail.com";
              const cleanName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") : "User");
              const newProfile = {
                email: firebaseUser.email || "",
                fullName: cleanName,
                address: "",
                phoneNumber: firebaseUser.phoneNumber || "",
                verificationDoc: "",
                balance: 0,
                role: isAdminEmail ? "admin" : "user",
                createdAt: new Date(),
                verificationStatus: isAdminEmail ? "verified" : "unsubmitted",
                isVerified: isAdminEmail,
                tradeAction: true
              };
              setProfile({ id: firebaseUser.uid, ...newProfile } as any);
              setDoc(docRef, newProfile).catch(() => {});
            }
          }, (err) => {
            console.warn("Profile listener graceful fallback active:", err.message);
            const isAdminEmail = firebaseUser.email === "habeshatilaye@gmail.com";
            const cleanName = firebaseUser.email ? firebaseUser.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") : "User";
            setProfile({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              fullName: cleanName,
              address: "",
              phoneNumber: "",
              verificationDoc: "",
              balance: 0,
              role: isAdminEmail ? "admin" : "user",
              createdAt: new Date(),
              verificationStatus: isAdminEmail ? "verified" : "unsubmitted",
              isVerified: isAdminEmail,
              tradeAction: true
            } as any);
          });
        } else {
          if (profileUnsub) {
            profileUnsub();
            profileUnsub = null;
          }
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const isAdmin = profile?.role === "admin" || user?.email === "habeshatilaye@gmail.com";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const hideFooter = location.pathname === "/dashboard" || location.pathname === "/admin";

  const defaultRedirect = isAdmin ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-500 flex flex-col">
      <Navbar user={user} profile={profile} />
      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={!user ? <Home /> : <Navigate to={defaultRedirect} />} />
            <Route path="/about" element={!user ? <About /> : <Navigate to={defaultRedirect} />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to={defaultRedirect} />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to={defaultRedirect} />} />
            
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  <Dashboard user={user} profile={profile} refreshProfile={() => fetchProfile(user.uid)} />
                ) : <Navigate to="/login" />
              } 
            />
            
            <Route 
              path="/admin" 
              element={isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />} 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      
      {!hideFooter && <Footer />}

      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#ffffff',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          fontWeight: '600',
          fontSize: '14px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }
      }} />
      <SpeedInsights />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
