/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/*.ejs", "./views/**/*.ejs"],
  theme: {
    extend: {
      colors: {
        'footer-bg-color': '#333',
        'button-bg-color': '#3C3EFF',
      },
    },
    plugins: [],
  }
}
