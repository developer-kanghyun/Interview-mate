import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <span className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      <Image src="/images/brand_logo_mark.png" alt="Interview Mate" fill sizes="64px" className="object-cover object-center" priority />
    </span>
  );
}
