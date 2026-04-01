import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  TextInput,
  View
} from "react-native";

interface OtpInputProps {
  onComplete: (otp: string) => void;
}

export interface OtpInputRef {
  reset: () => void;
  focus: () => void;
}

const OTP_LENGTH = 6;

const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  ({ onComplete }, ref) => {
    const [values, setValues] = useState<string[]>(
      Array(OTP_LENGTH).fill("")
    );
    const [activeIndex, setActiveIndex] = useState(0);

    const inputs = useRef<(TextInput | null)[]>([]);
    const completedRef = useRef(false);

    /*
    ==============================================
    INIT FOCUS
    ==============================================
    */
    useEffect(() => {
      inputs.current[0]?.focus();
    }, []);

    /*
    ==============================================
    EXPOSED METHODS
    ==============================================
    */
    useImperativeHandle(ref, () => ({
      reset: () => {
        const empty = Array(OTP_LENGTH).fill("");
        setValues(empty);
        setActiveIndex(0);
        completedRef.current = false;

        setTimeout(() => {
          inputs.current[0]?.focus();
        }, 50);
      },
      focus: () => {
        inputs.current[0]?.focus();
      },
    }));

    /*
    ==============================================
    COMPLETE CHECK
    ==============================================
    */
    const checkComplete = (vals: string[]) => {
      if (vals.every((v) => v !== "")) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete(vals.join(""));
        }
      } else {
        completedRef.current = false;
      }
    };

    /*
    ==============================================
    CHANGE
    ==============================================
    */
    const handleChange = (text: string, index: number) => {
      // 🔥 PASTE SUPPORT
      if (text.length > 1) {
        const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");

        const newValues = [...values];

        digits.forEach((digit, i) => {
          if (index + i < OTP_LENGTH) {
            newValues[index + i] = digit;
          }
        });

        setValues(newValues);

        const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
        inputs.current[nextIndex]?.focus();

        checkComplete(newValues);
        return;
      }

      // 🔢 Einzelne Zahl
      if (!/^\d?$/.test(text)) return;

      const newValues = [...values];
      newValues[index] = text;
      setValues(newValues);

      if (text && index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }

      checkComplete(newValues);
    };

    /*
    ==============================================
    BACKSPACE
    ==============================================
    */
    const handleKeyPress = (key: string, index: number) => {
      if (key !== "Backspace") return;

      const newValues = [...values];

      if (values[index]) {
        newValues[index] = "";
        setValues(newValues);
        completedRef.current = false;
      } else if (index > 0) {
        inputs.current[index - 1]?.focus();
        newValues[index - 1] = "";
        setValues(newValues);
        completedRef.current = false;
      }
    };

    return (
      <View style={styles.container}>
        {values.map((value, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            onFocus={() => setActiveIndex(index)}

            keyboardType="number-pad"
            maxLength={1}

            // 🔥 Autofill Support
            textContentType="oneTimeCode"
            autoComplete="sms-otp"

            // 🔥 wichtig für Web + Mobile
            inputMode="numeric"

            style={[
              styles.input,
              activeIndex === index && styles.active,
              index !== OTP_LENGTH - 1 && styles.spacing,
            ]}
          />
        ))}
      </View>
    );
  }
);

export default OtpInput;

/*
==============================================
STYLES
==============================================
*/

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
  },

  input: {
    width: 50,
    height: 60,

    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,

    backgroundColor: "#f5f5f5",

    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
  },

  active: {
    borderColor: "#000",
    borderWidth: 2,
    backgroundColor: "#fff",
  },

  spacing: {
    marginRight: 12,
  },
});