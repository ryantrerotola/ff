import { notFound } from "next/navigation";
import { getStagedExtractionById } from "@/services/staged.service";
import { ReviewDetail } from "@/components/admin/ReviewDetail";

export const dynamic = "force-dynamic";

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({
  params,
}: ReviewDetailPageProps) {
  const { id } = await params;

  const extraction = await getStagedExtractionById(id);

  if (!extraction) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ReviewDetail extraction={extraction} />
    </div>
  );
}
