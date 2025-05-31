"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  View,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { ThemedText } from "@/components/ThemedText"
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { createClient, type User } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")

// Supabase client
const supabaseUrl = "https://oquvqaiisiilhbvoopoi.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdXZxYWlpc2lpbGhidm9vcG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjcwNDksImV4cCI6MjA2MDE0MzA0OX0.XZT2SaLizGo8LWuFv3zRjHwuF-dzsSzCrKFNKuYe8Xs"
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

interface ClassListData {
  id: string
  name: string // e.g., "Computer Science 1-A"
  teacher: string
  students: number
  subject: string // Subject taught by this staff member
  programName: string
  year: number
  section: string
  room_number?: string
  // attendanceRate and lastAttendance are complex, omitting for now
}

export default function ClassesScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [fetchedClasses, setFetchedClasses] = useState<ClassListData[]>([])

  // isLoading will be true during initial user/staff fetch and subsequent class fetch
  const [isLoading, setIsLoading] = useState(true)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [staffId, setStaffId] = useState<string | null>(null)

  // Effect 1: Fetch current user and their staff_id
  useEffect(() => {
    const fetchUserAndStaffDetails = async () => {
      setIsLoading(true) // Start loading
      setFetchedClasses([]) // Clear previous classes during re-fetch or initial load

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.warn("User fetch error or no user:", userError?.message || "No user session")
        setCurrentUser(null)
        setStaffId(null)
        setIsLoading(false) // Stop loading if no user
        return
      }
      setCurrentUser(user) // Set current user

      // User is available, now fetch their staff ID
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (staffError) {
        console.error("Error fetching staff ID:", staffError.message)
        setStaffId(null)
        setIsLoading(false) // Stop loading if staff fetch fails
      } else if (staffData) {
        setStaffId(staffData.id)
        // setIsLoading(false) will be handled by the class fetching effect
      } else {
        console.warn("No staff record for current user:", user.id)
        setStaffId(null)
        setIsLoading(false) // Stop loading if no staff record
      }
    }

    fetchUserAndStaffDetails()
  }, []) // Runs once on component mount

  // Effect 2: Fetch classes when staffId is available and changes
  useEffect(() => {
    // If staffId is null, it means either user is not logged in,
    // no staff record, or initial fetch is still in progress.
    // The previous effect handles setting isLoading to false in those cases.
    if (!staffId) {
      // If staffId becomes null after being set (e.g. user changes, error), clear classes.
      // The isLoading state should have been handled by the first effect if it's an initial load without staffId.
      if (fetchedClasses.length > 0) setFetchedClasses([])
      // If isLoading is true here, it means the first effect is still running or failed to set staffId.
      // We let the first effect control isLoading until staffId is determined.
      // If staffId is definitively null and first effect is done, isLoading should be false.
      return
    }

    const fetchClassesForStaff = async () => {
      setIsLoading(true) // Indicate that we are now fetching classes

      const { data: classStaffEntries, error: classStaffError } = await supabase
        .from("class_staff")
        .select("class_id, subject, staff:staff_id (name)")
        .eq("staff_id", staffId)

      if (classStaffError) {
        console.error("Error fetching class_staff entries:", classStaffError.message)
        setFetchedClasses([])
        setIsLoading(false)
        return
      }

      if (!classStaffEntries || classStaffEntries.length === 0) {
        setFetchedClasses([])
        setIsLoading(false)
        return
      }

      const classDetailsPromises = classStaffEntries.map(async (entry) => {
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select(
            `
            id,
            year,
            section,
            room_number,
            program:programs (name)
          `,
          )
          .eq("id", entry.class_id)
          .single()

        if (classError || !classData) {
          console.error(`Error fetching details for class ${entry.class_id}:`, classError?.message)
          return null
        }

        const { count: studentCount, error: studentCountError } = await supabase
          .from("class_students")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classData.id)

        const programName = (classData.program as any)?.name || "N/A"
        const teacherName = (entry.staff as any)?.name || "N/A"

        return {
          id: classData.id,
          name: `${programName} ${classData.year}-${classData.section}`,
          teacher: teacherName,
          students: studentCountError ? 0 : studentCount || 0,
          subject: entry.subject,
          programName: programName,
          year: classData.year,
          section: classData.section,
          room_number: classData.room_number,
        }
      })

      const resolvedClassDetails = (await Promise.all(classDetailsPromises)).filter(
        (c) => c !== null,
      ) as ClassListData[]

      setFetchedClasses(resolvedClassDetails)
      setIsLoading(false) // Finished fetching classes
    }

    fetchClassesForStaff()
  }, [staffId]) // Only re-run this effect if staffId changes

  const filteredClasses = searchQuery
    ? fetchedClasses.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subject.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : fetchedClasses

  const getAttendanceColor = (rate) => {
    // This is a placeholder as rate is not fetched
    if (rate >= 90) return ["#4CAF50", "#81C784"]
    if (rate >= 75) return ["#FFC107", "#FFD54F"]
    return ["#F44336", "#E57373"]
  }

  const toggleDrawer = () => {
    global.toggleDrawer && global.toggleDrawer()
  }

  const handleAddClass = () => {
    router.push("/class/new")
  }

  const handleEditClass = (classId: string) => {
    router.push(`/class/${classId}`)
  }

  const totalStudents = fetchedClasses.reduce((sum, c) => sum + c.students, 0)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8E54E9" />
      <LinearGradient colors={["#8E54E9", "#4776E6"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <ThemedText style={styles.headerTitle}>Classes</ThemedText>
            <ThemedText style={styles.headerSubtitle}>View and manage classes</ThemedText>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <MaterialIcons name="search" size={20} color="#8E54E9" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes, teachers or subjects..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="cancel" size={20} color="#8E54E9" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(142, 84, 233, 0.1)" }]}>
              <Ionicons name="school" size={24} color="#8E54E9" />
            </View>
            <ThemedText style={styles.statNumber}>{isLoading ? "..." : fetchedClasses.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Classes</ThemedText>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(76, 175, 80, 0.1)" }]}>
              <Ionicons name="people" size={24} color="#4CAF50" />
            </View>
            <ThemedText style={styles.statNumber}>{isLoading ? "..." : totalStudents}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Students</ThemedText>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(255, 193, 7, 0.1)" }]}>
              <MaterialIcons name="bar-chart" size={24} color="#FFC107" />
            </View>
            <ThemedText style={styles.statNumber}>N/A</ThemedText>
            {/* Avg. Attendance - N/A for now */}
            <ThemedText style={styles.statLabel}>Avg. Attendance</ThemedText>
          </View>
        </View>

        <View style={styles.classesContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>My Classes</ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={handleAddClass}>
              <LinearGradient
                colors={["#4776E6", "#8E54E9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <MaterialIcons name="add" size={16} color="#fff" />
                <ThemedText style={styles.addButtonText}>Add Class</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#8E54E9" style={{ marginTop: 30 }} />
          ) : filteredClasses.length > 0 ? (
            filteredClasses.map((classItem) => {
              // Attendance rate is not available, using a default color
              const attendanceColors = getAttendanceColor(0)

              return (
                <View key={classItem.id} style={styles.classCard}>
                  <View style={styles.classHeader}>
                    <View style={styles.classNameContainer}>
                      <ThemedText style={styles.className}>{classItem.name}</ThemedText>
                      <View style={styles.classSubjectContainer}>
                        <Ionicons name="book" size={14} color="#8E54E9" style={styles.subjectIcon} />
                        <ThemedText style={styles.classSubject}>{classItem.subject}</ThemedText>
                      </View>
                    </View>
                    {/* Attendance Rate Badge - Hidden or shows N/A as data is not fetched */}
                    {/* <LinearGradient
                      colors={attendanceColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.attendanceRateBadge}
                    >
                      <ThemedText style={styles.attendanceRateText}>N/A</ThemedText>
                    </LinearGradient> */}
                  </View>

                  <View style={styles.classTeacherContainer}>
                    <Ionicons name="person" size={16} color="#666" style={styles.teacherIcon} />
                    <ThemedText style={styles.classTeacher}>{classItem.teacher}</ThemedText>
                  </View>

                  <View style={styles.classDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="people" size={16} color="#666" />
                      <ThemedText style={styles.detailText}>{classItem.students} Students</ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="business" size={16} color="#666" />
                      <ThemedText style={styles.detailText}>Room: {classItem.room_number || "N/A"}</ThemedText>
                    </View>
                    {/* Last Attendance - N/A for now */}
                    {/* <View style={styles.detailItem}>
                      <MaterialIcons name="calendar-today" size={16} color="#666" />
                      <ThemedText style={styles.detailText}>Last: N/A</ThemedText>
                    </View> */}
                  </View>

                  <View style={styles.classActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push(`/attendance?classId=${classItem.id}&subject=${classItem.subject}`)}
                    >
                      <View style={[styles.actionButtonIcon, { backgroundColor: "rgba(142, 84, 233, 0.1)" }]}>
                        <FontAwesome5 name="user-check" size={16} color="#8E54E9" />
                      </View>
                      <ThemedText style={styles.actionButtonText}>Take Attendance</ThemedText>
                    </TouchableOpacity>
                    {/* View Report - Placeholder */}
                    {/* <TouchableOpacity style={styles.actionButton}>
                      <View style={[styles.actionButtonIcon, { backgroundColor: "rgba(76, 175, 80, 0.1)" }]}>
                        <MaterialIcons name="description" size={16} color="#4CAF50" />
                      </View>
                      <ThemedText style={styles.actionButtonText}>View Report</ThemedText>
                    </TouchableOpacity> */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleEditClass(classItem.id)}>
                      <View style={[styles.actionButtonIcon, { backgroundColor: "rgba(255, 193, 7, 0.1)" }]}>
                        <MaterialIcons name="edit" size={16} color="#FFC107" />
                      </View>
                      <ThemedText style={styles.actionButtonText}>Manage</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          ) : (
            <ThemedText style={styles.noClassesText}>
              {!currentUser && !isLoading
                ? "Please log in to see your classes."
                : currentUser && !staffId && !isLoading
                  ? "No staff profile found for your account. Please contact admin if this is an error."
                  : isLoading
                    ? "" // Handled by the global ActivityIndicator
                    : "You are not assigned to any classes or no classes found."}
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#333",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    width: width * 0.28,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 130, // Ensure consistent height
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  classesContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  classCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  classNameContainer: {
    flex: 1,
    marginRight: 10, // Add some space if attendance badge is shown
  },
  className: {
    fontSize: 17, // Slightly smaller
    fontWeight: "bold",
    color: "#333",
  },
  classSubjectContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  subjectIcon: {
    marginRight: 5,
  },
  classSubject: {
    fontSize: 14,
    color: "#8E54E9",
    fontWeight: "500",
  },
  classTeacherContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  teacherIcon: {
    marginRight: 5,
  },
  classTeacher: {
    fontSize: 14,
    color: "#666",
  },
  attendanceRateBadge: {
    // Kept for potential future use
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    minWidth: 60,
    alignItems: "center",
  },
  attendanceRateText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  classDetails: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap", // Allow details to wrap
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5, // For wrapping
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  classActions: {
    flexDirection: "row",
    justifyContent: "space-around", // Changed for better spacing
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: "column", // Icon on top, text below
    alignItems: "center",
    // flex: 1, // Removed to allow natural width based on content
    paddingHorizontal: 5, // Add some horizontal padding
  },
  actionButtonIcon: {
    width: 36, // Slightly larger icon background
    height: 36,
    borderRadius: 10, // Rounded square
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5, // Space between icon and text
  },
  actionButtonText: {
    fontSize: 11, // Slightly smaller text
    color: "#555", // Darker text for better readability
    textAlign: "center",
  },
  noClassesText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#777",
  },
})