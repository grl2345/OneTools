import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";

// Tool pages and the (rarely-visited) legal pages are lazy-loaded so the
// initial bundle only contains the shell + home page. Each route gets its
// own chunk, which improves LCP for the landing page and for any tool
// page entered directly via a search result.
const JsonFormatter   = lazy(() => import("./pages/tools/JsonFormatter"));
const MarkdownPreview = lazy(() => import("./pages/tools/MarkdownPreview"));
const ImageCompress   = lazy(() => import("./pages/tools/ImageCompress"));
const Timestamp       = lazy(() => import("./pages/tools/Timestamp"));
const RemoveBg        = lazy(() => import("./pages/tools/RemoveBg"));
const RemoveWatermark = lazy(() => import("./pages/tools/RemoveWatermark"));
const NamingAssistant = lazy(() => import("./pages/tools/NamingAssistant"));
const CronTool        = lazy(() => import("./pages/tools/CronTool"));
const Base64Tool      = lazy(() => import("./pages/tools/Base64"));
const IdPhoto         = lazy(() => import("./pages/tools/IdPhoto"));
const Flowchart       = lazy(() => import("./pages/tools/Flowchart"));
const PdfSummary      = lazy(() => import("./pages/tools/PdfSummary"));
const Ocr             = lazy(() => import("./pages/tools/Ocr"));
const ImageToTable    = lazy(() => import("./pages/tools/ImageToTable"));
const Handwriting     = lazy(() => import("./pages/tools/Handwriting"));
const ExifTool        = lazy(() => import("./pages/tools/Exif"));
const Whisper         = lazy(() => import("./pages/tools/Whisper"));
const Upscale         = lazy(() => import("./pages/tools/Upscale"));
const VideoCompress   = lazy(() => import("./pages/tools/VideoCompress"));
const Pdf             = lazy(() => import("./pages/tools/Pdf"));
const QrCode          = lazy(() => import("./pages/tools/QrCode"));
const VideoToGif      = lazy(() => import("./pages/tools/VideoToGif"));
const FileEncrypt     = lazy(() => import("./pages/tools/FileEncrypt"));
const Palette         = lazy(() => import("./pages/tools/Palette"));
const Privacy         = lazy(() => import("./pages/Privacy"));
const Terms           = lazy(() => import("./pages/Terms"));
const About           = lazy(() => import("./pages/About"));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: 14,
      }}
    >
      <span>Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/tools/pdf" element={<Pdf />} />
          <Route path="/tools/qrcode" element={<QrCode />} />
          <Route path="/tools/video-to-gif" element={<VideoToGif />} />
          <Route path="/tools/file-encrypt" element={<FileEncrypt />} />
          <Route path="/tools/palette" element={<Palette />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
