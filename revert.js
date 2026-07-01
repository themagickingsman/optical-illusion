const fs = require('fs');
const path = require('path');
const p = path.resolve('src/components/library/ui/magicWand/Demo.ts');
let code = fs.readFileSync(p, 'utf8');

// Revert camera
code = code.replace(/this\.camera\.position\.set\(0, 0, 25\);[^\n]*/, 'this.camera.position.set(0, 0, 5);');

// Revert finaleStartTime uniform
code = code.replace(/finaleStartTime: uniform\(0\.0\),\n\s*/, '');
code = code.replace(/this\.uniforms\.finaleStartTime\.value = this\.clock\.getElapsed\(\);\n\s*/, '');

// Revert finale trigger
code = code.replace(/time\.greaterThan\(this\.uniforms\.finaleStartTime\.add\(groupTimeOffset\)\)/, 'time.greaterThan(groupTimeOffset)');

// Revert outputNode
code = code.replace(/scenePassColor\.a\.add\(this\.bloomPass\.x\)\.add\(this\.bloomPass\.y\)\.add\(this\.bloomPass\.z\)/, 'scenePassColor.a');

// Revert initParticlesComputeNode
code = code.replace(/this\.initParticlesComputeNode = Fn/, 'const initParticlesCompute = Fn');
code = code.replace(/}\)\(\)\.compute\(totalAmount\);/, '})().compute(totalAmount);\n\n        void this.renderer.computeAsync(initParticlesCompute);');
code = code.replace(/if \(!this\.hasInitializedParticles\) \{\n\s*this\.hasInitializedParticles = true;\n\s*await this\.renderer\.computeAsync\(this\.initParticlesComputeNode\);\n\s*\}\n\s*/, '');
code = code.replace(/initParticlesComputeNode!: ComputeNode;\n\s*hasInitializedParticles = false;\n\s*/, '');

fs.writeFileSync(p, code);
