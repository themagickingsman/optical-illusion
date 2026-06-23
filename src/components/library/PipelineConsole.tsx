"use client";

import React, { useEffect, useState } from 'react';

export default function PipelineConsole() {
  const [config, setConfig] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ success?: boolean, message?: string } | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  // We read the local config file on mount
  useEffect(() => {
    import('../../../deploy_controller.json')
      .then((module) => setConfig(module.default))
      .catch(console.error);
  }, []);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployResult(null);
    setLiveUrl(null);
    
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeployResult({ success: true, message: 'Deployment successful! Site is live.' });
        // Fetch the dynamically extracted URL from vercel
        try {
          const urlRes = await fetch('/vercel_url.json?t=' + Date.now());
          const urlData = await urlRes.json();
          if (urlData && urlData.url) {
            setLiveUrl(urlData.url);
          }
        } catch (e) {
          console.warn('Could not load vercel_url.json, falling back to default URL structure');
        }
      } else {
        setDeployResult({ success: false, message: data.error || 'Deployment failed.' });
      }
    } catch (error: any) {
      setDeployResult({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsDeploying(false);
    }
  };

  if (!config) return null;

  return (
    <div style={{
      marginTop: '40px',
      background: 'rgba(20, 20, 25, 0.7)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      width: '100%',
      maxWidth: '800px',
      margin: '40px auto 0',
      textAlign: 'left',
      color: 'white',
      fontFamily: 'var(--font-rubik), sans-serif',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      position: 'relative',
      zIndex: 20
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600, color: '#03FFC0' }}>Autonomous Deployment Pipeline</h2>
        <span style={{ background: 'rgba(3, 255, 192, 0.2)', color: '#03FFC0', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>SYSTEM ACTIVE</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Project Info */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, margin: '0 0 10px 0' }}>Project Identity</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}><strong>Name:</strong> {config.product.name}</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}><strong>URL Prefix:</strong> <code style={{ color: '#FF3366', background: 'rgba(255,51,102,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{config.product.urlPrefix}</code></p>
        </div>

        {/* Infrastructure */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, margin: '0 0 10px 0' }}>Infrastructure</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}><strong>GitHub:</strong> {config.repository.owner}/{config.repository.repoName}</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}><strong>Vercel:</strong> {config.hosting.projectName}</p>
        </div>
      </div>

      {/* Build Configuration */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, margin: '0 0 10px 0' }}>Next.js Build Profile</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>Output: <strong>{config.buildPipeline.outputMode}</strong></span>
          <span style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>Images: <strong>{config.buildPipeline.unoptimizedImages ? 'Unoptimized' : 'Default'}</strong></span>
          <span style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>Entry Point: <strong style={{ color: '#03FFC0' }}>{config.buildPipeline.entryPoint}</strong></span>
        </div>
      </div>
      
      {/* Commands */}
      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(3, 255, 192, 0.3)', padding: '16px', borderRadius: '12px', marginTop: '20px', fontFamily: 'monospace' }}>
        <h3 style={{ fontSize: '12px', color: '#03FFC0', margin: '0 0 10px 0' }}>// EXECUTE BUILD</h3>
        <p style={{ margin: '0 0 4px 0', color: '#aaa' }}>$ git add . && git commit -m "Autonomous Pipeline Update" && git push</p>
        <p style={{ margin: '0 0 4px 0', color: '#aaa' }}>$ {config.buildPipeline.commands.build}</p>
        <p style={{ margin: 0, color: '#aaa' }}>$ {config.buildPipeline.commands.deploy}</p>
      </div>

      {/* Interactive Deploy Button */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          onClick={handleDeploy}
          disabled={isDeploying}
          style={{
            position: 'relative',
            background: isDeploying ? 'rgba(3, 255, 192, 0.15)' : 'rgba(3, 255, 192, 0.1)',
            border: '1px solid #03FFC0',
            color: '#03FFC0',
            padding: '16px 40px',
            borderRadius: '30px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isDeploying ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            boxShadow: isDeploying ? '0 0 30px rgba(3, 255, 192, 0.4)' : '0 0 20px rgba(3, 255, 192, 0.2)',
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseOver={(e) => !isDeploying && (e.currentTarget.style.background = 'rgba(3, 255, 192, 0.2)')}
          onMouseOut={(e) => !isDeploying && (e.currentTarget.style.background = 'rgba(3, 255, 192, 0.1)')}
        >
          {isDeploying && (
            <svg 
              className="animate-spin" 
              style={{ width: '20px', height: '20px', color: '#03FFC0' }} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isDeploying ? 'EXECUTING PIPELINE...' : 'GO LIVE NOW'}
        </button>
        
        {isDeploying && (
          <div style={{ marginTop: '16px', color: '#03FFC0', fontSize: '14px', fontFamily: 'monospace', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
            $ Pushing to GitHub & Deploying to Vercel. Please wait...
          </div>
        )}

        {deployResult && (
          <div className="animate-in fade-in zoom-in duration-300" style={{ 
            marginTop: '24px', 
            padding: '24px', 
            borderRadius: '16px', 
            background: deployResult.success ? 'rgba(3, 255, 192, 0.1)' : 'rgba(255, 51, 102, 0.1)',
            color: deployResult.success ? '#03FFC0' : '#FF3366',
            border: `2px solid ${deployResult.success ? '#03FFC0' : '#FF3366'}`,
            boxShadow: `0 0 30px ${deployResult.success ? 'rgba(3, 255, 192, 0.2)' : 'rgba(255, 51, 102, 0.2)'}`
          }}>
            {deployResult.success ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  DEPLOYMENT SUCCESSFUL!
                </div>
                <p style={{ margin: 0, color: 'white', fontSize: '16px' }}>Your site is now live on the internet.</p>
                <a 
                  href={liveUrl || `https://${config.hosting.projectName}.vercel.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#03FFC0',
                    color: 'black',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginTop: '8px',
                    boxShadow: '0 4px 15px rgba(3, 255, 192, 0.4)'
                  }}
                >
                  OPEN LIVE WEBSITE
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>❌ PIPELINE FAILED</div>
                <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', width: '100%', textAlign: 'left', overflowX: 'auto' }}>
                  {deployResult.message}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
