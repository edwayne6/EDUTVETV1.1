const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

async function buildCSS() {
  const inputPath = path.join(__dirname, '..', 'src', 'tailwind.css');
  const outputPath = path.join(__dirname, '..', 'tailwind.css');

  const css = fs.readFileSync(inputPath, 'utf8');

  const result = await postcss([
    tailwindcss,
    autoprefixer
  ]).process(css, {
    from: inputPath,
    to: outputPath
  });

  fs.writeFileSync(outputPath, result.css);

  console.log('Tailwind CSS built successfully!');
}

buildCSS().catch(console.error);