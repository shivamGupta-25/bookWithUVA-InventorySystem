import { Jost } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ConditionalNav from "./_components/ConditionalNav";
import { ThemeProvider } from "@/components/theme-provider";

const jost = Jost({ subsets: ["latin"] });

export const metadata = {
  title: "Book with UVA - Inventory System",
  description: "A comprehensive inventory management system for Book with UVA, enabling efficient tracking, organization, and control of inventory items.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={jost.className}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NotificationProvider>
              <ConditionalNav>
                {children}
              </ConditionalNav>
              <Toaster />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}