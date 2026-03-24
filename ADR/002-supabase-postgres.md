# ADR-002: Supabase as Backend Database

## Decision

Use **Supabase (PostgreSQL)** as the primary backend (not Firebase, not MongoDB, not DynamoDB).

## Context

Need to pick database + backend infrastructure. Candidates:
- Supabase (Postgres + Auth + Storage)
- Firebase (Firestore + Auth + Realtime)
- MongoDB Atlas
- DynamoDB (AWS)

## Rationale

**Supabase wins because**:
1. **PostgreSQL** → structured data (users, analyses, reports), ACID compliance, RLS for security
2. **Built-in Auth** → Clerk integrates cleanly via webhooks
3. **Row-Level Security (RLS)** → enforced at DB level, not application level (safer)
4. **Vector/JSONB support** → future-proof for AI embeddings + unstructured data
5. **Edge Functions** → deploy functions near database, low latency
6. **Price** → generous free tier, $25/month for production
7. **Developer experience** → SQL-native (vs Firebase's query limitations)
8. **Data portability** → standard PostgreSQL, can migrate if needed

**Why not Firebase?**:
- Limited SQL capabilities
- Auth less flexible (Clerk integration awkward)
- NoSQL pricing scales unpredictably with reads

**Why not MongoDB**?:
- JSONB/RLS not as strong as Postgres
- No built-in auth
- Worse for relational data (users ↔ analyses ↔ reports)

**Why not DynamoDB**?:
- AWS lock-in
- Requires separate Cognito or external auth
- Complex pricing model

## Consequences

**Positive**:
- RLS provides security at database level
- SQL is familiar to most developers
- Future AI features (embeddings, vectors) easier
- Easy to write migrations and rollbacks

**Negative**:
- Need to manage migrations (not automatic schema updates)
- Requires understanding of PostgreSQL (but worth learning)
- N+1 query problems if not careful (mitigated by good ORM)

## Status

**ACCEPTED** — Supabase will be primary database

---

Date: 2024-03-24
Decided by: Pavel + database-architect
