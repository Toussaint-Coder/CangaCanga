import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarClock } from "lucide-react-native";

import { fonts, useThemeColors } from "@/theme";
import { formatDeparture } from "@/utils/format";

interface DateTimeFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DateTimeField({
  label,
  value,
  onChange,
  error,
}: DateTimeFieldProps) {
  const colors = useThemeColors();
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");

  const openAndroid = () => {
    setMode("date");
    setShow(true);
  };

  const handleChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS === "android") {
      if (!selected) {
        setShow(false);
        return;
      }
      if (mode === "date") {
        // Keep the previous time, update the date, then ask for time.
        const merged = new Date(value);
        merged.setFullYear(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
        );
        onChange(merged);
        setMode("time");
        return;
      }
      const merged = new Date(value);
      merged.setHours(selected.getHours(), selected.getMinutes());
      onChange(merged);
      setShow(false);
    } else if (selected) {
      onChange(selected);
    }
  };

  return (
    <View className="w-full">
      {label ? (
        <Text
          style={{ fontFamily: fonts.medium }}
          className="mb-2 text-sm text-primary"
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => (Platform.OS === "android" ? openAndroid() : setShow(true))}
        className="flex-row items-center rounded-2xl border border-border bg-card px-4"
        style={{ minHeight: 52 }}
      >
        <CalendarClock size={18} color={colors.muted} />
        <Text
          style={{ fontFamily: fonts.regular }}
          className="ml-3 flex-1 text-base text-primary"
        >
          {formatDeparture(value.toISOString())}
        </Text>
      </Pressable>

      {show ? (
        <DateTimePicker
          value={value}
          mode={Platform.OS === "ios" ? "datetime" : mode}
          minimumDate={new Date()}
          onChange={handleChange}
          display={Platform.OS === "ios" ? "inline" : "default"}
        />
      ) : null}

      {error ? (
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-1.5 text-xs text-danger"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
