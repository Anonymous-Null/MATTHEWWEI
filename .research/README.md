# Briefing research

Run `npm ci` here, then `node --test test/*.test.mjs`.
From the deployment root, `node --use-env-proxy .research/scripts/research-briefing.mjs --deployment` refreshes briefing.json, briefing-history.json and the embedded snapshot.

Discovery reads publisher RSS/Atom feeds and AP/Business Insider section pages. A round-robin queue reads up to 240 unique articles, without rejecting them for a low headline interest score. Section discovery never supplies an invented publication date. Only dated, readable source pages qualify.

Ranking uses the article lead alongside the headline, retains the user's 35/30/20/15 weights, discounts unsupported capability claims, rejects routine statements and AI growth predictions, and clusters duplicate sanctions-reversal coverage. This remains deterministic scoring, not an LLM editor or exhaustive web search. Availability and rejection diagnostics are included in briefing.json. Direct Reuters pages may deny requests; accessible syndicated reporting can be discovered through Investing.com. Do not bypass access controls.

Explanations are attributed source excerpts. Science excerpts search for a contiguous passage with findings instead of blindly taking atmospheric introductions. No invented paraphrases or dates. Five real articles remain visible with older coverage explicitly labeled when necessary.

The deployed index.html contains a bundled copy of public/news.js; update both when changing shared ranking. Preserve the rest of the HTML, especially browser storage key daymark:v1 and personal feature handlers. No credentials or personal calendar data belong in public files.
