import './globals.css';
export const metadata = {
  title: 'Mission Control — Reports',
  description: 'Development notes, application history, and release documentation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}