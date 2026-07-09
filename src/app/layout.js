import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MuiThemeProvider from "../components/MuiThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Powered CSV Importer",
  description:
    "Upload any CRM CSV file to intelligently extract and map lead information.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MuiThemeProvider>{children}</MuiThemeProvider>
      </body>
    </html>
  );
}