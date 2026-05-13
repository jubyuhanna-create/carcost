@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sora: 'Sora', sans-serif;
  --font-dm-sans: 'DM Sans', sans-serif;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html {
  scroll-behavior: smooth;
}

body {
  background: #07090f;
  color: #e8edf5;
  font-family: var(--font-dm-sans);
  min-height: 100vh;
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #0e1420;
}
::-webkit-scrollbar-thumb {
  background: #1a2540;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #253558;
}

/* Form elements */
input, select, textarea {
  background: #0e1420;
  color: #e8edf5;
  border: 1px solid #1a2540;
  border-radius: 10px;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-family: var(--font-dm-sans);
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  outline: none;
}

input::placeholder, textarea::placeholder {
  color: #4a5568;
}

input:focus, select:focus, textarea:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
  cursor: pointer;
}

select option {
  background: #0e1420;
  color: #e8edf5;
}

/* Prevent zoom on iOS */
@media (max-width: 768px) {
  input, select, textarea {
    font-size: 16px;
  }
}

/* Safe area for iOS */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Loading skeleton */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #0e1420 25%, #151d2e 50%, #0e1420 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
