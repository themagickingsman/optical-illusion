/**
 * PathController.ts
 * Centrally manages asset prefixes, API base paths, and URL resolution strategy.
 */

export const PathController = {
  /**
   * Returns the prefix to prepend to relative asset URLs.
   */
  getAssetPrefix(): string {
    if (typeof window === 'undefined') return '';

    const isPort3006 = window.location.port === '3006' || window.location.port === '3007' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app');
    const isLocalScheme = window.location.protocol === 'app:' || window.location.protocol === 'file:';

    if (isPort3006 || isLocalScheme) {
      // In standalone/screensaver mode, resolve relative to current host/protocol/path (no hardcoded localhost:3001)
      return '';
    }

    return '';
  },

  /**
   * Resolves a relative or root-relative asset URL to its final usable path.
   */
  resolve(url: string): string {
    if (!url) return '';
    
    // Ignore absolute URLs or base64 data URIs
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }

    // Normalize relative path helpers
    let cleanUrl = url;
    if (cleanUrl.startsWith('./')) {
      cleanUrl = cleanUrl.substring(2);
    } else if (cleanUrl.startsWith('../')) {
      cleanUrl = cleanUrl.substring(3);
    }

    const isLocalScheme = typeof window !== 'undefined' && 
      window.location.protocol !== 'http:' && 
      window.location.protocol !== 'https:';
    
    if (isLocalScheme) {
      const relativePath = cleanUrl.startsWith('/') ? cleanUrl.substring(1) : cleanUrl;
      const isNestedInBuilds = typeof window !== 'undefined' && window.location.pathname.includes('/builds/');
      if (isNestedInBuilds) {
        return '../' + relativePath;
      }
      return './' + relativePath;
    }

    const prefix = this.getAssetPrefix();
    const path = cleanUrl.startsWith('/') ? cleanUrl : '/' + cleanUrl;
    
    return `${prefix}${path}`;
  }
};
