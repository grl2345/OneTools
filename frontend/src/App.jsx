import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import JsonFormatter from "./pages/tools/JsonFormatter";
import MarkdownPreview from "./pages/tools/MarkdownPreview";
import ImageCompress from "./pages/tools/ImageCompress";
import Timestamp from "./pages/tools/Timestamp";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/json" element={<JsonFormatter />} />
        <Route path="/tools/markdown" element={<MarkdownPreview />} />
        <Route path="/tools/image-compress" element={<ImageCompress />} />
        <Route path="/tools/timestamp" element={<Timestamp />} />
      </Routes>
    </Layout>
  );
}
