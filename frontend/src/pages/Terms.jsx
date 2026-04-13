import { useTranslation } from "react-i18next";
import LegalLayout from "../components/LegalLayout";
import SEO from "../components/SEO";

export default function Terms() {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title={t("legal.terms.title")}
        description={t("legal.terms.subtitle")}
        path="/terms"
      />
      <LegalLayout
        title={t("legal.terms.title")}
        subtitle={t("legal.terms.subtitle")}
        lastUpdated={t("legal.lastUpdated", { date: "2026-04-13" })}
      >
        <div dangerouslySetInnerHTML={{ __html: t("legal.terms.body") }} />
      </LegalLayout>
    </>
  );
}
