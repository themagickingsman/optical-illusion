const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src/components/library/cosmic_racer/native');
const validFolders = ['engine', 'state', 'components', 'data', 'lib', 'config'];

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walkDir(rootDir);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Calculate relative path from this file's directory to the native root
    const fileDir = path.dirname(file);
    let relativeToRoot = path.relative(fileDir, rootDir);
    if (relativeToRoot === '') relativeToRoot = '.';

    // Regex to match from '@/(engine|state|components|data|lib|config)/...'
    const regex = /from\s+['"]@\/(engine|state|components|data|lib|config)(.*?)['"]/g;
    
    content = content.replace(regex, (match, folder, rest) => {
        return `from '${relativeToRoot}/${folder}${rest}'`;
    });
    
    // Also match dynamic imports import('@/engine/...')
    const dynamicRegex = /import\(['"]@\/(engine|state|components|data|lib|config)(.*?)['"]\)/g;
    content = content.replace(dynamicRegex, (match, folder, rest) => {
        return `import('${relativeToRoot}/${folder}${rest}')`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
    }
});

console.log(`Successfully rewrote imports in ${modifiedCount} files.`);
