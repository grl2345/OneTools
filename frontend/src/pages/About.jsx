import { useTranslation } from "react-i18next";
import LegalLayout from "../components/LegalLayout";
import SEO from "../components/SEO";
import { schema } from "../components/SEO";

export default function About() {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title={t("legal.about.title")}
        description={t("legal.about.subtitle")}
        path="/about"
        structuredData={schema.website({ url: "https://onetools.dev" })}
      />
      <LegalLayout
        title={t("legal.about.title")}
        subtitle={t("legal.about.subtitle")}
      >
        <div dangerouslySetInnerHTML={{ __html: t("legal.about.body") }} />
      </LegalLayout>
    </>
  );
}
