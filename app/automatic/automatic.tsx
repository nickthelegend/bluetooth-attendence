"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { ArrowLeft, Users, CheckCircle, Wifi } from "lucide-react-native"
import { router, useLocalSearchParams, Stack } from "expo-router"
import * as NearbyConnections from "expo-nearby-connections"
import { PERMISSIONS, RESULTS, checkMultiple, requestMultiple } from "react-native-permissions"
import { supabase } from "@/lib/supabase" // Assuming you have a central supabase client

// Declare __DEV__ if it's not already defined
declare const __DEV__: boolean

const SERVICE_ID = "com.staffattendance.nearby" // Unique ID for your app's nearby service

interface DiscoveredStudent {
  id: string // peerId from NearbyConnections
  name: string // Student's name (advertised or from payload)
  studentId?: string // Actual student ID from database (from payload)
  status: "discovered" | "connecting" | "connected" | "failed" | "present"
}

export default function AutomaticAttendanceScreen() {
  const { classId, subject, className } = useLocalSearchParams<{
    classId: string
    subject: string
    className: string
  }>()

  const [discoveredStudents, setDiscoveredStudents] = useState<DiscoveredStudent[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [myPeerId, setMyPeerId] = useState<string>("") // Teacher's device peerId
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [currentStaffName, setCurrentStaffName] = useState<string>("Teacher") // Staff's name

  const appendDebug = useCallback((message: string) => {
    console.log(`[NearbyAttendance] ${message}`)
    setDebugInfo((prev) => [message, ...prev.slice(0, 19)])
  }, [])

  // 1. Check and Request Permissions
  useEffect(() => {
    const initializePermissions = async () => {
      appendDebug("Checking permissions...")
      const permissions =
        Platform.OS === "ios"
          ? [PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL] // For advertising
          : [
              PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION, // Required for Wi-Fi/BT discovery
              PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
              PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
              PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
              PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
              PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES, // For Android 12+
            ]

      try {
        const statuses = await checkMultiple(permissions)
        appendDebug(`Initial permission statuses: ${JSON.stringify(statuses)}`)
        let allGranted = Object.values(statuses).every(
          (status) => status === RESULTS.GRANTED || status === RESULTS.UNAVAILABLE || status === RESULTS.LIMITED,
        )

        if (allGranted) {
          appendDebug("All necessary permissions already granted or unavailable.")
          setPermissionsGranted(true)
        } else {
          appendDebug("Requesting missing permissions...")
          const requestStatuses = await requestMultiple(permissions)
          appendDebug(`Requested permission statuses: ${JSON.stringify(requestStatuses)}`)
          allGranted = Object.values(requestStatuses).every(
            (status) => status === RESULTS.GRANTED || status === RESULTS.UNAVAILABLE || status === RESULTS.LIMITED,
          )
          if (allGranted) {
            appendDebug("Permissions granted after request.")
            setPermissionsGranted(true)
          } else {
            appendDebug("Not all permissions granted after request.")
            Alert.alert(
              "Permissions Required",
              "Bluetooth and Location (and Nearby Devices for Android 12+) permissions are needed for automatic attendance.",
            )
            setPermissionsGranted(false)
          }
        }
      } catch (error: any) {
        appendDebug(`Error checking/requesting permissions: ${error.message}`)
        Alert.alert("Permission Error", `Failed to check/request permissions: ${error.message}`)
        setPermissionsGranted(false)
      }
    }
    initializePermissions()
  }, [appendDebug])

  // Fetch staff name
  useEffect(() => {
    const fetchStaffName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: staff, error } = await supabase.from("staff").select("name").eq("user_id", user.id).single()
        if (staff && !error) {
          setCurrentStaffName(staff.name)
        }
      }
    }
    fetchStaffName()
  }, [])

  // 2. Setup NearbyConnections Listeners
  useEffect(() => {
    if (!permissionsGranted) {
      appendDebug("Permissions not granted, skipping NearbyConnections setup.")
      return
    }

    appendDebug("Setting up NearbyConnections listeners...")

    const onPeerFoundListener = NearbyConnections.onPeerFound((endpoint) => {
      appendDebug(`Peer found: ${endpoint.peerId}, Name: ${endpoint.name}, ServiceID: ${endpoint.serviceId}`)
      // Assuming student devices advertise with their name and studentId in the payload (or name itself)
      // For now, we'll use endpoint.name as the student's display name.
      // A more robust solution would involve a handshake or specific payload structure.
      setDiscoveredStudents((prev) => {
        if (prev.some((s) => s.id === endpoint.peerId)) return prev
        return [...prev, { id: endpoint.peerId, name: endpoint.name || "Unknown Student", status: "discovered" }]
      })
    })

    const onPeerLostListener = NearbyConnections.onPeerLost((endpoint) => {
      appendDebug(`Peer lost: ${endpoint.peerId}`)
      setDiscoveredStudents((prev) => prev.filter((s) => s.id !== endpoint.peerId))
    })

    // For automatic attendance, we might not need explicit connections if discovery is enough.
    // But if we want to confirm or exchange more data, connection is useful.
    // For now, let's keep it simple and focus on discovery.
    // We won't handle onInvitationReceived, onConnected, onDisconnected, onTextReceived yet.

    return () => {
      appendDebug("Cleaning up NearbyConnections listeners.")
      onPeerFoundListener?.remove()
      onPeerLostListener?.remove()
      // Clean up other listeners if they were added
    }
  }, [permissionsGranted, appendDebug])

  // 3. Start/Stop Scanning (Discovery for Teacher, Advertising for Students)
  // This screen is for the TEACHER, so it will DISCOVER students.
  // Student devices would need a separate app/screen to ADVERTISE themselves.
  const startDiscovery = async () => {
    if (!permissionsGranted) {
      Alert.alert("Permissions Required", "Cannot start discovery without permissions.")
      return
    }
    if (isScanning) {
      appendDebug("Already scanning.")
      return
    }

    appendDebug("Starting discovery...")
    setIsScanning(true)
    setDiscoveredStudents([]) // Clear previous list
    try {
      await NearbyConnections.startDiscovery(SERVICE_ID)
      appendDebug(`Discovery started for service ID: ${SERVICE_ID}`)
    } catch (error: any) {
      appendDebug(`Error starting discovery: ${error.message}`)
      Alert.alert("Discovery Error", `Failed to start discovery: ${error.message}`)
      setIsScanning(false)
    }
  }

  const stopDiscovery = async () => {
    if (!isScanning) return
    appendDebug("Stopping discovery...")
    try {
      await NearbyConnections.stopDiscovery()
      appendDebug("Discovery stopped.")
    } catch (error: any) {
      appendDebug(`Error stopping discovery: ${error.message}`)
      // Alert.alert("Discovery Error", `Failed to stop discovery: ${error.message}`);
    } finally {
      setIsScanning(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isScanning) {
        stopDiscovery()
      }
    }
  }, [isScanning])

  const handleMarkPresent = async (student: DiscoveredStudent) => {
    appendDebug(`Attempting to mark ${student.name} (PeerID: ${student.id}) as present.`)
    // Here, you would ideally get the actual student_id from the device's advertisement payload
    // For now, we'll simulate this. In a real app, the student device should advertise its student_id.
    // Let's assume student.name might contain a parsable ID or we prompt the teacher.
    // For this example, we'll just log it and update status.

    // Placeholder: In a real app, you'd get student.studentId from the payload
    // and then save to Supabase.
    // const studentDatabaseId = student.studentId || await promptForStudentId(student.name);
    // if (!studentDatabaseId) return;

    Alert.alert("Mark Present", `Mark ${student.name} as present for ${className}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Present",
        onPress: async () => {
          // Simulate saving to Supabase
          appendDebug(`Marking ${student.name} as present in DB (simulated). Class: ${classId}, Subject: ${subject}`)
          // const { error } = await supabase.from('attendance').insert({
          //     class_id: classId,
          //     student_id: studentDatabaseId, // This needs to be the actual DB ID
          //     subject: subject,
          //     date: new Date().toISOString().split("T")[0],
          //     status: "Present",
          //     hours_attended: 1 // Or based on class duration
          // });
          // if (error) {
          //     appendDebug(`Error marking present in DB: ${error.message}`);
          //     Alert.alert("Error", `Failed to mark present: ${error.message}`);
          // } else {
          //     appendDebug(`${student.name} marked present successfully.`);
          //     setDiscoveredStudents(prev => prev.map(s => s.id === student.id ? {...s, status: "present"} : s));
          // }
          setDiscoveredStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status: "present" } : s)))
        },
      },
    ])
  }

  const renderStudentItem = ({ item }: { item: DiscoveredStudent }) => (
    <View style={styles.studentItem}>
      <View style={styles.studentInfo}>
        <Wifi size={20} color={item.status === "present" ? "#4CAF50" : "#7C3AED"} style={styles.studentIcon} />
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentPeerId}> (Peer: ...{item.id.slice(-6)})</Text>
      </View>
      {item.status === "discovered" && (
        <TouchableOpacity style={styles.actionButton} onPress={() => handleMarkPresent(item)}>
          <CheckCircle size={20} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Mark Present</Text>
        </TouchableOpacity>
      )}
      {item.status === "present" && (
        <View style={styles.presentBadge}>
          <CheckCircle size={20} color="#FFFFFF" />
          <Text style={styles.presentBadgeText}>Present</Text>
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Auto Attendance: ${className || "Class"}` }} />
      <LinearGradient colors={["#8E54E9", "#4776E6"]} style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Automatic Attendance</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.controlsContainer}>
        <Text style={styles.infoText}>Class: {className || "N/A"}</Text>
        <Text style={styles.infoText}>Subject: {subject || "N/A"}</Text>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.stopButton]}
          onPress={isScanning ? stopDiscovery : startDiscovery}
          disabled={!permissionsGranted}
        >
          <Text style={styles.scanButtonText}>{isScanning ? "Stop Scanning" : "Start Scanning for Students"}</Text>
        </TouchableOpacity>
        {!permissionsGranted && (
          <Text style={styles.permissionWarning}>Permissions not granted. Scanning disabled.</Text>
        )}
      </View>

      {isScanning && !discoveredStudents.length && (
        <View style={styles.emptyListContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.emptyListText}>Scanning for nearby student devices...</Text>
          <Text style={styles.emptyListSubText}>Ensure student devices are advertising for attendance.</Text>
        </View>
      )}

      <FlatList
        data={discoveredStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id}
        style={styles.studentList}
        ListEmptyComponent={() =>
          !isScanning && discoveredStudents.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Users size={48} color="#cccccc" />
              <Text style={styles.emptyListText}>No students found nearby.</Text>
              <Text style={styles.emptyListSubText}>Tap "Start Scanning" to discover students.</Text>
            </View>
          ) : null
        }
      />

      {__DEV__ && (
        <ScrollView style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info (Nearby Connections):</Text>
          {debugInfo.map((msg, index) => (
            <Text key={index} style={styles.debugText}>
              {msg}
            </Text>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5", // Light background
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 12 : 12, // Adjust for status bar
    height: Platform.OS === "android" ? 56 + (StatusBar.currentHeight || 0) : 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  infoText: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 8,
  },
  scanButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionWarning: {
    color: "#D32F2F",
    textAlign: "center",
    marginTop: 8,
  },
  studentList: {
    flex: 1,
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  studentIcon: {
    marginRight: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  studentPeerId: {
    fontSize: 12,
    color: "#777777",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionButtonText: {
    color: "#4CAF50",
    marginLeft: 6,
    fontWeight: "500",
  },
  presentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  presentBadgeText: {
    color: "#FFFFFF",
    marginLeft: 6,
    fontWeight: "500",
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 18,
    color: "#777777",
    marginTop: 16,
    textAlign: "center",
  },
  emptyListSubText: {
    fontSize: 14,
    color: "#AAAAAA",
    marginTop: 8,
    textAlign: "center",
  },
  debugContainer: {
    maxHeight: 150, // Fixed height for debug scroll view
    margin: 16,
    padding: 12,
    backgroundColor: "#2C2C2E", // Darker background for debug
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A4A4A",
  },
  debugTitle: {
    color: "#FFCC00", // Yellow for title
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  debugText: {
    color: "#00FF00", // Green for debug text
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10, // Smaller font for debug
    marginBottom: 2,
  },
})
