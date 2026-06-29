import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

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
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="password"
        style={[
          styles.input,
          {
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />

      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => setShowPassword((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Feather
          name={showPassword ? "eye-off" : "eye"}
          size={20}
          color="#cccccc"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  input: {
    flex: 1,
    padding: 10,
    paddingRight: 40,
  },
  iconContainer: {
    position: "absolute",
    right: 10,
    padding: 5,
  },
});
