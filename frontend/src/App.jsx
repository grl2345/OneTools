import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import JsonFormatter from "./pages/tools/JsonFormatter";
import MarkdownPreview from "./pages/tools/MarkdownPreview";
import ImageCompress from "./pages/tools/ImageCompress";
import Timestamp from "./pages/tools/Timestamp";
import RemoveBg from "./pages/tools/RemoveBg";
import RemoveWatermark from "./pages/tools/RemoveWatermark";
import NamingAssistant from "./pages/tools/NamingAssistant";
import CronTool from "./pages/tools/CronTool";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/json" element={<JsonFormatter />} />
        <Route path="/tools/markdown" element={<MarkdownPreview />} />
        <Route path="/tools/image-compress" element={<ImageCompress />} />
        <Route path="/tools/timestamp" element={<Timestamp />} />
        <Route path="/tools/remove-bg" element={<RemoveBg />} />
        <Route path="/tools/remove-watermark" element={<RemoveWatermark />} />
        <Route path="/tools/naming" element={<NamingAssistant />} />
        <Route path="/tools/cron" element={<CronTool />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}
