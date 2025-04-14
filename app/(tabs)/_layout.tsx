"use client"
import { TouchableOpacity } from "react-native"
import { Tabs } from "expo-router"
import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { IconSymbol } from "@/components/ui/IconSymbol"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"

// Initialize Supabase client
const supabaseUrl = 'https://oquvqaiisiilhbvoopoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdXZxYWlpc2lpbGhidm9vcG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjcwNDksImV4cCI6MjA2MDE0MzA0OX0.XZT2SaLizGo8LWuFv3zRjHwuF-dzsSzCrKFNKuYe8Xs'


const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#8E54E9",
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E0E0E0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#8E54E9",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 15 }} onPress={handleLogout}>
            <IconSymbol size={24} name="rectangle.portrait.and.arrow.right" color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => <IconSymbol size={size} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Take Attendance",
          tabBarLabel: "Attendance",
          tabBarIcon: ({ color, size }) => <IconSymbol size={size} name="person.badge.clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "Classes",
          tabBarLabel: "Classes",
          tabBarIcon: ({ color, size }) => <IconSymbol size={size} name="person.3.fill" color={color} />,
        }}
      />
    </Tabs>
  )
}
