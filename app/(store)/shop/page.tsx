import { Suspense } from "react";
import Shop from "@/pages/Shop";

export default function ShopPage() {
  return (
    <Suspense>
      <Shop />
    </Suspense>
  );
}
