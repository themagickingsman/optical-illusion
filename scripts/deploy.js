const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Initiating Autonomous Deployment Pipeline...\n');

// 1. Read the Central Controller
const configPath = path.join(__dirname, '../deploy_controller.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ FATAL: deploy_controller.json not found in root directory.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log(`📦 Product: ${config.product.name} (${config.product.urlPrefix})`);
console.log(`🌐 Hosting: ${config.hosting.provider} [${config.hosting.projectName}]`);

// 2. Generate vercel.json dynamically based on the controller
const vercelConfig = {
  "name": config.hosting.projectName,
  "framework": config.hosting.framework,
  "buildCommand": config.buildPipeline.commands.build,
  "outputDirectory": config.buildPipeline.outputMode === 'export' ? 'out' : '.next'
};

const vercelPath = path.join(__dirname, '../vercel.json');
fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
console.log('\n✅ Generated vercel.json from central controller.');

// 3. Execute Git Push & Deployment
console.log('\n⚙️ Executing deployment sequence...');
try {
  const rootDir = path.join(__dirname, '..');

  // Push to Git
  console.log('Pushing to GitHub...');
  execSync('git add .', { stdio: 'inherit', cwd: rootDir });
  
  try {
    execSync('git commit -m "Autonomous Pipeline Update"', { stdio: 'inherit', cwd: rootDir });
  } catch (e) {
    // Ignore error if there is nothing to commit
    console.log('No new changes to commit.');
  }
  
  execSync('git push -u origin main', { stdio: 'inherit', cwd: rootDir });
  console.log('✅ Pushed to GitHub successfully.');

  // Execute the Vercel CLI production deployment
  console.log('\n🚀 Step 4: Deploying to Vercel...');
  try {
    const deployCmd = `npx vercel --prod --yes`;
    console.log(`Executing: ${deployCmd}`);
    
    // Capture stdout/stderr so we can extract the dynamically assigned Vercel URL
    const output = execSync(deployCmd, { cwd: path.join(__dirname, '..'), encoding: 'utf-8' });
    console.log(output);

    // Parse the Production URL from the Vercel CLI output
    // Usually looks like: Production: https://optical-illusion-xyz.vercel.app
    const match = output.match(/Production:\s+(https:\/\/[^\s]+)/);
    if (match && match[1]) {
      const liveUrl = match[1];
      fs.writeFileSync(
        path.join(__dirname, '../public/vercel_url.json'), 
        JSON.stringify({ url: liveUrl, timestamp: Date.now() })
      );
      console.log(`\n✅ Successfully captured Live URL: ${liveUrl}`);
    } else {
      console.log(`\n⚠️ Could not parse Live URL from Vercel output. Fallback to dashboard.`);
    }

    console.log(`\n🎉 Pipeline completed successfully!`);
  } catch (error) {
    console.error(`❌ Vercel deployment failed.`);
    console.error(error.stdout || error.message);
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ DEPLOYMENT FAILED');
  console.error(error.message);
  process.exit(1);
}
