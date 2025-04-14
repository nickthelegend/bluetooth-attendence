"use client"
import { TouchableOpacity, StyleSheet, View, Dimensions } from "react-native"
import { Tabs } from "expo-router"
import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Drawer } from "react-native-drawer-layout"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { LinearGradient } from "expo-linear-gradient"
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"

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

const { width } = Dimensions.get("window")

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Get user info
  supabase.auth.getUser().then(({ data }) => {
    if (data && data.user) {
      setUser(data.user)
    }
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  const handleSettings = () => {
    setIsDrawerOpen(false)
    // Navigate to settings (you can implement this later)
    // router.push("/settings")
  }

  const renderDrawerContent = () => {
    return (
      <ThemedView style={styles.drawerContainer}>
        <LinearGradient
          colors={["#4776E6", "#8E54E9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drawerHeader}
        >
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={40} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.userName}>{user?.email || "Staff Member"}</ThemedText>
          <ThemedText style={styles.userRole}>Administrator</ThemedText>
        </LinearGradient>

        <ThemedView style={styles.drawerContent}>
          <TouchableOpacity style={styles.drawerItem} onPress={handleSettings}>
            <Ionicons name="settings" size={22} color="#555" style={styles.drawerItemIcon} />
            <ThemedText style={styles.drawerItemText}>Settings</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color="#555" style={styles.drawerItemIcon} />
            <ThemedText style={styles.drawerItemText}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    )
  }

  return (
    <Drawer
      open={isDrawerOpen}
      onOpen={() => setIsDrawerOpen(true)}
      onClose={() => setIsDrawerOpen(false)}
      renderDrawerContent={renderDrawerContent}
      drawerType="front"
      drawerStyle={{ width: "70%" }}
    >
      <Tabs
        screenOptions={{
          headerShown: false, // Hide the header in tabs
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#8E54E9",
          tabBarInactiveTintColor: "#888888",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E0E0E0",
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarItemStyle: {
            height: 50,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabIconContainer]}>
                <MaterialIcons name="dashboard" size={focused ? 26 : 22} color={color} />
              </View>
            ),
            tabBarLabel: "Dashboard",
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: "Take Attendance",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabIconContainer]}>
                <FontAwesome5 name="user-check" size={focused ? 24 : 20} color={color} />
              </View>
            ),
            tabBarLabel: "Attendance",
          }}
        />
        <Tabs.Screen
          name="classes"
          options={{
            title: "Classes",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.activeTabIconContainer]}>
                <Ionicons name="people" size={focused ? 26 : 22} color={color} />
              </View>
            ),
            tabBarLabel: "Classes",
          }}
        />
      </Tabs>
    </Drawer>
  )
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  drawerHeader: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
    paddingBottom: 30,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userRole: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  drawerItemIcon: {
    marginRight: 15,
  },
  drawerItemText: {
    fontSize: 16,
    color: "#555",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    width: 60,
    borderRadius: 12,
  },
  activeTabIconContainer: {
    backgroundColor: "rgba(142, 84, 233, 0.1)",
  },
})
