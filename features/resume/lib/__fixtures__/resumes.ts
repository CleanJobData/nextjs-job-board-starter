/**
 * Real-world CV shapes the parser has to survive.
 *
 * Written after a run of one-bug-at-a-time fixes: each entry encodes a
 * layout that broke (or could plausibly break) the heuristics, with the
 * minimum assertions that prove it parsed sanely. Extraction is assumed to
 * have already happened - these are plain text, the same shape
 * extractLayoutAwareText() produces.
 */
export type ResumeFixture = {
  name: string;
  text: string;
  expect: {
    name?: string;
    email?: string;
    phone?: boolean;
    location?: string;
    summaryContains?: string;
    minSkills?: number;
    skillsExclude?: string[];
    experienceCount?: number;
    experienceTitles?: string[];
    /** Exact company names, in order - guards the "date and company on one line" split. */
    experienceCompanies?: string[];
    educationCount?: number;
    projectsCount?: number;
  };
};

export const RESUME_FIXTURES: ResumeFixture[] = [
  {
    name: "plural headings + unlabelled summary + category skills (the real-world case)",
    text: `Asadullah Jan
asadullah.jan@outlook.com
+92 (301) 5166679
Islamabad, Pakistan
linkedin.com/in/asadullah github.com/asadullah
Full-Stack Developer with hands-on experience building and scaling production-ready applications across web, mobile, and browser extensions with a proven track record of infrastructure management.
Skills
Core Strengths: Rapid Product Development, System Optimization
Frontend: React.js, Next.js, TypeScript
Backend: Node.js, Express.js, Django
Work Experiences
Jobr.pro - Software Developer Jan 2024 - Present
AI-powered job application automation platform
● Architected a modular Chrome extension across 5 platforms
● Built SEO-optimized job listing pages using Next.js SSR
Prospr at Work - Front End Developer Jan 2024 - May 2024
● Built responsive marketing pages using Astro and React.js
Personal Projects
Hydrate Me - Hydration Reminder App
React Native | Push Notifications
● Developed a cross-platform mobile app
Education
Goldsmiths University of London
● Bachelor of Science in Computer Science
Languages
● Pashto: Native
Online Profiles
● LinkedIn: https://linkedin.com/in/asadullah`,
    expect: {
      name: "Asadullah Jan",
      email: "asadullah.jan@outlook.com",
      phone: true,
      location: "Islamabad, Pakistan",
      summaryContains: "Full-Stack Developer",
      minSkills: 6,
      skillsExclude: ["Pashto", "Native", "LinkedIn", "Frontend: React.js"],
      experienceCount: 2,
      experienceCompanies: ["Jobr.pro", "Prospr at Work"],
      educationCount: 1,
      projectsCount: 1,
    },
  },
  {
    name: "ALL CAPS headings with colons",
    text: `Jane Smith
jane.smith@example.com | (555) 010-1234
PROFESSIONAL SUMMARY:
Backend engineer focused on distributed systems and reliability at scale over the past decade.
TECHNICAL SKILLS:
Go, Rust, Kubernetes, Terraform
PROFESSIONAL EXPERIENCE:
Senior Engineer
Stripe
2019 - 2024
- Owned the payments ledger service
EDUCATION:
Stanford University
MS Computer Science
2017 - 2019`,
    expect: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      summaryContains: "Backend engineer",
      minSkills: 4,
      experienceCount: 1,
      educationCount: 1,
    },
  },
  {
    name: "company-first with slash dates and em-dash range",
    text: `Marco Rossi
marco@rossi.dev
+39 340 111 2222
Profile
Product-minded frontend developer with eight years shipping consumer web applications in Europe.
Employment History
Acme GmbH — Lead Frontend Engineer
03/2021 – 05/2024
• Rebuilt the checkout funnel
• Cut bundle size by 45%
Globex SpA — Frontend Developer
06/2018 – 02/2021
• Maintained the design system
Skills
TypeScript, React, Vue, Testing Library
Education
Politecnico di Milano
BSc Computer Engineering
2014 - 2018`,
    expect: {
      name: "Marco Rossi",
      email: "marco@rossi.dev",
      summaryContains: "Product-minded",
      experienceCount: 2,
      educationCount: 1,
      minSkills: 4,
    },
  },
  {
    name: "no recognised headings at all (plain prose CV)",
    text: `Chris Taylor
chris.taylor@mail.com
+44 7700 900123
I am a data analyst with six years of experience working across retail and logistics analytics teams.
I worked at Tesco from 2019 to 2023 building reporting pipelines.
Before that I was at DHL from 2017 to 2019 doing operations analysis.`,
    expect: {
      name: "Chris Taylor",
      email: "chris.taylor@mail.com",
      phone: true,
      summaryContains: "data analyst",
    },
  },
  {
    name: "certifications and awards must not leak into skills",
    text: `Priya Nair
priya@example.org
+1 415 555 0100
Summary
Cloud infrastructure engineer specialising in multi-region reliability and cost optimisation work.
Skills
AWS, GCP, Terraform, Ansible
Certifications
AWS Certified Solutions Architect
Google Professional Cloud Architect
Awards
Employee of the Year 2022
Experience
Cloud Engineer
Netflix
2020 - 2024
- Ran the multi-region failover programme
Education
IIT Bombay
BTech Computer Science
2014 - 2018`,
    expect: {
      name: "Priya Nair",
      minSkills: 4,
      skillsExclude: ["AWS Certified Solutions Architect", "Employee of the Year 2022"],
      experienceCount: 1,
      educationCount: 1,
    },
  },
  {
    name: "single role, 'Present' only, no start year on its own line",
    text: `Sam Doe
sam@doe.io
+1 202 555 0199
About Me
Engineering manager leading platform teams and focused on developer experience improvements.
Work History
Engineering Manager, Shopify (Since 2021 - Present)
- Grew the platform team from 4 to 11
Skills
Leadership, Hiring, Go
Education
University of Toronto
BSc Software Engineering
2013 - 2017`,
    expect: {
      name: "Sam Doe",
      experienceCount: 1,
      educationCount: 1,
      summaryContains: "Engineering manager",
    },
  },
  {
    name: "per-role metadata lines (Technologies:/Live Product:) must not split or mislabel entries",
    text: `Dana Lee
dana@lee.dev
+1 917 555 0142
Summary
Platform engineer building internal developer tooling for large engineering organisations.
Work Experiences
Jobr.pro - Software Developer Jan 2024 - Present
AI-powered job application automation platform
● Architected a modular Chrome extension
Technologies: Next.js, Node.js, MongoDB
Live Product: https://jobr.pro/
Prospr at Work - Front End Developer Jan 2024 - May 2024
● Built responsive marketing pages
Technologies: Astro, React.js
Live Website: https://prospr.work/
Fastn - Internship Oct 2023 - Dec 2023
● Developed frontend features
Technologies: React.js
Education
Goldsmiths University of London
● Bachelor of Science in Computer Science`,
    expect: {
      name: "Dana Lee",
      experienceCount: 3,
      experienceCompanies: ["Jobr.pro", "Prospr at Work", "Fastn"],
      // "Technologies:" matches the skills heading pattern; if it is treated
      // as a section heading the experience list truncates and the rest of
      // the CV lands in skills.
      skillsExclude: ["Next.js, Node.js", "Astro, React.js"],
      educationCount: 1,
    },
  },
  {
    name: "wrapped body line starting with a section keyword is not a heading",
    text: `Asadullah Jan
asadullah.jan@outlook.com
+92 (301) 5166679
Full-Stack Developer with hands-on experience building and scaling production-ready applications across web and mobile platforms.
Work Experiences
Jobr.pro - Software Developer Jan 2024 - Present
● Architected a modular Chrome extension
Personal Projects
Coursera Video Summarizer Extension
JavaScript | Claude API | Notion API
● Developed a user dashboard for viewing lecture notes, managing integrations, and configuring
summary preferences with a real-time preview
Hydrate Me - Hydration Reminder App
React Native | Push Notifications
● Developed a cross-platform mobile app
Education
Goldsmiths University of London
● Bachelor of Science in Computer Science`,
    expect: {
      // The lowercase "summary preferences..." continuation line must not be
      // read as a Summary heading - doing so filed the Hydrate Me project as
      // the candidate's professional summary.
      summaryContains: "Full-Stack Developer",
      experienceCount: 1,
      projectsCount: 2,
      educationCount: 1,
    },
  },

];
