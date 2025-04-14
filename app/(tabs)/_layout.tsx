import { Tabs } from "expo-router"
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native"
import { Drawer } from "expo-router/drawer"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { useState } from "react"
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { HapticTab } from "@/components/HapticTab"
import { IconSymbol } from "@/components/ui/IconSymbol"
import TabBarBackground from "@/components/ui/TabBarBackground"
import { Colors } from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
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

function CustomDrawerContent({ navigation }) {
  const router = useRouter()
  const [user, setUser] = useState(null)

  // Get user info
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user)
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <ThemedView style={styles.drawerContainer}>
      <ThemedView style={styles.drawerHeader}>
        <IconSymbol size={60} name="person.crop.circle" color="#4c669f" />
        <ThemedText style={styles.userName}>{user?.email || 'Staff Member'}</ThemedText>
        <ThemedText style={styles.userRole}>Administrator</ThemedText>
      </ThemedView>

      <ThemedView style={styles.drawerContent}>
        <TouchableOpacity 
          style={styles.drawerItem} 
          onPress={() => navigation.navigate('index')}
        >
          <IconSymbol size={24} name="chart.bar.fill" color="#4c669f" />
          <ThemedText style={styles.drawerItemText}>Dashboard</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem} 
          onPress={() => navigation.navigate('attendance')}
        >
          <IconSymbol size={24} name="person.badge.clock.fill" color="#4c669f" />
          <ThemedText style={styles.drawerItemText}>Take Attendance</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem} 
          onPress={() => navigation.navigate('classes')}
        >
          <IconSymbol size={24} name="person.3.fill" color="#4c669f" />
          <ThemedText style={styles.drawerItemText}>Classes</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem} 
          onPress={() => {}}
        >
          <IconSymbol size={24} name="gear" color="#4c669f" />
          <ThemedText style={styles.drawerItemText}>Settings</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <IconSymbol size={24} name="arrow.right.square" color="#fff" />
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme()
  
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].tint,
        },
        headerTintColor: '#fff',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Dashboard",
          drawerLabel: "Dashboard",
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <IconSymbol size={24} name="bell.fill" color="#fff" />
            </TouchableOpacity>
          ),
          drawerIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
        }}
      />
      <Drawer.Screen
        name="attendance"
        options={{
          title: "Take Attendance",
          drawerLabel: "Take Attendance",
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <IconSymbol size={24} name="bell.fill" color="#fff" />
            </TouchableOpacity>
          ),
          drawerIcon: ({ color }) => <IconSymbol size={24} name="person.badge.clock.fill" color={color} />,
        }}
      />
      <Drawer.Screen
        name="classes"
        options={{
          title: "Classes",
          drawerLabel: "Classes",
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <IconSymbol size={24} name="bell.fill" color="#fff" />
            </TouchableOpacity>
          ),
          drawerIcon: ({ color }) => <IconSymbol size={24} name="person.3.fill" color={color} />,
        }}
      />
    </Drawer>
  )
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#4c669f',
    margin: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
})
