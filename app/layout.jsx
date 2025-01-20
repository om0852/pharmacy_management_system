import { Toaster } from 'react-hot-toast';
import  { Metadata } from 'next'
import './globals.css'

export const metadata = {
  title: 'v0 App',
  description: 'Created with v0',
}
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
} 