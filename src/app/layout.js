import { Jost } from "next/font/google";
import "./globals.css";
import Nav from "./_components/Nav";

const jost = Jost({ subsets: ["latin"] });

export const metadata = {
  title: "Book with UVA - Inventory System",
  description: "A comprehensive inventory management system for Book with UVA, enabling efficient tracking, organization, and control of inventory items.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={jost.className}
        suppressHydrationWarning={true}
      >
        <Nav>
          {children}
        </Nav>
      </body>
    </html>
  );
}
