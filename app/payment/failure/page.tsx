"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { PaymentErrorBoundary } from "@/components/PaymentErrorBoundary";

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error") || "Payment could not be processed.";

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-black text-white py-24">
        <Card className="w-full max-w-md mx-4 bg-gray-900/50 border-white/10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-20 w-20 text-red-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-gray-300">{errorMessage}</p>
              <p className="text-sm text-gray-400">
                Your payment was not processed. No charges were made to your account.
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong>Common reasons:</strong>
              </p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1 list-disc list-inside">
                <li>Insufficient funds</li>
                <li>Card declined by bank</li>
                <li>Invalid card details</li>
                <li>Network error</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/pricing")}
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Link href="/contact" className="block">
                <Button
                  variant="outline"
                  className="w-full border-white/20 hover:bg-white/10"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-gray-400 hover:text-gray-300 underline"
              >
                Go to Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function FailureFallback() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-6">
          <Spinner className="h-12 w-12 text-primary mx-auto" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    </Layout>
  );
}

export default function PaymentFailurePage() {
  return (
    <PaymentErrorBoundary>
      <Suspense fallback={<FailureFallback />}>
        <PaymentFailureContent />
      </Suspense>
    </PaymentErrorBoundary>
  );
}

