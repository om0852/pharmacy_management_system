import { Toaster } from 'react-hot-toast';
import  { Metadata } from 'next'
import './globals.css'

export const metadata = {
  title: 'Medicare ',
  description: 'Created by Medicare',
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