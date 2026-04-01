import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import * as Speech from "expo-speech";
import React, { useState } from "react";
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  if (!isExpanded) return null;

  const content = explanations[itemId];

  // 🧹 Markdown bereinigen
  const cleanText = (text: string) => {
    return text
      .replace(/[#*_>`~-]/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/AI/g, "A I")
      .replace(/TTS/g, "Text to Speech")
      // 🔤 Abkürzungen (Buchstabieren)
      .replace(/\bAI\b/g, "A I")
      .replace(/\bAPI\b/g, "A P I")
      .replace(/\bSDK\b/g, "S D K")
      .replace(/\bUI\b/g, "U I")
      .replace(/\bUX\b/g, "U X")
      .replace(/\bCPU\b/g, "C P U")
      .replace(/\bGPU\b/g, "G P U")
      .replace(/\bRAM\b/g, "R A M")
      .replace(/\bHTML\b/g, "H T M L")
      .replace(/\bCSS\b/g, "C S S")
      .replace(/\bJS\b/g, "J S")
      .replace(/\bJSON\b/g, "jay son")
      .replace(/\bXML\b/g, "X M L")

      // 🌐 Tech Begriffe
      .replace(/\bREST\b/g, "rest")
      .replace(/\bGraphQL\b/g, "graph Q L")
      .replace(/\bNode\.js\b/g, "Node J S")
      .replace(/\bReact\b/g, "React")
      .replace(/\bTypeScript\b/g, "Type Script")

      // 📱 Plattformen
      .replace(/\biOS\b/g, "i O S")
      .replace(/\bAndroid\b/g, "Android")
      .replace(/\bmacOS\b/g, "mac O S")

      // 🔢 Zahlen & Einheiten (optional simpel)
      .replace(/\b(\d+)GB\b/g, "$1 gigabytes")
      .replace(/\b(\d+)MB\b/g, "$1 megabytes")
      .replace(/\b(\d+)KB\b/g, "$1 kilobytes")

      // 🔗 Sonderzeichen & Operatoren
      .replace(/\//g, " slash ")
      .replace(/&/g, " and ")
      .replace(/@/g, " at ")
      .replace(/%/g, " percent ")
      .replace(/\+/g, " plus ")
      .replace(/=/g, " equals ")

      // 💻 Code-Zeichen entfernen
      .replace(/[<>]/g, "")

      // 🔁 Mehrfache Leerzeichen fixen
      .replace(/\s+/g, " ")
      .trim();
  };

  // ▶️ Start / Resume
  const handleSpeak = () => {
    if (!content) return;

    const cleaned = cleanText(content);

    Speech.speak(cleaned, {
      language: "en-US",
      rate: 0.85,
      pitch: 1.0,
      onStart: () => {
        setIsSpeaking(true);
        setIsPaused(false);
      },
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
    });
  };

  // ⏸ Pause (Workaround: Stop + Status merken)
  const handlePause = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(true);
  };

  // ⏹ Stop
  const handleStop = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

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
      {/* 🎛️ Controls */}
      <View style={styles.controls}>
        {!isSpeaking && (
          <ThemedText style={styles.controlBtn} onPress={handleSpeak}>
            ▶️ {isPaused ? "Continue" : "Text to speech"}
          </ThemedText>
        )}

        {isSpeaking && (
          <ThemedText style={styles.controlBtn} onPress={handlePause}>
            ⏸ Pause
          </ThemedText>
        )}

        {(isSpeaking || isPaused) && (
          <ThemedText style={styles.controlBtn} onPress={handleStop}>
            ⏹ Stop
          </ThemedText>
        )}
      </View>

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
              const level =
                props.node?.position?.start?.column > 1 ? 1 : 0;

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

  controls: {
    flexDirection: "row",
    justifyContent: "flex-end", 
    gap: 12,
    marginBottom: 12,
  },

  controlBtn: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
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