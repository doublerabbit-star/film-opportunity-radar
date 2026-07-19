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
import { useState } from "react";
import { mockOpportunities } from "@/lib/mock-opportunities";
import { useWatchlist } from "@/lib/use-watchlist";
import type { Opportunity } from "@/types";

export type HomeMovieEnrichment = {
  title: string;
  posterUrl: string | null;
  releaseDate: string;
  overview: string;
};

const categoryAccents: Record<string, string> = {
  "Cultural anxiety": "#7b2942",
  "Streaming economics": "#1e6f52",
  "Craft & production": "#b23b24",
  "Industry shift": "#1964ad",
  Exhibition: "#a76d00",
};

const leadOpportunity = mockOpportunities[0];
const opportunities = mockOpportunities.filter((item) => item.id !== leadOpportunity.id);

const signalCounts = mockOpportunities.reduce<Record<Opportunity["signal"], number>>(
  (counts, item) => ({ ...counts, [item.signal]: counts[item.signal] + 1 }),
  { Peak: 0, Rising: 0, Emerging: 0 },
);

const news = [
  ["04:12", "Shrek 5 projections revised upward by $80M"],
  ["05:44", "Dune: Messiah BTS footage surpasses 52M views"],
  ["06:00", "Q2 theatrical attendance report published"],
  ["07:15", "Three female debut directors enter global top 10"],
  ["08:30", "A24 announces slate expansion to 14 titles in 2027"],
];

const nav = [
  ["Today", "/", String(mockOpportunities.length)],
  ["Trending", "/#signals", "12"],
  ["Archive", "/#signals", ""],
  ["Saved", "/watchlist", "3"],
];
const categories = ["Cultural Anxiety", "Streaming Economics", "Craft & Production", "Industry Shift", "Exhibition"];

function Wordmark() {
  return (
    <a href="#top" className="wordmark" aria-label="Film Opportunity Radar home">
      <span className="wordmark-kicker">Film intelligence / 197</span>
      <span>Opportunity</span>
      <span>Radar</span>
    </a>
  );
}

function Sidebar({ open, onClose, active = "Today" }: { open: boolean; onClose: () => void; active?: string }) {
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

function Masthead({ onMenu, onFilter }: { onMenu: () => void; onFilter: () => void }) {
  return (
    <header className="masthead" id="top">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="briefing"><span className="eyebrow">Morning briefing</span><strong>Sunday, July 19, 2026</strong></div>
      <div className="live"><i className="dot rising" /> Live <span>Updated 06:00 GMT</span></div>
      <div className="masthead-actions">
        <span className="discourse">Discourse <strong>↑ +18%</strong> today</span>
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

function LeadOpportunity({ opportunity, movie }: { opportunity: Opportunity; movie?: HomeMovieEnrichment }) {
  return (
    <section className="lead-wrap" aria-labelledby="lead-title">
      <SectionHeader label="Lead opportunity" count="01" />
      <article className="lead-card">
        <Image className="lead-image" src={opportunity.image} alt={opportunity.imageAlt} fill priority sizes="(max-width: 800px) 100vw, 70vw" />
        <div className="lead-shade" />
        <div className="lead-topline"><span>{opportunity.category}</span><SaveButton id={opportunity.id} title={opportunity.title} light /></div>
        <div className="lead-copy">
          <p className="cover-number">01 / Lead signal</p>
          <h1 id="lead-title"><Link href="/opportunities/sequel-anxiety">The 2000s<br />sequel anxiety</Link></h1>
          <p className="lead-dek">{opportunity.description}</p>
        </div>
        <div className="score-block"><span>Opportunity score</span><strong>{opportunity.score.toFixed(1)}</strong><small><i className="dot peak" /> {opportunity.signal}</small></div>
      </article>
      <div className="lead-analysis">
        <div className="analysis-main">
          <p className="eyebrow">Why this matters</p>
          <p>Audience discourse has shifted from anticipation to exhaustion in under 60 days, creating a rare window where critical analysis dramatically outperforms hype coverage.</p>
        </div>
        <div className="angles">
          <p className="eyebrow">Content angles</p>
          <ol>
            <li>Why we keep getting nostalgia sequels completely wrong</li>
            <li>The 10 properties that deserve a second chance</li>
            <li>How sequel saturation is funding original filmmaking</li>
          </ol>
        </div>
        <dl className="metrics">
          <div><dt>Volume</dt><dd>2.4M / day</dd></div>
          <div><dt>7-day trend</dt><dd>+340%</dd></div>
          <div><dt>Related film</dt><dd>{movie?.title || "Mission: Impossible 9"}{movie?.releaseDate ? ` / ${movie.releaseDate.slice(0, 4)}` : ""}</dd></div>
          <div className="window"><dt>Timing</dt><dd>3-day peak window</dd></div>
        </dl>
      </div>
    </section>
  );
}

function OpportunityCard({ item, movie, number }: { item: Opportunity; movie?: HomeMovieEnrichment; number: string }) {
  const image = movie?.posterUrl || item.image;
  const imageAlt = movie?.posterUrl ? `${movie.title} poster` : item.imageAlt;
  const accent = categoryAccents[item.category] ?? "#1e6f52";

  return (
    <article className="opportunity-card" style={{ "--story-accent": accent } as React.CSSProperties}>
      <Link className="card-image-wrap" href={`/opportunities/${item.id}`}>
        <Image src={image} alt={imageAlt} fill sizes="(max-width: 800px) 100vw, 33vw" />
        <div className="card-number">{number}</div>
        <div className="card-score"><span>Score</span><strong>{item.score.toFixed(1)}</strong></div>
      </Link>
      <div className="card-save"><SaveButton id={item.id} title={item.title} light /></div>
      <div className="card-copy">
        <div className="card-meta"><span>{item.category}</span><span><i className="dot" />{item.signal}</span></div>
        <h3><Link href={`/opportunities/${item.id}`}>{item.title}</Link></h3>
        <p className="card-dek">{item.description}</p>
        {movie && (
          <div className="card-film-reference">
            <span>TMDb film reference</span>
            <strong>{movie.title}</strong>
            {movie.releaseDate && <small>Released {movie.releaseDate}</small>}
            {movie.overview && <p>{movie.overview}</p>}
          </div>
        )}
        <div className="card-angles">
          <span className="eyebrow">Editorial openings</span>
          {item.contentAngles.slice(0, 2).map((angle) => <p key={angle}>↳ {angle}</p>)}
        </div>
        <div className="card-footer"><span>{item.opportunityWindow}</span><strong>{item.trend}</strong></div>
      </div>
    </article>
  );
}

function NewsRail() {
  return (
    <aside className="news-rail">
      <section>
        <div className="rail-heading"><span className="rule" />What happened today</div>
        <ol className="news-list">{news.map(([time, title]) => <li key={time}><time>{time}</time><a href="#signals">{title}</a></li>)}</ol>
      </section>
      <section>
        <div className="rail-heading"><span className="rule" />All scores today</div>
        {[['9.2', 'Cultural', '92%'], ['8.1', 'Streaming', '81%'], ['7.8', 'Craft', '78%'], ['7.4', 'Industry', '74%']].map(([score, label, width]) => (
          <div className="score-row" key={score}><strong>{score}</strong><i><span style={{ width }} /></i><small>{label}</small></div>
        ))}
      </section>
      <section>
        <div className="rail-heading"><span className="rule" />Angles / Lead signal</div>
        {["Why we keep getting nostalgia sequels completely wrong", "The 10 properties that deserve a second chance", "How sequel saturation is quietly funding original filmmaking"].map((angle, i) => <a href="#top" className="rail-angle" key={angle}><small>Angle 0{i + 1}</small>{angle}</a>)}
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

export function HomePage({ tmdbMovies = {} }: { tmdbMovies?: Record<string, HomeMovieEnrichment> }) {
  return (
    <EditorialShell>
      <main>
        <div className="main-column">
          <LeadOpportunity opportunity={leadOpportunity} movie={tmdbMovies[leadOpportunity.id]} />
          <section id="signals" className="signals-section">
            <SectionHeader label="Today's signals" count={String(opportunities.length).padStart(2, "0")} />
            <div className="opportunity-grid">{opportunities.map((item, index) => <OpportunityCard item={item} movie={tmdbMovies[item.id]} number={String(index + 2).padStart(2, "0")} key={item.id} />)}</div>
          </section>
        </div>
        <NewsRail />
      </main>
    </EditorialShell>
  );
}

export function EditorialShell({ children, active = "Today" }: { children: React.ReactNode; active?: string }) {
  const [navOpen, setNavOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <div className="site-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} active={active} />
      <div className="content-shell">
        <Masthead onMenu={() => setNavOpen(true)} onFilter={() => setFilterOpen(true)} />
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
