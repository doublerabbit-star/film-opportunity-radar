"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Bookmark, Check, Clock3, ExternalLink } from "lucide-react";
import { EditorialShell } from "@/components/home-page";
import { useWatchlist } from "@/lib/use-watchlist";
import type { MockOpportunity } from "@/lib/mock-opportunities";

export function OpportunityDetail({ opportunity }: { opportunity: MockOpportunity }) {
  const { isSaved, toggle } = useWatchlist();
  const saved = isSaved(opportunity.id);

  return (
    <EditorialShell>
      <main className="detail-main">
        <article className="detail-article">
          <div className="detail-back"><Link href="/"><ArrowLeft size={15} />Back to today&apos;s briefing</Link><span>Opportunity / {opportunity.score}</span></div>
          <header className="detail-hero">
            <Image src={opportunity.image} alt={opportunity.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 80vw" />
            <div className="detail-hero-shade" />
            <div className="detail-category">{opportunity.category}</div>
            <div className="detail-hero-copy">
              <p>{opportunity.signal} signal / Today</p>
              <h1>{opportunity.title}</h1>
              <p className="detail-dek">{opportunity.description}</p>
            </div>
            <div className="detail-score"><span>Opportunity score</span><strong>{opportunity.score}</strong></div>
          </header>

          <div className="detail-facts">
            <div><span>Source</span><strong>{opportunity.source}</strong></div>
            <div><span>Published</span><strong>{opportunity.published}</strong></div>
            <div><span>7-day trend</span><strong>{opportunity.trend}</strong></div>
            <div><span>Timing</span><strong>{opportunity.window}</strong></div>
            <button className={saved ? "detail-save saved" : "detail-save"} onClick={() => toggle(opportunity.id)}>{saved ? <Check size={16} /> : <Bookmark size={16} />}{saved ? "Saved to watchlist" : "Save to watchlist"}</button>
          </div>

          <div className="detail-body">
            <section className="detail-why">
              <span className="detail-index">01</span>
              <p className="eyebrow">Editorial assessment</p>
              <h2>Why this matters now</h2>
              <p>{opportunity.why}</p>
              <aside className="timing-note"><Clock3 size={17} /><div><span>Publishing window</span><strong>{opportunity.window}</strong><p>Lead with analysis while the conversation is still forming.</p></div></aside>
            </section>
            <section className="detail-list-section">
              <div className="detail-list-heading"><span className="detail-index">02</span><div><p className="eyebrow">Creator brief</p><h2>Content angles</h2></div></div>
              <ol>{opportunity.angles.map((angle, index) => <li key={angle}><span>0{index + 1}</span><p>{angle}</p><ArrowUpRight size={18} /></li>)}</ol>
            </section>
            <section className="detail-list-section title-ideas">
              <div className="detail-list-heading"><span className="detail-index">03</span><div><p className="eyebrow">Working headlines</p><h2>Title directions</h2></div></div>
              <ol>{opportunity.titles.map((title, index) => <li key={title}><span>0{index + 1}</span><p>{title}</p></li>)}</ol>
            </section>
          </div>
          <footer className="detail-footer"><span>Source material</span><a href="#top">Open original signal <ExternalLink size={14} /></a></footer>
        </article>
      </main>
    </EditorialShell>
  );
}
