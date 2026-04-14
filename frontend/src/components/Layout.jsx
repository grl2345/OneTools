import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * Responsive layout:
 *  • ≥ 900px  → left sidebar + main column
 *  • < 900px  → top navbar + stacked content (sidebar hidden)
 */
export default function Layout({ children }) {
  return (
    <div className="app-layout" style={{ minHeight: "100vh" }}>
      <Sidebar />
      <div className="app-main-wrap">
        <div className="app-mobile-nav">
          <Navbar />
        </div>
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
