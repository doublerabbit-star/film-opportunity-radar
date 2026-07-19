"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookmarkX } from "lucide-react";
import { EditorialShell } from "@/components/home-page";
import { mockOpportunities } from "@/lib/mock-opportunities";
import { useWatchlist } from "@/lib/use-watchlist";

export function WatchlistPage() {
  const { items, toggle } = useWatchlist();
  const saved = mockOpportunities.filter((item) => items.includes(item.id));

  return (
    <EditorialShell active="Saved">
      <main className="watchlist-main">
        <header className="watchlist-header">
          <p className="eyebrow">Personal film desk / Local archive</p>
          <div><h1>Watchlist</h1><span>{String(saved.length).padStart(2, "0")} saved signals</span></div>
          <p>Opportunities held for closer attention. Your watchlist is stored only in this browser.</p>
        </header>
        {saved.length ? (
          <section className="watchlist-grid" aria-label="Saved opportunities">
            {saved.map((item, index) => (
              <article className="watchlist-item" key={item.id}>
                <Link href={`/opportunities/${item.id}`} className="watchlist-image">
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 700px) 100vw, 40vw" />
                  <span>0{index + 1}</span>
                </Link>
                <div className="watchlist-copy">
                  <div className="watchlist-meta"><span>{item.category}</span><strong>{item.score.toFixed(1)}</strong></div>
                  <h2><Link href={`/opportunities/${item.id}`}>{item.title}</Link></h2>
                  <p>{item.description}</p>
                  <div className="watchlist-actions"><Link href={`/opportunities/${item.id}`}>Open briefing <ArrowUpRight size={15} /></Link><button onClick={() => toggle(item.id)}><BookmarkX size={16} />Remove</button></div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="watchlist-empty"><span>00</span><h2>Your watchlist is clear.</h2><p>Save an opportunity from Today to keep it close.</p><Link href="/">Return to today <ArrowUpRight size={15} /></Link></section>
        )}
      </main>
    </EditorialShell>
  );
}
