import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import { Icon } from "@/components/ui/Icon";
import { fonts, useThemeColors } from "@/theme";
import { formatDeparture } from "@/utils/format";

interface DateTimeFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  /** `date` / `time` / `datetime`. Default `datetime`. */
  mode?: "datetime" | "date" | "time";
  className?: string;
}

function mergeDateKeepTime(current: Date, picked: Date): Date {
  const next = new Date(current);
  next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return next;
}

function mergeTimeKeepDate(current: Date, picked: Date): Date {
  const next = new Date(current);
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

export function DateTimeField({
  label,
  value,
  onChange,
  error,
  mode = "datetime",
  className,
}: DateTimeFieldProps) {
  const colors = useThemeColors();
  const [show, setShow] = useState(false);
  const [androidStep, setAndroidStep] = useState<"date" | "time">("date");

  const openPicker = () => {
    if (mode === "time") {
      setAndroidStep("time");
      setShow(true);
      return;
    }
    if (mode === "date") {
      setAndroidStep("date");
      setShow(true);
      return;
    }
    setAndroidStep("date");
    setShow(true);
  };

  const handleChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS === "android") {
      if (!selected) {
        setShow(false);
        return;
      }

      if (mode === "time") {
        onChange(mergeTimeKeepDate(value, selected));
        setShow(false);
        return;
      }

      if (mode === "date") {
        onChange(mergeDateKeepTime(value, selected));
        setShow(false);
        return;
      }

      if (androidStep === "date") {
        onChange(mergeDateKeepTime(value, selected));
        setAndroidStep("time");
        return;
      }

      onChange(mergeTimeKeepDate(value, selected));
      setShow(false);
      return;
    }

    if (selected) {
      if (mode === "time") onChange(mergeTimeKeepDate(value, selected));
      else if (mode === "date") onChange(mergeDateKeepTime(value, selected));
      else onChange(selected);
    }
  };

  const display =
    mode === "time"
      ? dayjs(value).format("HH:mm")
      : mode === "date"
        ? dayjs(value).format("DD MMM YYYY")
        : formatDeparture(value.toISOString());

  const iconName = mode === "time" ? "schedule" : "event";

  return (
    <View className={className ?? "w-full"}>
      {label ? (
        <Text
          style={{ fontFamily: fonts.medium }}
          className="mb-2 text-sm text-primary"
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={openPicker}
        className="flex-row items-center rounded-2xl border border-border bg-card px-4"
        style={{ minHeight: 52 }}
      >
        <Icon name={iconName} size={18} color={colors.muted} />
        <Text
          style={{ fontFamily: fonts.regular }}
          className="ml-3 flex-1 text-base text-primary"
        >
          {display}
        </Text>
      </Pressable>

      {show ? (
        <DateTimePicker
          value={value}
          mode={
            mode === "datetime"
              ? Platform.OS === "ios"
                ? "datetime"
                : androidStep
              : mode
          }
          is24Hour
          minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
          onChange={handleChange}
          display={Platform.OS === "ios" ? "spinner" : "default"}
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
