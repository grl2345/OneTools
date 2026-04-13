import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import JsonFormatter from "./pages/tools/JsonFormatter";
import MarkdownPreview from "./pages/tools/MarkdownPreview";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/json" element={<JsonFormatter />} />
        <Route path="/tools/markdown" element={<MarkdownPreview />} />
      </Routes>
    </Layout>
  );
}
