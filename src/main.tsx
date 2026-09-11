import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import "./styles/index.css";

const Page =
  window.location.pathname.replace(/\/$/, "") === "/story"
    ? lazy(() => import("./app/story/StoryPage"))
    : lazy(() => import("./app/App"));
createRoot(document.getElementById("root")!).render(
  <Suspense
    fallback={
      <div
        role="status"
        style={{
          padding: "2rem",
          color: "#16392A",
          background: "#F9F8E8",
          minHeight: "100vh",
        }}
      >
        Kimie's jars…
      </div>
    }
  >
    <Page />
  </Suspense>,
);
