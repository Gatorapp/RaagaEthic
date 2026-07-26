import Link from "next/link";
import Logo from "./Logo";
import { CATEGORIES } from "@shared/schema";
import { Heart, Leaf, Gem, User } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Rooted in Tradition. Designed for You. A celebration of heritage, artistry and timeless elegance.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium tracking-wide">Shop</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link href={`/shop?category=${encodeURIComponent(cat)}`} className="hover:text-primary">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium tracking-wide">Brand Story</h3>
            <p className="text-sm text-muted-foreground">
              Inspired by traditional Indian crafts and contemporary silhouettes, we create outfits that make every
              woman feel confident, graceful and truly her own.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium tracking-wide">Store</h3>
            <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary" data-testid="link-admin">
              Admin login
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-8 text-center sm:grid-cols-4">
          {[
            { icon: Heart, label: "Handcrafted with Love" },
            { icon: Leaf, label: "Rooted in Heritage" },
            { icon: Gem, label: "Timeless Elegance" },
            { icon: User, label: "Made for Every Woman" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs tracking-wide text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Raaga Ethnic Couture. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
