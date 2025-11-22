import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-xl font-semibold text-foreground">
            Account Settings
          </h1>
        </div>
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}

