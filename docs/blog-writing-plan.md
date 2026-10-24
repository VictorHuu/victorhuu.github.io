# Research notes: writing plan

This file is an internal authoring guide. `docs` is excluded by `_config.yml`,
so the JD-oriented planning is not displayed on the public website.
All five notes are placeholders; none claims to be a published article.

## Biological Foundation Models — three notes

The following are capability mappings, not quotations from employers or a
claim that any particular vacancy is still open. Keep the public titles
knowledge-oriented; use the paper and rebuttal to supply concrete examples.

| Note | Planned sections | Relevant algorithm-role capability |
| --- | --- | --- |
| Single-cell Data, Gene and Cell Representations | Data and preprocessing; gene/value encoding; gene versus cell embeddings | Data processing, feature construction, embedding representations |
| Foundation Model Architectures and Representation Learning | Transformer backbone and masked objectives; positive views and negative samples; combining objectives and scheduling training | Model understanding, self-supervised learning, sample construction, loss design, training optimization |
| Evaluating Gene and Cell Representations | Frozen embeddings and downstream probes; controlled baselines and ablations; transfer and failure analysis | Evaluation design, experimental controls, model diagnosis, generalization analysis |

Use arXiv:2608.00985 as a project example, not as the table of contents.
Rebuttal material belongs within the relevant methods/evaluation sections;
it does not require additional posts or public reviewer-response headings.
Do not infer reviewer comments from the paper alone.

## Other areas — one placeholder each

- Social Simulation: Introduction to Social Simulation.
- Multi-Agent Systems: Introduction to Multi-Agent Systems.

Do not expand these areas until their actual scope is decided.

## Publishing a note

1. Add the article body to its existing `_pages/blog/<id>.md` file.
2. In `_data/blog.yml`, change only that article's `status` to `published`.
3. Remove `sitemap: false` from that page's front matter when ready to index it.
   The layout's robots directive also follows the article status.

Titles, ordering, topics and sidebar links live in `_data/blog.yml`.
Keep each Markdown page's `title` and `permalink` aligned with its index entry.
The existing homepage content and research data remain separate.

## Visual system

The shared `assets/css/research.css` uses deep teal (#2A4249), cream (#F1EFE3),
and a small sand accent (#D2C5B2). The palette is conference-inspired, not
conference branding. It contains a scoped homepage visual override and an
independent blog layout. No conference logos or artwork are copied.
