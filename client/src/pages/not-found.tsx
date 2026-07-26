import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <Logo variant="stacked" />
      <AlertCircle className="mt-8 h-8 w-8 text-primary" />
      <h1 className="mt-4 font-serif text-2xl">Page Not Found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link href="/">
        <Button className="mt-6" data-testid="button-back-home">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
