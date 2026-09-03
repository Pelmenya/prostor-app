/**
 * Генерация PWA иконок из SVG логотипа
 * Запуск: node scripts/generate-icons.js
 * Требует: npm install sharp (devDependency)
 */
const sharp = require('sharp');
const path = require('path');

// Синий круг с белой буквой P (стиль PROSTOR)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0074BB"/>
  <text x="256" y="380" font-family="Arial, Helvetica, sans-serif" font-size="380" font-weight="bold" fill="white" text-anchor="middle">P</text>
</svg>
`;

async function generate() {
    const publicDir = path.join(__dirname, '..', 'public');

    await sharp(Buffer.from(svgIcon))
        .resize(192, 192)
        .png()
        .toFile(path.join(publicDir, 'icon-192.png'));

    await sharp(Buffer.from(svgIcon))
        .resize(512, 512)
        .png()
        .toFile(path.join(publicDir, 'icon-512.png'));

    await sharp(Buffer.from(svgIcon))
        .resize(72, 72)
        .png()
        .toFile(path.join(publicDir, 'badge-72.png'));

    await sharp(Buffer.from(svgIcon))
        .resize(180, 180)
        .png()
        .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    console.log('Иконки сгенерированы: icon-192.png, icon-512.png, badge-72.png, apple-touch-icon.png');
}

generate().catch(console.error);
