import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react-native";

import { Input } from "@/components/ui/Input";
import { isMapboxConfigured } from "@/config/env";
import { forwardGeocode, type GeocodeResult } from "@/services/mapbox";
import { fonts, useThemeColors } from "@/theme";
import type { Coordinates, Place } from "@/types/models";

interface PlaceSearchInputProps {
  label?: string;
  placeholder?: string;
  value?: Place | null;
  proximity?: Coordinates;
  error?: string;
  onSelect: (place: Place) => void;
}

export function PlaceSearchInput({
  label,
  placeholder,
  value,
  proximity,
  error,
  onSelect,
}: PlaceSearchInputProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value?.label) setQuery(value.label);
  }, [value?.label]);

  const handleChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (!text.trim() || !isMapboxConfigured()) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await forwardGeocode(text, proximity);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handlePick = (r: GeocodeResult) => {
    onSelect({
      label: r.label,
      latitude: r.latitude,
      longitude: r.longitude,
    });
    setQuery(r.label);
    setResults([]);
    setOpen(false);
  };

  return (
    <View className="w-full">
      <Input
        label={label}
        placeholder={placeholder ?? t("place.searchPlaceholder")}
        value={query}
        onChangeText={handleChange}
        error={error}
        leftIcon={<MapPin size={18} color={colors.muted} />}
        rightElement={loading ? <ActivityIndicator size="small" /> : null}
      />

      {open && results.length > 0 ? (
        <View className="mt-1.5 overflow-hidden rounded-2xl border border-border bg-card">
          {results.map((r, index) => (
            <Pressable
              key={r.id}
              onPress={() => handlePick(r)}
              className={
                "flex-row items-center px-4 py-3 " +
                (index < results.length - 1 ? "border-b border-border" : "")
              }
            >
              <MapPin size={16} color={colors.muted} />
              <Text
                style={{ fontFamily: fonts.regular }}
                className="ml-3 flex-1 text-sm text-primary"
                numberOfLines={1}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {open && !isMapboxConfigured() && query.length > 0 ? (
        <Text
          style={{ fontFamily: fonts.regular }}
          className="mt-1.5 text-xs text-muted"
        >
          {t("place.mapboxHint")}
        </Text>
      ) : null}
    </View>
  );
}
