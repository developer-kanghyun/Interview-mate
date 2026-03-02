import Link from "next/link";
import { BrandLogo } from "@/shared/ui/BrandLogo";

type BrandIdentityLinkProps = {
  href?: string;
  prefetch?: boolean;
  className?: string;
  logoClassName?: string;
  textClassName?: string;
};

export function BrandIdentityLink({
  href = "/",
  prefetch = false,
  className = "",
  logoClassName = "h-[68px] w-[68px]",
  textClassName = "text-[22px] leading-none font-black tracking-tight text-im-text-main"
}: BrandIdentityLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      aria-label="Interview Mate 랜딩 페이지로 이동"
      className={`inline-flex items-center gap-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-im-primary/40 ${className}`}
    >
      <BrandLogo className={logoClassName} />
      <span className={textClassName}>Interview Mate</span>
    </Link>
  );
}
