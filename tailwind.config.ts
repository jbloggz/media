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
      themes: [
         'light',
         'dark',
         'cupcake',
         'bumblebee',
         'emerald',
         'corporate',
         'synthwave',
         'retro',
         'cyberpunk',
         'valentine',
         'halloween',
         'garden',
         'forest',
         'aqua',
         'lofi',
         'pastel',
         'fantasy',
         'wireframe',
         'black',
         'luxury',
         'dracula',
         'cmyk',
         'autumn',
         'business',
         'acid',
         'lemonade',
         'night',
         'coffee',
         'winter',
         'dim',
         'nord',
         'sunset',
      ],
   },
};
export default config;
