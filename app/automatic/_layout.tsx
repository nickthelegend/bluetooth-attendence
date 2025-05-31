import { Stack } from "expo-router"

export default function AutomaticLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="automatic"
        options={{
          title: "Automatic Attendance",
          headerShown: true, // You can control this per screen
          headerStyle: { backgroundColor: "#8E54E9" },
          headerTintColor: "#fff",
        }}
      />
    </Stack>
  )
}
