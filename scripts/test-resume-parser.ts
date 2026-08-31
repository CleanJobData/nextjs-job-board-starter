/**
 * Runs the resume parser against every fixture in
 * features/resume/lib/__fixtures__ and reports what broke.
 *
 * Deliberately a plain script rather than a test-runner suite: this repo
 * has no test framework wired up, and the value here is a fast, readable
 * pass/fail table while iterating on heuristics.
 *
 *   npx tsx scripts/test-resume-parser.ts
 */
import { parseResumeText } from "@/features/resume/lib/parse";
import { RESUME_FIXTURES } from "@/features/resume/lib/__fixtures__/resumes";

let failures = 0;

for (const fixture of RESUME_FIXTURES) {
  const p = parseResumeText(fixture.text);
  const e = fixture.expect;
  const problems: string[] = [];

  if (e.name && p.contact.name !== e.name) problems.push(`name: got ${JSON.stringify(p.contact.name)} want ${JSON.stringify(e.name)}`);
  if (e.email && p.contact.email !== e.email) problems.push(`email: got ${JSON.stringify(p.contact.email)}`);
  if (e.phone && !p.contact.phone) problems.push(`phone: none found`);
  if (e.location && p.contact.location !== e.location) problems.push(`location: got ${JSON.stringify(p.contact.location)} want ${JSON.stringify(e.location)}`);
  if (e.summaryContains && !(p.summary ?? "").includes(e.summaryContains))
    problems.push(`summary missing ${JSON.stringify(e.summaryContains)} (got ${JSON.stringify((p.summary ?? "").slice(0, 60))})`);
  if (e.minSkills !== undefined && p.skills.length < e.minSkills)
    problems.push(`skills: ${p.skills.length} < ${e.minSkills}`);
  for (const bad of e.skillsExclude ?? []) {
    if (p.skills.some((s) => s.includes(bad))) problems.push(`skills leaked ${JSON.stringify(bad)}`);
  }
  if (e.experienceCount !== undefined && p.experience.length !== e.experienceCount)
    problems.push(`experience: ${p.experience.length} != ${e.experienceCount} (${JSON.stringify(p.experience.map((x) => x.title))})`);
  for (const [i, want] of (e.experienceCompanies ?? []).entries()) {
    const got = p.experience[i]?.company;
    if (got !== want) problems.push(`experience[${i}].company: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  }
  if (e.educationCount !== undefined && p.education.length !== e.educationCount)
    problems.push(`education: ${p.education.length} != ${e.educationCount}`);
  if (e.projectsCount !== undefined && p.projects.length !== e.projectsCount)
    problems.push(`projects: ${p.projects.length} != ${e.projectsCount}`);

  if (problems.length) {
    failures++;
    console.log(`\nFAIL  ${fixture.name}`);
    for (const pr of problems) console.log(`      - ${pr}`);
  } else {
    console.log(`ok    ${fixture.name}`);
  }
}

console.log(`\n${RESUME_FIXTURES.length - failures}/${RESUME_FIXTURES.length} fixtures passed`);
process.exit(failures > 0 ? 1 : 0);
