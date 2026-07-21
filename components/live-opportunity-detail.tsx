"use client";

import { useEffect, useState } from "react";
import { BriefingState, EditorialShell } from "@/components/home-page";
import { OpportunityDetail } from "@/components/opportunity-detail";
import { cacheOpportunities, readCachedOpportunities } from "@/lib/opportunity-cache";
import { fetchOpportunities } from "@/lib/opportunities-client";
import type { Opportunity } from "@/types";

type DetailState = {
  status: "loading" | "success" | "error";
  opportunity: Opportunity | null;
  error: string | null;
};

export function LiveOpportunityDetail({ id }: { id: string }) {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<DetailState>({
    status: "loading",
    opportunity: null,
    error: null,
  });

  useEffect(() => {
    const cached = readCachedOpportunities().find((item) => item.id === id);
    if (cached) {
      setState({ status: "success", opportunity: cached, error: null });
      return;
    }

    const controller = new AbortController();

    async function loadOpportunity() {
      setState({ status: "loading", opportunity: null, error: null });
      try {
        const response = await fetchOpportunities(controller.signal);
        cacheOpportunities(response.opportunities);
        const opportunity = response.opportunities.find((item) => item.id === id);
        setState(opportunity
          ? { status: "success", opportunity, error: null }
          : { status: "error", opportunity: null, error: "This opportunity is no longer in the current briefing." });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          opportunity: null,
          error: error instanceof Error ? error.message : "The opportunity could not be loaded.",
        });
      }
    }

    void loadOpportunity();
    return () => controller.abort();
  }, [id, requestVersion]);

  if (state.opportunity) return <OpportunityDetail opportunity={state.opportunity} />;

  return (
    <EditorialShell>
      <main>
        <div className="main-column">
          {state.status === "loading"
            ? <BriefingState label="Loading opportunity" message="The editorial desk is retrieving this briefing." />
            : <BriefingState label="Opportunity unavailable" message={state.error || "The opportunity could not be loaded."} onRetry={() => setRequestVersion((version) => version + 1)} />}
        </div>
      </main>
    </EditorialShell>
  );
}
