import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
   content: ['./src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
   plugins: [
      require('daisyui'),
      plugin(({ addUtilities }) => {
         addUtilities({
            '.no-scrollbar': {
               '-ms-overflow-style': 'none' /* Internet Explorer 10+ */,
               'scrollbar-width': 'none' /* Firefox */,
            },
            '.no-scrollbar::-webkit-scrollbar': {
               display: 'none' /* Safari and Chrome */,
            },
         });
      }),
   ],
   daisyui: {
      themes: ['light', 'business'],
   },
};
export default config;
