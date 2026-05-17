import { ImageResponse } from "next/og";
import { getJobById } from "@/lib/api/jobs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Job Opportunity";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CleanJobData";
  
  try {
    const job = await getJobById(id);

    if (!job) {
      throw new Error("Job not found");
    }

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
          {/* Subtle Grid Pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(rgba(5,150,105,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              display: "flex",
            }}
          />

          {/* Layered Glow effects */}
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

          {/* Content Container */}
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
            {/* Header: Company Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "48px",
              }}
            >
              {job.company?.logo ? (
                <img
                  src={job.company.logo}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "20px",
                    background: "white",
                    padding: "10px",
                    objectFit: "contain",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  }}
                />
              ) : (
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
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" />
                  </svg>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "white",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {job.company?.name || "Job Opportunity"}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    color: "#059669",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginTop: "4px",
                  }}
                >
                  Now Hiring
                </div>
              </div>
            </div>

            {/* Job Title */}
            <div
              style={{
                fontSize: "84px",
                fontWeight: 800,
                lineHeight: 1.05,
                color: "white",
                letterSpacing: "-0.05em",
                marginBottom: "32px",
                display: "flex",
                maxWidth: "900px",
              }}
            >
              {job.title}
            </div>

            {/* Footer: Metadata */}
            <div
              style={{
                display: "flex",
                gap: "32px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "28px",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 500,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{job.location || "Remote / Multiple"}</span>
              </div>

              {job.salary_text && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "28px",
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 500,
                  }}
                >
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
                  <span>{job.salary_text}</span>
                </div>
              )}

              {job.has_remote && (
                <div
                  style={{
                    fontSize: "22px",
                    background: "rgba(5,150,105,0.15)",
                    color: "#10b981",
                    padding: "6px 20px",
                    borderRadius: "100px",
                    border: "1px solid rgba(5,150,105,0.4)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Remote Friendly
                </div>
              )}
            </div>
          </div>

          {/* Brand Watermark */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "60px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              opacity: 0.6,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "#059669",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span style={{ color: "white", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {siteName}
            </span>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (error) {
    console.error("[OG Image Error]", error);
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            background: "#020c07",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: "64px", fontWeight: 800, color: "white" }}>{siteName}</div>
          <div style={{ fontSize: "32px", color: "#059669", marginTop: "24px" }}>New Job Opportunity</div>
        </div>
      ),
      { ...size }
    );
  }
}
