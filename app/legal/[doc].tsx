import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Typography } from "@/components/ui/Typography";
import {
  LEGAL_DOCS,
  type LegalDocId,
} from "@/features/legal/documents";
import { fonts } from "@/theme";

export default function LegalDocumentScreen() {
  const { t } = useTranslation();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const id = (doc ?? "privacy") as LegalDocId;
  const document = LEGAL_DOCS[id] ?? LEGAL_DOCS.privacy;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t(document.titleKey)} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mb-4 text-xs text-muted"
        >
          {t("legal.updated", { date: document.updated })}
        </Text>
        <Typography variant="caption" className="mb-6">
          {t("legal.intro")}
        </Typography>
        {document.sections.map((section) => (
          <View key={section.heading} className="mb-5">
            <Text
              style={{ fontFamily: fonts.semibold }}
              className="mb-2 text-base text-primary"
            >
              {section.heading}
            </Text>
            <Text
              style={{ fontFamily: fonts.regular }}
              className="text-sm leading-5 text-muted"
            >
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
