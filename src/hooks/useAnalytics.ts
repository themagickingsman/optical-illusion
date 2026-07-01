export const useAnalytics = () => {
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
    } else {
      console.log(`[Analytics Event] ${eventName}`, eventParams);
    }
  };

  return { trackEvent };
};
