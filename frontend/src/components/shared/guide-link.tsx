import Link from "next/link";
import { useTranslations } from "next-intl";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
export function GuideLink() {
  const t = useTranslations("Guide");
  return (
    <Button asChild variant="ghost" className="min-h-11">
      <Link href="/guide">
        <CircleHelp />
        {t("help")}
      </Link>
    </Button>
  );
}
