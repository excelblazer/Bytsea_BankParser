import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the dist directory to get the actual asset filenames
const distDir = path.join(__dirname, 'dist');
const assetsDir = path.join(distDir, 'assets');
const htmlFile = path.join(distDir, 'index.html');

// Get all files in the assets directory
const assetFiles = fs.readdirSync(assetsDir);

// Find the main JS and CSS files
const mainJsFile = assetFiles.find(file => file.startsWith('index.') && file.endsWith('.js'));
const vendorJsFile = assetFiles.find(file => file.startsWith('vendor.') && file.endsWith('.js'));
const cssFile = assetFiles.find(file => file.startsWith('index.') && file.endsWith('.css'));

console.log('Found assets:');
console.log('- Main JS:', mainJsFile);
console.log('- Vendor JS:', vendorJsFile);
console.log('- CSS:', cssFile);

// Read the HTML file
let html = fs.readFileSync(htmlFile, 'utf8');

// Remove the existing script tag that Vite couldn't process
html = html.replace(/<script type="module" src="\.\/index\.tsx"><\/script>/, '');
html = html.replace(/<!-- Entry point for the React application -->\s*/, '');

// Create the injection strings
const cssLink = cssFile ? `  <link rel="stylesheet" href="./assets/${cssFile}">` : '';
const vendorScript = vendorJsFile ? `  <script type="module" src="./assets/${vendorJsFile}"></script>` : '';
const mainScript = mainJsFile ? `  <script type="module" src="./assets/${mainJsFile}"></script>` : '';

// Inject CSS in the head (before closing </head>)
if (cssFile) {
  html = html.replace('</head>', `${cssLink}\n</head>`);
}

// Inject scripts before closing </body>
const scriptsToInject = [vendorScript, mainScript].filter(Boolean).join('\n');
if (scriptsToInject) {
  html = html.replace('</body>', `  <!-- React application scripts -->\n${scriptsToInject}\n</body>`);
}

// Write the updated HTML back
fs.writeFileSync(htmlFile, html, 'utf8');

// Fix manifest and browserconfig files for GitHub Pages
const manifestFile = path.join(distDir, 'favicon', 'site.webmanifest');
const browserconfigFile = path.join(distDir, 'favicon', 'browserconfig.xml');

// Update manifest file
if (fs.existsSync(manifestFile)) {
  let manifest = fs.readFileSync(manifestFile, 'utf8');
  manifest = manifest.replace(/\/favicon\//g, '/Bytsea_BankParser/favicon/');
  manifest = manifest.replace(/"start_url": "\/"/, '"start_url": "/Bytsea_BankParser/"');
  manifest = manifest.replace(/"scope": "\/"/, '"scope": "/Bytsea_BankParser/"');
  fs.writeFileSync(manifestFile, manifest, 'utf8');
  console.log('Updated favicon paths in site.webmanifest');
}

// Update browserconfig file
if (fs.existsSync(browserconfigFile)) {
  let browserconfig = fs.readFileSync(browserconfigFile, 'utf8');
  browserconfig = browserconfig.replace(/\/favicon\//g, '/Bytsea_BankParser/favicon/');
  fs.writeFileSync(browserconfigFile, browserconfig, 'utf8');
  console.log('Updated favicon paths in browserconfig.xml');
}

console.log('Successfully injected assets into index.html');
