import './globals.css';
import { Web3Wrapper } from './Web3Wrapper';

export const metadata = {
  title: 'FUSION | Onchain Credit',
  description: 'Programmable Onchain Credit Market',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen font-sans" suppressHydrationWarning>
        <Web3Wrapper>{children}</Web3Wrapper>
      </body>
    </html>
  );
}