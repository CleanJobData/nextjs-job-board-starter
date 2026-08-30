import { FaMagnifyingGlass, FaBuilding, FaBriefcase } from "react-icons/fa6";
import { Card, CardContent } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

/**
 * Same "copy at the top, layout below" split as Hero.tsx - each item's
 * icon/title/description is the part a template consumer would actually
 * want to swap out (a different icon set, different value props), so it's
 * kept as one plain array rather than repeated inline JSX per card.
 */
const FEATURES = [
  {
    icon: FaMagnifyingGlass,
    title: "Structured search",
    description: "Filter by location, remote type, experience level, and salary - not just keywords.",
  },
  {
    icon: FaBriefcase,
    title: "Track every application",
    description: "Save jobs, log notes, and follow your status from applied through offer.",
  },
  {
    icon: FaBuilding,
    title: "Post your own openings",
    description: "Employers can create a company profile and list a role in minutes.",
  },
];

export function FeatureHighlights() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-16">
      {FEATURES.map((feature) => (
        <Card key={feature.title}>
          <CardContent className="space-y-3">
            <feature.icon className="h-6 w-6 text-primary" />
            <Typography variant="h4">{feature.title}</Typography>
            <Typography variant="muted">{feature.description}</Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
