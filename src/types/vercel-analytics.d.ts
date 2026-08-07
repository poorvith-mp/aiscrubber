declare module '@vercel/analytics/react' {
  import React from 'react';
  export interface AnalyticsProps {
    beforeSend?: (event: any) => any;
    debug?: boolean;
    mode?: 'auto' | 'development' | 'production';
  }
  export const Analytics: React.FC<AnalyticsProps>;
}
