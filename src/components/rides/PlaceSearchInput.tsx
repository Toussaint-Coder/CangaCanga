import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/Icon";
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
  /** Opens the in-app map picker when set. */
  onPickOnMap?: () => void;
}

export function PlaceSearchInput({
  label,
  placeholder,
  value,
  proximity,
  error,
  onSelect,
  onPickOnMap,
}: PlaceSearchInputProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  const clearSearch = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    requestId.current += 1;
    setResults([]);
    setLoading(false);
    setOpen(false);
  };

  // Sync external value (map pick / form reset) and stop any spinner.
  useEffect(() => {
    if (!value?.label) return;
    setQuery(value.label);
    clearSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.label]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);

    if (!text.trim() || !isMapboxConfigured()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestId.current;
    timer.current = setTimeout(async () => {
      try {
        const res = await forwardGeocode(text, proximity);
        if (id !== requestId.current) return;
        setResults(res);
      } catch {
        if (id !== requestId.current) return;
        setResults([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 350);
  };

  const handlePick = (r: GeocodeResult) => {
    clearSearch();
    setQuery(r.label);
    onSelect({
      label: r.label,
      latitude: r.latitude,
      longitude: r.longitude,
    });
  };

  return (
    <View className="w-full">
      <Input
        label={label}
        placeholder={placeholder ?? t("place.searchPlaceholder")}
        value={query}
        onChangeText={handleChange}
        error={error}
        leftIcon={<Icon name="place" size={18} color={colors.muted} />}
        rightElement={loading ? <ActivityIndicator size="small" /> : null}
      />

      {onPickOnMap ? (
        <Pressable
          onPress={onPickOnMap}
          className="mt-2 flex-row items-center self-start rounded-full border border-border bg-card px-3 py-2"
        >
          <Icon name="map" size={16} color={colors.accent} />
          <Text
            style={{ fontFamily: fonts.medium }}
            className="ml-1.5 text-sm text-accent"
          >
            {t("create.pickOnMap")}
          </Text>
        </Pressable>
      ) : null}

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
              <Icon name="place" size={16} color={colors.muted} />
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
