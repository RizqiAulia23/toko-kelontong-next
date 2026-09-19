// app/page.tsx — Public storefront
import Link from "next/link";
import { getActiveProducts, getFeaturedProducts, getCategories, getTotalActiveProducts } from "@/lib/storefront";
import ContactForm from "@/components/ContactForm";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = sp.q;
  const categoryId = sp.category ? parseInt(sp.category, 10) : undefined;

  const [products, featured, categories, totalLive] = await Promise.all([
    getActiveProducts(q, categoryId),
    getFeaturedProducts(),
    getCategories(),
    getTotalActiveProducts(),
  ]);

  return (
    <div>
      {/* Store Navigation */}
      <nav className="store-nav">
        <div className="store-nav-inner">
          <div className="brand" style={{ border: "none", padding: 0 }}>
            <div className="brand-mark">V</div>
            <div>
              <div className="brand-name">VLONIX</div>
              <div className="brand-sub">Retail OS</div>
            </div>
          </div>
          <div className="store-links">
            <a href="#shop" className="active">Shop</a>
            <a href="#categories">Categories</a>
            <a href="#contact">Contact</a>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link className="btn btn-secondary btn-sm" href="/admin">
              <i className="fa-solid fa-right-to-bracket"></i> Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div>
          <div className="hero-eyebrow">
            <span className="dot" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px rgba(16,185,129,.9)" }} />
            {" "}VLONIX LIVE CATALOGUE
          </div>
          <h1>
            Your daily essentials, <span>engineered for speed.</span>
          </h1>
          <p>
            Real-time retail cockpit inventory. Fresh sembako, pantry staples and
            household supplies — curated, priced and stocked by VLONIX ops.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a className="btn btn-primary" href="#shop">
              <i className="fa-solid fa-bag-shopping"></i> Browse Catalog
            </a>
            <a className="btn btn-secondary" href="#contact">
              <i className="fa-solid fa-headset"></i> Talk to Sales
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{totalLive}</strong>
              <small>Live SKUs</small>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <small>Categories</small>
            </div>
            <div>
              <strong>24h</strong>
              <small>Dispatch Window</small>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", position: "relative" }}>
            <div className="brand-mark" style={{ width: "44px", height: "44px" }}>V</div>
            <div>
              <strong>VLONIX Operations Deck</strong>
              <br />
              <small style={{ color: "var(--muted)" }}>Live storefront draws directly from admin database.</small>
            </div>
          </div>
          {featured.length === 0 ? (
            <p style={{ color: "var(--muted)", position: "relative" }}>Catalog is syncing. Check back shortly.</p>
          ) : (
            featured.map((f) => (
              <div className="list-item" key={f.product_id} style={{ background: "rgba(30,41,59,.4)", border: "1px solid rgba(51,65,85,.5)", borderRadius: "8px", marginBottom: "10px", position: "relative" }}>
                {f.product_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/uploads/products/${f.product_image}`} alt="" style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px" }} />
                )}
                <div className="grow">
                  <strong>{f.product_name}</strong>
                  <br />
                  <small>{f.category_name ?? ""}</small>
                </div>
                <span className="p-price">Rp {Number(f.product_price).toLocaleString("id-ID")}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Product Grid */}
      <section className="shop-section" id="shop">
        <h2 style={{ fontSize: "24px", letterSpacing: "-.01em" }}>Live Product Grid</h2>
        <p style={{ color: "var(--muted)", marginTop: "4px" }}>All active items pulled from <code>tb_product</code> in real time.</p>

        <div id="categories" style={{ marginTop: "20px" }}>
          <form method="get" action="/#shop" style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-box" style={{ flex: "1", minWidth: "220px" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input type="search" name="q" className="form-control" style={{ maxWidth: "none", paddingLeft: "38px" }} placeholder="Search products..." defaultValue={q ?? ""} />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              <i className="fa-solid fa-filter"></i> Filter
            </button>
            {(q || categoryId) && (
              <Link className="btn btn-ghost btn-sm" href="/#shop">Reset</Link>
            )}
          </form>

          <div className="filter-bar">
            <Link className={`filter-pill ${!categoryId ? "active" : ""}`} href={q ? `/?q=${encodeURIComponent(q)}#shop` : "/#shop"}>All</Link>
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                className={`filter-pill ${categoryId === cat.category_id ? "active" : ""}`}
                href={`/?category=${cat.category_id}${q ? `&q=${encodeURIComponent(q)}` : ""}#shop`}
              >
                {cat.category_name}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div className="empty-icon"><i className="fa-solid fa-box-open"></i></div>
              <h3>No products found.</h3>
              <p>No active items match your search term or selected category right now.</p>
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <article className="p-card" key={p.product_id}>
                {p.product_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/uploads/products/${p.product_image}`} alt={p.product_name} loading="lazy" />
                ) : (
                  <div style={{ height: "170px", background: "var(--s2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "32px" }}><i className="fa-solid fa-image"></i></div>
                )}
                <div className="p-card-body">
                  <small>{p.category_name ?? "General"}</small>
                  <h3>{p.product_name}</h3>
                  <p>{p.product_description}</p>
                  <div className="p-card-foot">
                    <span className="p-price">Rp {Number(p.product_price).toLocaleString("id-ID")}</span>
                    <span className="badge badge-active"><span className="dot"></span>In Stock</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section className="shop-section" id="contact">
        <div className="contact-grid">
          <div>
            <h2 style={{ fontSize: "24px" }}>Contact Retail Desk</h2>
            <p style={{ color: "var(--muted)", margin: "6px 0 18px" }}>Bulk orders, subscriptions, or procurement questions. Every submission lands in the admin inbox (<code>tb_message</code>).</p>
            <div className="card">
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div><i className="fa-solid fa-location-dot" style={{ color: "var(--primary)", width: "22px" }} /> VLONIX Operations Center, Jakarta</div>
                <div><i className="fa-solid fa-phone" style={{ color: "var(--secondary)", width: "22px" }} /> +62 812-8899-0011</div>
                <div><i className="fa-solid fa-envelope" style={{ color: "var(--tertiary)", width: "22px" }} /> admin@vlonix.local</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="store-footer">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <strong style={{ color: "var(--text)" }}>VLONIX</strong> — Modern Retail OS · Admin Cockpit &amp; Storefront backed by PostgreSQL<br />
          <Link href="/admin" style={{ color: "var(--secondary)" }}>Admin Login</Link>
        </div>
      </footer>
    </div>
  );
}
