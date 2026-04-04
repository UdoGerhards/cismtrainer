import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
};

export default function PasswordInput({
  value,
  onChangeText,
  style,
  ...props
}: Props) {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        placeholder="Passwort"
        placeholderTextColor={colors.border}
        style={[
          styles.input,
          {
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />

      <Ionicons
        name={showPassword ? "eye-off" : "eye"}
        size={22}
        color={colors.border}
        style={styles.icon}
        onPress={() => setShowPassword((prev) => !prev)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
  },

  input: {
    padding: 10,
    paddingRight: 40,
  },

  icon: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -11 }],
  },
});
