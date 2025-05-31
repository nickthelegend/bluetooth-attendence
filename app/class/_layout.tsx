// This file is needed for Stack navigation within the /class route group
import { Stack } from "expo-router"

export default function ClassLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header for all screens in this stack by default
      }}
    >
      {/* You can still define screens here if you need to override other options,
          but headerShown: false will apply unless overridden in the screen file itself. */}
      {/* <Stack.Screen name="new" /> */}
      {/* <Stack.Screen name="[id]" /> */}
    </Stack>
  )
}
