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
import Base64Tool from "./pages/tools/Base64";
import IdPhoto from "./pages/tools/IdPhoto";
import Flowchart from "./pages/tools/Flowchart";
import PdfSummary from "./pages/tools/PdfSummary";
import Ocr from "./pages/tools/Ocr";
import ImageToTable from "./pages/tools/ImageToTable";
import Handwriting from "./pages/tools/Handwriting";
import ExifTool from "./pages/tools/Exif";
import Whisper from "./pages/tools/Whisper";
import Upscale from "./pages/tools/Upscale";
import VideoCompress from "./pages/tools/VideoCompress";
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
        <Route path="/tools/base64" element={<Base64Tool />} />
        <Route path="/tools/id-photo" element={<IdPhoto />} />
        <Route path="/tools/flowchart" element={<Flowchart />} />
        <Route path="/tools/pdf-summary" element={<PdfSummary />} />
        <Route path="/tools/ocr" element={<Ocr />} />
        <Route path="/tools/image-to-table" element={<ImageToTable />} />
        <Route path="/tools/handwriting" element={<Handwriting />} />
        <Route path="/tools/exif" element={<ExifTool />} />
        <Route path="/tools/whisper" element={<Whisper />} />
        <Route path="/tools/upscale" element={<Upscale />} />
        <Route path="/tools/video-compress" element={<VideoCompress />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}
