"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Legal({ params }: { params: Promise<{ legal: string }> }) {
  const router = useRouter();

  useEffect(() => {
    params.then((resolvedParams) => {
      const legalType = resolvedParams.legal;
      if (legalType === "privacy") {
        router.replace("/privacy");
      } else if (legalType === "terms") {
        router.replace("/terms");
      } else {
        router.replace("/");
      }
    });
  }, [params, router]);

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
