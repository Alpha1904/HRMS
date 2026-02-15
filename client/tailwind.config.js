const theme = require('./src/theme/tailwind.theme.js');
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: theme.colors,
      fontFamily: theme.fontFamily
    }
  },
  plugins: [],
}
