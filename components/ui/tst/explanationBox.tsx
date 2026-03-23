import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import ReactMarkdown from "react-markdown";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import remarkGfm from "remark-gfm";

type Props = {
  isExpanded: boolean;
  loadingExplanation: string | null;
  itemId: string;
  explanations: Record<string, string>;
};

export default function ExplanationBox({
  isExpanded,
  loadingExplanation,
  itemId,
  explanations,
}: Props) {
  if (!isExpanded) return null;

  const content = explanations[itemId];

  // ⭐ Helper für Verschachtelung
  const renderListItem = (children: any, level = 0) => {
    const bullet = level === 0 ? "•" : level === 1 ? "◦" : "▪";

    return (
      <View style={[styles.mdLiRow, { paddingLeft: level * 12 }]}>
        <ThemedText style={styles.mdBullet}>{bullet}</ThemedText>
        <ThemedText style={styles.mdLiText}>{children}</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.explanationBox}>
      {loadingExplanation === itemId ? (
        <ActivityIndicator />
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h3: ({ children }) => (
              <ThemedText style={styles.mdH3}>{children}</ThemedText>
            ),
            h4: ({ children }) => (
              <ThemedText style={styles.mdH4}>{children}</ThemedText>
            ),
            p: ({ children }) => (
              <ThemedText style={styles.mdP}>{children}</ThemedText>
            ),

            ul: ({ children }) => (
              <View style={styles.mdUl}>{children}</View>
            ),

            li: ({ children, ...props }: any) => {
              // ReactMarkdown gibt depth leider nicht direkt → Workaround:
              const level = props.node?.position?.start?.column > 1 ? 1 : 0;

              const text = Array.isArray(children)
                ? children.join("").trim()
                : String(children).trim();

              if (!text) return null;

              return renderListItem(children, level);
            },

            strong: ({ children }) => (
              <ThemedText style={styles.mdStrong}>
                {children}
              </ThemedText>
            ),
          }}
        >
          {content || ""}
        </ReactMarkdown>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  explanationBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  mdH3: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    color: "#1a1a1a",
  },

  mdH4: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,
    color: "#333",
  },

  mdP: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    color: "#444",
  },

  mdUl: {
    marginTop: 6,
    marginBottom: 14,
  },

  mdLiRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  mdBullet: {
    marginRight: 8,
    fontSize: 16,
    lineHeight: 22,
    color: "#444",
  },

  mdLiText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },

  mdStrong: {
    fontWeight: "700",
    color: "#000",
  },
});