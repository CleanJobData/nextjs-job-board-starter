import { ImageResponse } from "next/og";

export const alt = "Job Opportunity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CleanJobData";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#020c07",
          display: "flex",
          position: "relative",
          fontFamily: "sans-serif",
          overflow: "hidden",
          border: "1px solid rgba(5,150,105,0.2)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(5,150,105,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-50px",
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            left: "-100px",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 60%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 100px",
            width: "100%",
            height: "100%",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "48px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(5,150,105,0.2)",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" />
              </svg>
            </div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              {siteName}
            </div>
          </div>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 800,
              lineHeight: 1.05,
              color: "white",
              letterSpacing: "-0.05em",
              marginBottom: "32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>New job</span>
            <span style={{ color: "#10b981" }}>opportunity.</span>
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "rgba(255,255,255,0.6)",
              maxWidth: "700px",
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            Explore roles curated for data professionals and engineers.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "8px",
            background: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
