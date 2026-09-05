import "./globals.css";

export const metadata = {
  title: "Chowly",
  description: "Digital dine-in ordering for customers and waiters"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
