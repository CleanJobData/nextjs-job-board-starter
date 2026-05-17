import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Typography variant="h1" className="mb-4">404</Typography>
      <Typography variant="h3" className="mb-6">Page Not Found</Typography>
      <Typography className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved. 
        Check the URL or return to the homepage to continue your job search.
      </Typography>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
