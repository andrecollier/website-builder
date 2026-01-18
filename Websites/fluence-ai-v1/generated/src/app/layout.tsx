import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fluence AI - AI-powered Customer Service Platform',
  description: 'Connect, manage, and optimize your AI tools effortlessly with Fluence AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
