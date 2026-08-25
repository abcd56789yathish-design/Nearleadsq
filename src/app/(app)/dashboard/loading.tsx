import { PixelLoader } from "@/components/ui/pixel-loader";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <PixelLoader label="Loading dashboard" />
    </div>
  );
}
