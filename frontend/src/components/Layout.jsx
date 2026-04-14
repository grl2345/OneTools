import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="app-layout" style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar />
      <div className="app-main-wrap" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div className="app-mobile-nav">
          <Navbar />
        </div>
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
