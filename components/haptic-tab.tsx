import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

export function HapticTab({
  children,
  onPress,
  onPressIn,
  style,
  ...rest
}: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...rest}
      style={style}
      onPress={onPress}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
    >
      {children}
    </PlatformPressable>
  );
}
