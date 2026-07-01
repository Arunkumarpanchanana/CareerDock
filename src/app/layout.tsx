import type { Metadata } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "My Career Dock - Career Acceleration Platform",
  description:
    "Build ATS-optimized resumes, track job applications, and accelerate your career with smart suggestions and expert guidance.",
  icons: [{ rel: "icon", url: "/logo.png", type: "image/png" }],
  openGraph: {
    title: "My Career Dock - Career Acceleration Platform",
    description:
      "Build ATS-optimized resumes, track job applications, and accelerate your career with smart suggestions and expert guidance.",
    type: "website",
    siteName: "My Career Dock",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${hankenGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
