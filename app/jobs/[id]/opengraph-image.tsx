import { ImageResponse } from "next/og";
import { getJobById } from "@/lib/api/jobs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const { id } = await params;
  const job = await getJobById(id);

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
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "100px",
            width: "700px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "white",
                  padding: "8px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: "#059669",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="40"
                  height="40"
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
                fontSize: "32px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {job.company?.name || "Job Opportunity"}
            </div>
          </div>

          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "white",
              letterSpacing: "-0.04em",
              marginBottom: "24px",
              display: "flex",
            }}
          >
            {job.title}
          </div>

          <div
            style={{
              display: "flex",
              gap: "24px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                color: "#059669",
                fontWeight: 600,
              }}
            >
              {job.location}
            </div>
            {job.salary_text && (
              <div
                style={{
                  fontSize: "28px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                • {job.salary_text}
              </div>
            )}
            {job.has_remote && (
              <div
                style={{
                  fontSize: "24px",
                  background: "rgba(5,150,105,0.15)",
                  color: "#059669",
                  padding: "4px 16px",
                  borderRadius: "100px",
                  border: "1px solid rgba(5,150,105,0.3)",
                }}
              >
                Remote
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
