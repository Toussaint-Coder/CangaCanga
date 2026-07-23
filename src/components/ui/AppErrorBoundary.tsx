import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { fonts } from "@/theme";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Catches render crashes so users never see a blank white screen.
 * Store reviewers treat unexplained blank screens as instability.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.warn("[AppErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            backgroundColor: "#F8F9FA",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 18,
              color: "#111",
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: "#666",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Please restart the app. If this keeps happening, contact support.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={() => this.setState({ hasError: false })}
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: "#2563EB",
              minHeight: 48,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                color: "#fff",
                fontSize: 14,
              }}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
