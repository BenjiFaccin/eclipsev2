import React, { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react"

const DesktopComponent = React.lazy(() => import('./index.desktop'));
const MobileComponent = React.lazy(() => import('./index.mobile'));

const IndexPage = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {isMobile ? <MobileComponent /> : <DesktopComponent />}
    </React.Suspense>
  );
};

export default IndexPage;
