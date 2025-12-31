"use client";

/**
 * Helper page to display your User ID
 * Visit /get-user-id after logging in to see your user ID
 * This page can be deleted after setup is complete
 */

import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function GetUserIdPage() {
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <Card className="bg-gray-900 border-white/10 max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Please Log In</h2>
              <p className="text-gray-400 mb-4">
                You need to be logged in to see your User ID.
              </p>
              <Button asChild className="w-full">
                <a href="/auth">Go to Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const userId = user?.id || "Not available";

  const copyToClipboard = () => {
    if (userId && userId !== "Not available") {
      navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const envSetup = `TEST_USER_ID=${userId}
NEXT_PUBLIC_TEST_USER_ID=${userId}`;

  const copyEnvSetup = () => {
    navigator.clipboard.writeText(envSetup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="bg-gray-900 border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl">Your User ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">User ID (UUID):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-800 p-3 rounded text-sm break-all">
                    {userId}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Add this to your <code className="bg-gray-800 px-2 py-1 rounded">.env.local</code> file:
                </p>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                    <code>{envSetup}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyEnvSetup}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded p-4">
                <p className="text-sm text-primary font-semibold mb-2">
                  ⚠️ Important Steps:
                </p>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Copy the environment variables above</li>
                  <li>Paste them into your <code className="bg-gray-800 px-1 rounded">.env.local</code> file</li>
                  <li>Restart your development server</li>
                  <li>Go to <code className="bg-gray-800 px-1 rounded">/pricing</code> and select a paid plan</li>
                  <li>You should be able to access paid features without payment!</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  💡 Tip: You can delete this page (<code className="bg-gray-800 px-1 rounded">app/get-user-id/page.tsx</code>) after setup is complete.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

