'use client';

import { Suspense } from 'react';

const BubbleBackground = () => {
  return (
    <div className="bubble-container fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="bubble absolute rounded-full bg-primary/5"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 80 + 40}px`,
            height: `${Math.random() * 80 + 40}px`,
            animationDuration: `${Math.random() * 8 + 12}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
};

export default function DashboardLayout({ children }) {
  return (
    <div className="relative min-h-screen animated-bg">
      <div className="gradient-overlay" />
      <Suspense fallback={null}>
        <BubbleBackground />
      </Suspense>
      <main className="relative z-0">
        {children}
      </main>
      <style jsx global>{`
        .animated-bg {
          background: linear-gradient(45deg, #f6f8fd, #f1f5ff);
          position: relative;
          overflow: hidden;
        }
        
        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            rgba(59, 130, 246, 0.05),
            rgba(147, 197, 253, 0.05),
            rgba(59, 130, 246, 0.05)
          );
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          z-index: -20;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(20px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-15px, 15px) scale(0.9);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .bubble {
          animation: float infinite ease-in-out;
          opacity: 0.7;
        }
        .bubble:nth-child(even) {
          animation-direction: reverse;
        }
      `}</style>
    </div>
  );
}
