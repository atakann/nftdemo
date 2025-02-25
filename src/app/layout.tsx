// src/app/layout.tsx

import './globals.css';
import { ThemeProvider } from './context/ThemeContext';
import NavBar from './components/Navbar';
import { Inter as FontSans, Old_Standard_TT as FontSerif } from "next/font/google";
import { cn } from "@/lib/utils";
import Providers from './Providers';
import { GoogleOAuthProvider } from "@react-oauth/google";

//solana wallet connect functions
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "700"], // Specify the weights for Inter
});

const fontSerif = FontSerif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"], // Specify the weights for Old Standard TT
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSerif.variable}>
      <body className={cn("min-h-screen bg-background font-serif antialiased")}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <Providers>
          <ThemeProvider>
            <NavBar />
            <main className="content-with-navbar-padding">
              {children}
            </main>
          </ThemeProvider>
        </Providers>
      </GoogleOAuthProvider>
      </body>
    </html>
  );
}
