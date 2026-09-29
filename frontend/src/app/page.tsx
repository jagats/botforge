export default function HomePage() {
  return (
    <main className="container">
      <header className="header">
        <span className="badge">Phase 0: Environment Ready</span>
        <h1 className="title">BotForge</h1>
        <p className="subtitle">
          Multi-tenant AI Bot-as-a-Service Platform. Ingest documents, embed content,
          and deploy embeddable chatbots grounded strictly in your client&apos;s data.
        </p>
      </header>

      <section className="grid">
        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            PostgreSQL
          </h2>
          <p className="card-desc">Port 5432 &bull; Relational database for tenants, users, API keys, and logs.</p>
        </div>

        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            Qdrant Vector DB
          </h2>
          <p className="card-desc">Port 6333 &bull; Fast semantic retrieval filtered strictly by tenant ID.</p>
        </div>

        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            FastAPI Backend
          </h2>
          <p className="card-desc">Port 8000 &bull; Asynchronous REST API, RAG orchestration, and background tasks.</p>
        </div>

        <div className="card">
          <h2 className="card-title">
            <span className="status-dot"></span>
            Next.js Frontend
          </h2>
          <p className="card-desc">Port 3000 &bull; Client dashboard for document management and bot preview.</p>
        </div>
      </section>
    </main>
  );
}
