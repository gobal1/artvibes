import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: [
    './resources/js/**/*.{js,jsx,ts,tsx}',
    './resources/views/**/*.blade.php',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
});
