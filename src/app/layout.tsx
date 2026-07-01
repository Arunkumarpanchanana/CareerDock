import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('careerdock-theme');if(!t){t=window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}document.documentElement.classList.toggle('light',t==='light');document.documentElement.classList.toggle('dark',t==='dark')})()`,
        }} />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
