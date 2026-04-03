import { ThemeProvider } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import "./global.css";

export const metadata = {
  title: "ScholarPath AI — Find Your Scholarships",
  description:
    "AI-powered scholarship eligibility checker for students across India. Discover all financial aid options you qualify for in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white transition-colors duration-300">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-white font-black text-xs">S</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">ScholarPath <span className="text-indigo-600 dark:text-indigo-400">AI</span></span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Scholarship data is informational only. Always verify on official portals.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">© 2025 ScholarPath AI</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
