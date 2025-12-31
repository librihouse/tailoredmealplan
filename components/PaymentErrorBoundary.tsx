"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PaymentErrorBoundary caught an error:", error, errorInfo);
    // You can log to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="min-h-screen flex items-center justify-center bg-black text-white py-24">
            <Card className="w-full max-w-md mx-4 bg-gray-900/50 border-white/10">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <AlertCircle className="h-20 w-20 text-red-500" />
                </div>
                <CardTitle className="text-3xl font-bold text-white">
                  Something Went Wrong
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-gray-300">
                    An unexpected error occurred while processing your payment.
                  </p>
                  {process.env.NODE_ENV === "development" && this.state.error && (
                    <p className="text-sm text-gray-500 mt-2 font-mono">
                      {this.state.error.message}
                    </p>
                  )}
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-gray-300">
                    <strong>Don't worry:</strong> If your payment was successful, your subscription will be activated automatically. You can check your subscription status in the dashboard.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      this.setState({ hasError: false, error: null });
                      window.location.reload();
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/10"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    return this.props.children;
  }
}

