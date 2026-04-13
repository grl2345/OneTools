import { useTranslation } from "react-i18next";
import LegalLayout from "../components/LegalLayout";
import SEO from "../components/SEO";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title={t("legal.privacy.title")}
        description={t("legal.privacy.subtitle")}
        path="/privacy"
      />
      <LegalLayout
        title={t("legal.privacy.title")}
        subtitle={t("legal.privacy.subtitle")}
        lastUpdated={t("legal.lastUpdated", { date: "2026-04-13" })}
      >
        <div dangerouslySetInnerHTML={{ __html: t("legal.privacy.body") }} />
      </LegalLayout>
    </>
  );
}
