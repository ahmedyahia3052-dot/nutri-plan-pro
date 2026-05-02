import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <div className="text-6xl font-bold text-primary mb-4">404</div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">{t("notFound.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("notFound.message")}</p>
      <Link href="/">
        <Button>{t("notFound.goHome")}</Button>
      </Link>
    </div>
  );
}
