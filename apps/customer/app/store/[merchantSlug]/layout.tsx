import { CartProvider } from "../../../components/cart-context";
import { StoreMerchantProvider } from "../../../components/merchant-context";
import { StickyCartBar } from "../../../components/sticky-cart-bar";
import { StoreMain } from "../../../components/store-main";
import { AppShell } from "../../../components/ui/app-shell";
import { Header } from "../../../components/ui/header";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ merchantSlug: string }>;
}) {
  const { merchantSlug } = await params;

  return (
    <StoreMerchantProvider merchantSlug={merchantSlug}>
      <CartProvider merchantSlug={merchantSlug}>
        <AppShell>
          <Header />
          <StoreMain>{children}</StoreMain>
          <StickyCartBar />
        </AppShell>
      </CartProvider>
    </StoreMerchantProvider>
  );
}
