const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];

  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      results.push(fullPath);
    }
  });

  return results;
}

const files = walk("./src");

const requireRegex =
  /require\(["']([^"']+\.(png|jpg|jpeg|gif|webp|svg))["']\)/g;

const importRegex =
  /from\s+["']([^"']+\.(png|jpg|jpeg|gif|webp|svg))["']/g;

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");

  let match;

  while ((match = requireRegex.exec(content)) !== null) {
    const assetPath = path.resolve(path.dirname(file), match[1]);

    if (!fs.existsSync(assetPath)) {
      console.log(`❌ Missing: ${match[1]} in ${file}`);
    }
  }

  while ((match = importRegex.exec(content)) !== null) {
    const assetPath = path.resolve(path.dirname(file), match[1]);

    if (!fs.existsSync(assetPath)) {
      console.log(`❌ Missing: ${match[1]} in ${file}`);
    }
  }
});