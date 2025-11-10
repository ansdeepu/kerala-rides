'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('MapErrorBoundary caught an error: ', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle className="font-headline text-destructive">
                Map Loading Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>The application could not connect to Google Maps.</p>
              <p className="text-sm mt-2 text-muted-foreground">
                This may be due to a missing or invalid API key, or because
                billing is not enabled for your Google Cloud project. Please check
                the console for more details.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
