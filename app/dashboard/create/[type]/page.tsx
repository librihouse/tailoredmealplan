"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

/**
 * This page redirects to the new multi-page questionnaire
 * The old single-page questionnaire has been replaced with a segmented multi-page version
 */
export default function CreatePlanPage() {
  const router = useRouter();
  const params = useParams();
  const planType = (params?.type as "daily" | "weekly" | "monthly") || "daily";

  useEffect(() => {
    // #region agent log - Hypothesis A,B,C,D: Redirect attempt
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/dashboard/create/[type]/page.tsx:19',message:'Redirect attempt starting',data:{planType,targetUrl:`/generate-meal-plan?type=${planType}`,currentPath:window.location.pathname,currentSearch:window.location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion
    
    // Redirect to the new multi-page questionnaire
    // Pass plan type as query parameter so it can be pre-selected
    // Use window.location.href instead of Next.js router since /generate-meal-plan
    // is handled by wouter client-side router, not Next.js app router
    const targetUrl = `/generate-meal-plan?type=${planType}`;
    
    // #region agent log - Hypothesis A,B,C,D: Before redirect
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/dashboard/create/[type]/page.tsx:27',message:'Before window.location redirect',data:{targetUrl,routerType:'Next.js useRouter',willUseWindowLocation:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion
    
    window.location.href = targetUrl;
    
    // #region agent log - Hypothesis A,B,C,D: After redirect
    fetch('http://127.0.0.1:7242/ingest/29ee16f2-f385-440f-b653-567260a65333',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/dashboard/create/[type]/page.tsx:31',message:'After window.location redirect set',data:{targetUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion
  }, [router, planType]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <Spinner className="h-8 w-8 text-primary mx-auto" />
        <p className="text-gray-400">Redirecting to questionnaire...</p>
      </div>
    </div>
  );
}
