# Briefing research

Run `npm ci` here, then `node --test test/*.test.mjs`.
From the deployment root, `node --use-env-proxy .research/scripts/research-briefing.mjs --deployment` refreshes briefing.json, briefing-history.json and the embedded snapshot.

Discovery reads publisher RSS/Atom feeds and AP/Business Insider section pages. A round-robin queue reads up to 240 unique articles, without rejecting them for a low headline interest score. Section discovery never supplies an invented publication date. Only dated, readable source pages qualify.

Ranking uses the article lead alongside the headline, retains the user's 35/30/20/15 weights, discounts unsupported capability claims, rejects routine statements and AI growth predictions, and clusters duplicate sanctions-reversal coverage. This remains deterministic scoring, not an LLM editor or exhaustive web search. Availability and rejection diagnostics are included in briefing.json. Direct Reuters pages may deny requests; accessible syndicated reporting can be discovered through Investing.com. Do not bypass access controls.

Explanations are attributed source excerpts. Science excerpts search for a contiguous passage with findings instead of blindly taking atmospheric introductions. No invented paraphrases or dates. Five real articles remain visible with older coverage explicitly labeled when necessary.

The deployed index.html contains a bundled copy of public/news.js; update both when changing shared ranking. Preserve the rest of the HTML, especially browser storage key daymark:v1 and personal feature handlers. No credentials or personal calendar data belong in public files.

## Personal five-slot layout

The active layout is `nyt-interests-us-world-v1`: the first item in NYT's official HomePage RSS feed; two personal-interest reports; one US report; one world report. `selectPersonalBriefing` creates the edition. `publishedPersonalBriefing` preserves its ordering across browser visits, refreshes, failures and check-in boundaries. Do not pass a published fixed-slot edition back through global ranking.

Only topic preferences are in source; do not publish the user's biography. Preferences cover EE/CS, embedded electronics, battery/materials work, AI, college access and major scholarships, ROTC, aviation/space and related interests. Mere college names, AI-related criminal scandals, speculative jobs commentary, and sponsored content do not qualify as personal relevance. Urgent eligibility, cost or deadline changes can replace slots 2–5, explicitly labeled. NYT lead is never displaced by scoring.

NYT RSS summaries may be used when the full NYT article is unavailable, labeled feed-only. If the official feed is unreachable, keep a previous NYT lead or explicitly label an alternative `NYT unavailable`; never relabel another publisher. The NYT lead is allowed to remain unchanged. Other slots retain story-history filtering. The hourly catch-up retries NYT feed outages.

Run `node --test .research/test/*.test.mjs` from the deployment root. `node .research/test/personal-browser.mjs` verifies fixed slots, feed-only labels, bookmarks, refreshes, next-window carryover and offline behavior in Chromium. `RESEARCH_REVIEW_PATH=/tmp/candidates.json` optionally saves all checked candidates for local review; do not publish that file. No API key or additional paid service is needed for this feed-based implementation.
