"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Menu,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cacheOpportunities } from "@/lib/opportunity-cache";
import { fetchOpportunities } from "@/lib/opportunities-client";
import { useWatchlist } from "@/lib/use-watchlist";
import type { Opportunity } from "@/types";

const categoryAccents: Record<string, string> = {
  "Cultural anxiety": "#7b2942",
  "Streaming economics": "#1e6f52",
  "Craft & production": "#b23b24",
  "Industry shift": "#1964ad",
  Exhibition: "#a76d00",
};

const categories = ["Cultural Anxiety", "Streaming Economics", "Craft & Production", "Industry Shift", "Exhibition"];

type HomePageState = {
  status: "loading" | "success" | "error";
  opportunities: Opportunity[];
  generatedAt: string | null;
  error: string | null;
};

function formatBriefingDate(value: string | null) {
  if (!value) return "Today";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatUtcTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

function Wordmark() {
  return (
    <a href="#top" className="wordmark" aria-label="Film Opportunity Radar home">
      <span className="wordmark-kicker">Film intelligence / 197</span>
      <span>Opportunity</span>
      <span>Radar</span>
    </a>
  );
}

function Sidebar({ open, onClose, opportunities, active = "Today" }: { open: boolean; onClose: () => void; opportunities: Opportunity[]; active?: string }) {
  const { items } = useWatchlist();
  const trendingCount = opportunities.filter((item) => item.signal !== "Emerging").length;
  const nav = [
    ["Today", "/", String(opportunities.length)],
    ["Trending", "/#signals", String(trendingCount)],
    ["Archive", "/#signals", ""],
    ["Saved", "/watchlist", String(items.length)],
  ];
  const signalCounts = opportunities.reduce<Record<Opportunity["signal"], number>>(
    (counts, item) => ({ ...counts, [item.signal]: counts[item.signal] + 1 }),
    { Peak: 0, Rising: 0, Emerging: 0 },
  );

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <Wordmark />
        <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={20} /></button>
      </div>
      <nav aria-label="Primary navigation" className="side-nav">
        <p className="eyebrow">Index</p>
        {nav.map(([item, href, count]) => (
          <Link className={item === active ? "active" : ""} href={href} key={item} onClick={onClose}>
            <span>{item}</span><sup>{count}</sup>
          </Link>
        ))}
      </nav>
      <div className="category-list">
        <p className="eyebrow">Departments</p>
        {categories.map((category) => <a href="#signals" key={category}>{category}</a>)}
      </div>
      <div className="signal-key">
        <p className="eyebrow">Today&apos;s signals</p>
        <p><i className="dot peak" />Peak <strong>{signalCounts.Peak}</strong></p>
        <p><i className="dot rising" />Rising <strong>{signalCounts.Rising}</strong></p>
        <p><i className="dot emerging" />Emerging <strong>{signalCounts.Emerging}</strong></p>
      </div>
    </aside>
  );
}

function Masthead({ onMenu, onFilter, generatedAt, count }: { onMenu: () => void; onFilter: () => void; generatedAt: string | null; count: number }) {
  return (
    <header className="masthead" id="top">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="briefing"><span className="eyebrow">Morning briefing</span><strong>{formatBriefingDate(generatedAt)}</strong></div>
      <div className="live"><i className="dot rising" /> Live <span>{generatedAt ? `Updated ${formatUtcTime(generatedAt)} GMT` : "Updating"}</span></div>
      <div className="masthead-actions">
        <span className="discourse">Signals <strong>{count}</strong> today</span>
        <button className="filter-button" onClick={onFilter}><SlidersHorizontal size={15} />Filter signals</button>
      </div>
    </header>
  );
}

function SectionHeader({ label, count }: { label: string; count: string }) {
  return (
    <div className="section-header">
      <div><span className="rule" /><span>{label}</span><b>{count}</b></div>
      <a href="#signals">View all <ArrowUpRight size={13} /></a>
    </div>
  );
}

function SaveButton({ id, title, light = false }: { id: string; title: string; light?: boolean }) {
  const { isSaved, toggle } = useWatchlist();
  const saved = isSaved(id);
  return (
    <button className={`save-button ${light ? "save-light" : ""} ${saved ? "saved" : ""}`} onClick={() => toggle(id)} aria-label={`${saved ? "Remove" : "Save"} ${title}`}>
      {saved ? <Check size={17} /> : <Bookmark size={17} />}
    </button>
  );
}

function LeadOpportunity({ opportunity }: { opportunity: Opportunity }) {
  return (
    <section className="lead-wrap" aria-labelledby="lead-title">
      <SectionHeader label="Lead opportunity" count="01" />
      <article className="lead-card">
        <Image className="lead-image" src={opportunity.image} alt={opportunity.imageAlt} fill priority sizes="(max-width: 800px) 100vw, 70vw" />
        <div className="lead-shade" />
        <div className="lead-topline"><span>{opportunity.category}</span><SaveButton id={opportunity.id} title={opportunity.title} light /></div>
        <div className="lead-copy">
          <p className="cover-number">01 / Lead signal</p>
          <h1 id="lead-title"><Link href={`/opportunities/${opportunity.id}`}>{opportunity.shortTitle}</Link></h1>
          <p className="lead-dek">{opportunity.description}</p>
        </div>
        <div className="score-block"><span>Opportunity score</span><strong>{opportunity.score.toFixed(1)}</strong><small><i className="dot peak" /> {opportunity.signal}</small></div>
      </article>
      <div className="lead-analysis">
        <div className="analysis-main">
          <p className="eyebrow">Why this matters</p>
          <p>{opportunity.whyItMatters}</p>
        </div>
        <div className="angles">
          <p className="eyebrow">Content angles</p>
          <ol>{opportunity.contentAngles.map((angle) => <li key={angle}>{angle}</li>)}</ol>
        </div>
        <dl className="metrics">
          <div><dt>Volume</dt><dd>{opportunity.volume}</dd></div>
          <div><dt>Trend</dt><dd>{opportunity.trend}</dd></div>
          <div><dt>Related film</dt><dd>{opportunity.tmdbTitle || "Not available"}</dd></div>
          <div className="window"><dt>Timing</dt><dd>{opportunity.opportunityWindow}</dd></div>
        </dl>
      </div>
    </section>
  );
}

function OpportunityCard({ item, number }: { item: Opportunity; number: string }) {
  const accent = categoryAccents[item.category] ?? "#1e6f52";

  return (
    <article className="opportunity-card" style={{ "--story-accent": accent } as React.CSSProperties}>
      <Link className="card-image-wrap" href={`/opportunities/${item.id}`}>
        <Image src={item.image} alt={item.imageAlt} fill priority={number === "02"} sizes="(max-width: 800px) 100vw, 33vw" />
        <div className="card-number">{number}</div>
        <div className="card-score"><span>Score</span><strong>{item.score.toFixed(1)}</strong></div>
      </Link>
      <div className="card-save"><SaveButton id={item.id} title={item.title} light /></div>
      <div className="card-copy">
        <div className="card-meta"><span>{item.category}</span><span><i className="dot" />{item.signal}</span></div>
        <h3><Link href={`/opportunities/${item.id}`}>{item.title}</Link></h3>
        <p className="card-dek">{item.description}</p>
        <div className="card-angles">
          <span className="eyebrow">Editorial openings</span>
          {item.contentAngles.slice(0, 2).map((angle) => <p key={angle}>↳ {angle}</p>)}
        </div>
        <div className="card-footer"><span>{item.opportunityWindow}</span><strong>{item.trend}</strong></div>
      </div>
    </article>
  );
}

function NewsRail({ opportunities }: { opportunities: Opportunity[] }) {
  const lead = opportunities[0];

  return (
    <aside className="news-rail">
      <section>
        <div className="rail-heading"><span className="rule" />What happened today</div>
        <ol className="news-list">{opportunities.slice(0, 5).map((opportunity) => <li key={opportunity.id}><time>{formatUtcTime(opportunity.publishedAt)}</time><Link href={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></li>)}</ol>
      </section>
      <section>
        <div className="rail-heading"><span className="rule" />All scores today</div>
        {opportunities.slice(0, 4).map((opportunity) => (
          <div className="score-row" key={opportunity.id}><strong>{opportunity.score.toFixed(1)}</strong><i><span style={{ width: `${opportunity.score * 10}%` }} /></i><small>{opportunity.category.split(" ")[0]}</small></div>
        ))}
      </section>
      <section>
        <div className="rail-heading"><span className="rule" />Angles / Lead signal</div>
        {lead?.contentAngles.map((angle, i) => <a href="#top" className="rail-angle" key={angle}><small>Angle 0{i + 1}</small>{angle}</a>)}
      </section>
    </aside>
  );
}

function FilterPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`filter-panel ${open ? "filter-open" : ""}`} aria-hidden={!open}>
      <div className="filter-panel-head"><div><span className="eyebrow">Editorial desk</span><h2>Filter signals</h2></div><button className="icon-button" onClick={onClose} aria-label="Close filters"><X size={21} /></button></div>
      <label className="search-field"><Search size={17} /><input placeholder="Search today’s briefing" /></label>
      <fieldset><legend>Signal status</legend>{["Peak", "Rising", "Emerging"].map((item) => <label key={item}><input type="checkbox" defaultChecked />{item}</label>)}</fieldset>
      <fieldset><legend>Departments</legend>{categories.map((item, i) => <label key={item}><input type="checkbox" defaultChecked={i < 3} />{item}</label>)}</fieldset>
      <button className="apply-button" onClick={onClose}>Apply to briefing <ArrowUpRight size={16} /></button>
    </div>
  );
}

export function BriefingState({ label, message, onRetry }: { label: string; message: string; onRetry?: () => void }) {
  return (
    <section className="lead-wrap" aria-live="polite">
      <SectionHeader label={label} count="00" />
      <div className="lead-analysis">
        <div className="analysis-main">
          <p className="eyebrow">Today&apos;s briefing</p>
          <p>{message}</p>
          {onRetry && <button className="filter-button" onClick={onRetry}>Try again <ArrowUpRight size={14} /></button>}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<HomePageState>({
    status: "loading",
    opportunities: [],
    generatedAt: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadOpportunities() {
      setState((current) => ({ ...current, status: "loading", error: null }));
      try {
        const response = await fetchOpportunities(controller.signal);
        cacheOpportunities(response.opportunities);
        setState({
          status: "success",
          opportunities: response.opportunities,
          generatedAt: response.generatedAt,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          opportunities: [],
          generatedAt: null,
          error: requestError instanceof Error
            ? requestError.message
            : "The briefing could not be loaded. Please try again.",
        });
      }
    }

    void loadOpportunities();
    return () => controller.abort();
  }, [requestVersion]);

  const { opportunities } = state;
  const leadOpportunity = opportunities[0];
  const remainingOpportunities = opportunities.slice(1);

  return (
    <EditorialShell opportunities={opportunities} generatedAt={state.generatedAt}>
      <main>
        <div className="main-column">
          {state.status === "loading" && <BriefingState label="Loading opportunities" message="The editorial desk is assembling today's ranked opportunities." />}
          {state.status === "error" && <BriefingState label="Briefing unavailable" message={state.error || "The briefing could not be loaded."} onRetry={() => setRequestVersion((version) => version + 1)} />}
          {state.status === "success" && !leadOpportunity && <BriefingState label="No opportunities" message="No opportunities met today's editorial criteria." />}
          {state.status === "success" && leadOpportunity && (
            <>
              <LeadOpportunity opportunity={leadOpportunity} />
              <section id="signals" className="signals-section">
                <SectionHeader label="Today's signals" count={String(remainingOpportunities.length).padStart(2, "0")} />
                <div className="opportunity-grid">{remainingOpportunities.map((item, index) => <OpportunityCard item={item} number={String(index + 2).padStart(2, "0")} key={item.id} />)}</div>
              </section>
            </>
          )}
        </div>
        <NewsRail opportunities={opportunities} />
      </main>
    </EditorialShell>
  );
}

export function EditorialShell({ children, active = "Today", opportunities = [], generatedAt = null }: { children: React.ReactNode; active?: string; opportunities?: Opportunity[]; generatedAt?: string | null }) {
  const [navOpen, setNavOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <div className="site-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} opportunities={opportunities} active={active} />
      <div className="content-shell">
        <Masthead onMenu={() => setNavOpen(true)} onFilter={() => setFilterOpen(true)} generatedAt={generatedAt} count={opportunities.length} />
        {children}
        <footer className="site-footer">
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">The Movie Database</a>
        </footer>
      </div>
      {(navOpen || filterOpen) && <button className="page-scrim" onClick={() => { setNavOpen(false); setFilterOpen(false); }} aria-label="Close overlay" />}
      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
