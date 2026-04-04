import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2025 ReelPulse. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
