import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getCurrentUser } from "../services/auth";
import { TempoDevtools } from "tempo-devtools";

function MyApp({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize Tempo Devtools
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }

    // Check authentication on initial load
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      // If no token and not on login page, redirect to login
      if (!token && router.pathname !== "/login") {
        router.push("/login");
        return;
      }

      // If token exists, verify it
      if (token) {
        try {
          const user = await getCurrentUser(token);

          // If token is invalid, redirect to login
          if (!user && router.pathname !== "/login") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }

          // If on login page but already authenticated, redirect to dashboard
          if (user && router.pathname === "/login") {
            router.push("/dashboard");
            return;
          }
        } catch (error) {
          console.error("Auth error:", error);
          if (router.pathname !== "/login") {
            router.push("/login");
          }
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [router.pathname]);

  if (loading && router.pathname !== "/login") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}

export default MyApp;
