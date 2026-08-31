/**
 * End-to-end resume pipeline test: generate REAL PDFs, then run them
 * through the real extract -> parse pipeline.
 *
 * Why real PDFs rather than hand-written text fixtures: the hand-written
 * suite passed 8/8 while the actual product was badly broken, because
 * writing the fixtures by hand quietly assumed one bullet = one line.
 * Real PDFs wrap long bullets across several lines with no marker on the
 * continuation, which is the single thing that caused the most parser
 * damage. Generating the PDFs with a real layout engine means the fixtures
 * contain the wrapping, hyphenation and coordinate quirks that hand-written
 * text can never reproduce.
 *
 *   node --import tsx scripts/test-resume-pipeline.mjs
 */
import React from "react";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { extractPdfContent } from "../features/resume/lib/extract.ts";
import { extractLayoutAwareText } from "../features/resume/lib/extract.ts";
import { parseResumeText } from "../features/resume/lib/parse.ts";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  name: { fontSize: 18, fontWeight: 700 },
  heading: { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 4 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between" },
  bold: { fontWeight: 700 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  marker: { width: 12 },
  bulletText: { flex: 1 },
  sidebar: { position: "absolute", left: 36, top: 48, width: 150 },
  main: { marginLeft: 190 },
});

const Bullet = ({ children }) =>
  React.createElement(
    View,
    { style: styles.bullet },
    React.createElement(Text, { style: styles.marker }, "•"),
    React.createElement(Text, { style: styles.bulletText }, children)
  );

/** Long bullets on purpose - they must wrap, which is the whole point. */
const LONG_BULLETS = [
  "Architected a modular Chrome extension that automates job applications across 5 platforms (Greenhouse, Workable, Lever, Ashby HQ, SmartRecruiters) by reverse-engineering APIs and DOM structures, processing 50,000+ applications, and saving agents 3-7 minutes per submission",
  "Implemented comprehensive course management, including role-based access control (teachers/students), lesson organization, file uploads with a 10MB limit per file, and student enrollment workflows",
  "Engineered RESTful API with 25+ endpoints using Django REST Framework, drf-spectacular for OpenAPI documentation, and custom exception handling",
];

function singleColumnCv() {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(Text, { style: styles.name }, "Asadullah Jan"),
      React.createElement(Text, null, "asadullah.jan@outlook.com"),
      React.createElement(Text, null, "+92 (301) 5166679"),
      React.createElement(Text, null, "Islamabad, Pakistan"),
      React.createElement(
        Text,
        null,
        "Full-Stack Developer with hands-on experience building and scaling production-ready applications across web, mobile, and browser extensions. Skilled in both front-end and back-end development with a proven track record of infrastructure management, user analytics optimization, and system automation."
      ),

      React.createElement(Text, { style: styles.heading }, "Skills"),
      React.createElement(Text, null, "Frontend: React.js, Next.js, TypeScript, JavaScript (ES6+)"),
      React.createElement(Text, null, "Backend: Node.js, Express.js, Django, Python, MongoDB"),

      React.createElement(Text, { style: styles.heading }, "Work Experiences"),
      React.createElement(
        View,
        { style: styles.entryHeader },
        React.createElement(Text, { style: styles.bold }, "Jobr.pro - Software Developer"),
        React.createElement(Text, null, "Jan 2024 - Present")
      ),
      React.createElement(Text, null, "AI-powered job application automation platform"),
      React.createElement(Bullet, null, LONG_BULLETS[0]),
      React.createElement(Text, null, "Technologies: Next.js, Node.js, MongoDB, Tailwind CSS"),
      React.createElement(Text, null, "Live Product: https://jobr.pro/"),
      React.createElement(
        View,
        { style: styles.entryHeader },
        React.createElement(Text, { style: styles.bold }, "Prospr at Work - Front End Developer"),
        React.createElement(Text, null, "Jan 2024 - May 2024")
      ),
      React.createElement(Bullet, null, "Built responsive marketing pages using Astro and React.js with GSAP animations, translating Figma designs into production code"),
      React.createElement(Text, null, "Technologies: Astro, React.js, Sass"),

      React.createElement(Text, { style: styles.heading }, "Personal Projects"),
      React.createElement(Text, { style: styles.bold }, "Full-Stack Student Learning Platform"),
      React.createElement(Text, null, "Django | Next.js | PostgreSQL | WebSocket | Vercel"),
      React.createElement(Bullet, null, LONG_BULLETS[1]),
      React.createElement(Bullet, null, LONG_BULLETS[2]),
      React.createElement(Text, null, "Live Demo: https://e-learning-asad.vercel.app/auth/login"),
      React.createElement(Text, { style: styles.bold }, "Hydrate Me - Hydration Reminder App"),
      React.createElement(Text, null, "React Native | Push Notifications | AsyncStorage"),
      React.createElement(Bullet, null, "Developed a cross-platform mobile app (iOS/Android) that adjusts daily water intake goals based on real-time weather data using OpenWeather API"),

      React.createElement(Text, { style: styles.heading }, "Education"),
      React.createElement(Text, null, "Goldsmiths University of London"),
      React.createElement(Bullet, null, "Bachelor of Science in Computer Science"),

      React.createElement(Text, { style: styles.heading }, "Languages"),
      React.createElement(Bullet, null, "Pashto: Native")
    )
  );
}

function twoColumnCv() {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(
        View,
        { style: styles.sidebar },
        React.createElement(Text, { style: styles.heading }, "Skills"),
        React.createElement(Text, null, "TypeScript"),
        React.createElement(Text, null, "PostgreSQL"),
        React.createElement(Text, null, "Kubernetes"),
        React.createElement(Text, { style: styles.heading }, "Languages"),
        React.createElement(Text, null, "English"),
        React.createElement(Text, null, "Pashto")
      ),
      React.createElement(
        View,
        { style: styles.main },
        React.createElement(Text, { style: styles.name }, "Jane Doe"),
        React.createElement(Text, null, "jane@example.com"),
        React.createElement(Text, { style: styles.heading }, "Experience"),
        React.createElement(Text, { style: styles.bold }, "Staff Engineer"),
        React.createElement(Text, null, "Acme Corp"),
        React.createElement(Text, null, "2020 - Present"),
        React.createElement(Bullet, null, "Led the data platform team and delivered a migration that reduced query latency across the fleet"),
        React.createElement(Text, { style: styles.heading }, "Education"),
        React.createElement(Text, null, "MIT"),
        React.createElement(Text, null, "BSc Computer Science")
      )
    )
  );
}

const CASES = [
  {
    name: "single-column CV with long wrapping bullets (real PDF)",
    doc: singleColumnCv,
    check: (parsed, text) => {
      const problems = [];
      if (parsed.contact.name !== "Asadullah Jan") problems.push(`name: ${JSON.stringify(parsed.contact.name)}`);
      if (parsed.contact.email !== "asadullah.jan@outlook.com") problems.push(`email: ${JSON.stringify(parsed.contact.email)}`);
      if (!(parsed.summary ?? "").startsWith("Full-Stack Developer"))
        problems.push(`summary: ${JSON.stringify((parsed.summary ?? "").slice(0, 50))}`);
      if (parsed.experience.length !== 2) problems.push(`experience count ${parsed.experience.length} != 2`);
      if (parsed.experience[0]?.company !== "Jobr.pro") problems.push(`exp[0].company ${JSON.stringify(parsed.experience[0]?.company)}`);
      // The heart of it: 2 projects, not one per wrapped bullet line.
      if (parsed.projects.length !== 2) problems.push(`projects ${parsed.projects.length} != 2 -> ${JSON.stringify(parsed.projects.map((p) => p.name))}`);
      if (parsed.skills.some((s) => /Pashto|Native/i.test(s))) problems.push(`languages leaked into skills`);
      // A wrapped bullet must survive as ONE line, not several.
      if (!text.includes("saving agents 3-7 minutes per submission")) problems.push("wrapped bullet tail lost");
      const fragment = parsed.projects.some((p) => /^(enrollment workflows|OpenAPI documentation)/i.test(p.name ?? ""));
      if (fragment) problems.push("project name is a wrapped-bullet fragment");
      return problems;
    },
  },
  {
    name: "two-column CV (real PDF)",
    doc: twoColumnCv,
    check: (parsed) => {
      const problems = [];
      if (parsed.contact.email !== "jane@example.com") problems.push(`email ${JSON.stringify(parsed.contact.email)}`);
      if (parsed.experience.length !== 1) problems.push(`experience ${parsed.experience.length} != 1`);
      if (parsed.skills.some((s) => /Pashto|English/i.test(s))) problems.push("languages leaked into skills");
      return problems;
    },
  },
];

let failures = 0;
for (const c of CASES) {
  const buffer = await renderToBuffer(c.doc());
  const content = await extractPdfContent(buffer);
  const text = extractLayoutAwareText(content);
  const parsed = parseResumeText(text);
  const problems = c.check(parsed, text);
  if (problems.length) {
    failures++;
    console.log(`\nFAIL  ${c.name}`);
    problems.forEach((p) => console.log(`      - ${p}`));
  } else {
    console.log(`ok    ${c.name}`);
  }
}
console.log(`\n${CASES.length - failures}/${CASES.length} real-PDF cases passed`);
process.exit(failures ? 1 : 0);
