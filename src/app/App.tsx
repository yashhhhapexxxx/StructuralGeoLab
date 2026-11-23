import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Landing from "@/pages/Landing";

// Route-level code splitting: each page is its own chunk.
const Learn = lazy(() => import("@/pages/Learn"));
const Lesson = lazy(() => import("@/pages/Lesson"));
const Lab = lazy(() => import("@/pages/Lab"));
const Descent = lazy(() => import("@/pages/Descent"));
const Glossary = lazy(() => import("@/pages/Glossary"));
const About = lazy(() => import("@/pages/About"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:slug" element={<Lesson />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/descent" element={<Descent />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
