import Link from "next/link";
import { Github, Mail, Linkedin } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              Made with ❤️ for Book with UVA by <span className="font-semibold text-foreground">Shivam Raj Gupta</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/shivamGupta-25"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </Link>

            <Link
              href="mailto:guptashivam25oct@gmail.com"
              aria-label="Email"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-5 w-5" />
            </Link>

            <Link
              href="https://www.linkedin.com/in/shivam-raj-gupta/"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


