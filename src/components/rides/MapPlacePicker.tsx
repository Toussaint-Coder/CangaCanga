import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { RideMap } from "@/components/map/RideMap";
import { MAP_STYLE_SATELLITE } from "@/components/map/mapbox";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { isMapboxConfigured } from "@/config/env";
import { forwardGeocode, reverseGeocode, type GeocodeResult } from "@/services/mapbox";
import { fonts, shadow, useThemeColors } from "@/theme";
import type { Coordinates, Place } from "@/types/models";

interface MapPlacePickerProps {
  visible: boolean;
  title: string;
  initial?: Coordinates | null;
  onConfirm: (place: Place) => void;
  onClose: () => void;
}

/**
 * Full-screen map picker with place search (NOT a nested Modal — create-ride
 * is already a modal route, and Android ignores nested Modals).
 */
export function MapPlacePicker({
  visible,
  title,
  initial,
  onConfirm,
  onClose,
}: MapPlacePickerProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [coord, setCoord] = useState<Coordinates | null>(initial ?? null);
  const [label, setLabel] = useState<string>(t("create.pickedOnMap"));
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Skip reverse-geocode when the pin came from a search pick. */
  const skipReverseRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setCoord(initial ?? null);
    setLabel(t("create.pickedOnMap"));
    setQuery("");
    setResults([]);
    skipReverseRef.current = false;
  }, [visible, initial, t]);

  useEffect(() => {
    if (!coord || !visible) return;
    if (skipReverseRef.current) {
      skipReverseRef.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      setResolving(true);
      try {
        if (isMapboxConfigured()) {
          const reversed = await reverseGeocode(coord);
          if (!cancelled && reversed) {
            setLabel(reversed);
            setQuery(reversed);
          }
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coord, visible]);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim() || !isMapboxConfigured()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await forwardGeocode(text, coord ?? initial ?? undefined);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelectResult = (r: GeocodeResult) => {
    skipReverseRef.current = true;
    setCoord({ latitude: r.latitude, longitude: r.longitude });
    setLabel(r.label);
    setQuery(r.label);
    setResults([]);
  };

  const handleMapPress = (next: Coordinates) => {
    setCoord(next);
    setResults([]);
  };

  if (!visible) return null;

  const confirm = () => {
    if (!coord) return;
    onConfirm({
      label: label || t("create.pickedOnMap"),
      latitude: coord.latitude,
      longitude: coord.longitude,
    });
    onClose();
  };

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 100, elevation: 100, backgroundColor: colors.background },
      ]}
    >
      <RideMap
        center={coord ?? initial ?? undefined}
        pickup={coord ?? undefined}
        fill
        rounded={false}
        zoom={14}
        showUserLocation={!coord}
        styleURL={MAP_STYLE_SATELLITE}
        onCoordinatePress={handleMapPress}
      />

      <View
        pointerEvents="box-none"
        style={{ paddingTop: insets.top + 8 }}
        className="absolute left-0 right-0 top-0 px-4"
      >
        <View
          style={[shadow.card, { backgroundColor: colors.card }]}
          className="overflow-hidden rounded-2xl"
        >
          <View className="flex-row items-center px-3 pt-3">
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-border"
            >
              <Icon name="close" size={18} color={colors.primary} />
            </Pressable>
            <View className="ml-3 flex-1">
              <Text
                style={{ fontFamily: fonts.semibold }}
                className="text-base text-primary"
              >
                {title}
              </Text>
              <Text
                style={{ fontFamily: fonts.regular }}
                className="text-xs text-muted"
                numberOfLines={1}
              >
                {coord
                  ? resolving
                    ? t("create.resolvingAddress")
                    : label
                  : t("create.tapMapHint")}
              </Text>
            </View>
            {resolving ? <ActivityIndicator size="small" /> : null}
          </View>

          <View className="px-3 pb-3 pt-2">
            <Input
              placeholder={t("place.searchPlaceholder")}
              value={query}
              onChangeText={handleSearchChange}
              leftIcon={<Icon name="search" size={18} color={colors.muted} />}
              rightElement={
                searching ? <ActivityIndicator size="small" /> : null
              }
            />
          </View>

          {results.length > 0 ? (
            <View className="border-t border-border">
              {results.map((r, index) => (
                <Pressable
                  key={r.id}
                  onPress={() => handleSelectResult(r)}
                  className={
                    "flex-row items-center px-4 py-3 " +
                    (index < results.length - 1 ? "border-b border-border" : "")
                  }
                >
                  <Icon name="place" size={16} color={colors.muted} />
                  <Text
                    style={{ fontFamily: fonts.regular }}
                    className="ml-3 flex-1 text-sm text-primary"
                    numberOfLines={2}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {!isMapboxConfigured() && query.length > 0 ? (
            <Text
              style={{ fontFamily: fonts.regular }}
              className="px-4 pb-3 text-xs text-muted"
            >
              {t("place.mapboxHint")}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        pointerEvents="box-none"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        className="absolute bottom-0 left-0 right-0 px-4"
      >
        <Button
          label={t("create.confirmLocation")}
          onPress={confirm}
          disabled={!coord}
        />
      </View>
    </View>
  );
}
