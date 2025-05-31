import { Stack } from "expo-router"

export default function AutomaticLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="automatic"
        options={{
          headerShown: false, // Remove this header to avoid duplication
        }}
      />
    </Stack>
  )
}
