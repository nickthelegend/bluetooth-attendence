"use client"

import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, StatusBar, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { ThemedText } from "@/components/ThemedText"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState, useEffect } from "react"
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

interface AttendanceStats {
  present: number
  absent: number
  leave: number
  total: number
}

interface RecentClass {
  id: string
  name: string
  date: string
  present: number
  total: number
  subject: string
}

export default function DashboardScreen() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [staffName, setStaffName] = useState<string>("Staff Member")
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    leave: 0,
    total: 0,
  })
  const [recentClasses, setRecentClasses] = useState<RecentClass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  // Fetch user and staff info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        // Fetch staff name
        const { data: staffData } = await supabase.from("staff").select("name").eq("user_id", user.id).single()
        if (staffData) {
          setStaffName(staffData.name)
        }
      }
    }
    fetchUserInfo()
  }, [])

  // Fetch attendance statistics
  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (!currentUser) return

      setIsStatsLoading(true)
      try {
        // Get staff ID first
        const { data: staffData } = await supabase.from("staff").select("id").eq("user_id", currentUser.id).single()
        if (!staffData) return

        // Get classes taught by this staff member
        const { data: classStaffData } = await supabase
          .from("class_staff")
          .select("class_id")
          .eq("staff_id", staffData.id)

        if (!classStaffData || classStaffData.length === 0) {
          setIsStatsLoading(false)
          return
        }

        const classIds = classStaffData.map((cs) => cs.class_id)

        // Get today's date
        const today = new Date().toISOString().split("T")[0]

        // Fetch attendance records for today for all classes taught by this staff
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("status")
          .in("class_id", classIds)
          .eq("date", today)

        if (attendanceData) {
          const present = attendanceData.filter((a) => a.status === "Present").length
          const absent = attendanceData.filter((a) => a.status === "Absent").length
          const leave = attendanceData.filter((a) => a.status === "Leave").length
          const total = attendanceData.length

          setAttendanceStats({ present, absent, leave, total })
        }
      } catch (error) {
        console.error("Error fetching attendance stats:", error)
      } finally {
        setIsStatsLoading(false)
      }
    }

    fetchAttendanceStats()
  }, [currentUser])

  // Fetch recent classes with attendance data
  useEffect(() => {
    const fetchRecentClasses = async () => {
      if (!currentUser) return

      setIsLoading(true)
      try {
        // Get staff ID
        const { data: staffData } = await supabase.from("staff").select("id").eq("user_id", currentUser.id).single()
        if (!staffData) return

        // Get classes taught by this staff member with program info
        const { data: classStaffData } = await supabase
          .from("class_staff")
          .select(
            `
            class_id,
            subject,
            classes!inner(
              id,
              year,
              section,
              programs!inner(name)
            )
          `,
          )
          .eq("staff_id", staffData.id)
          .limit(4) // Limit to recent 4 classes

        if (!classStaffData) return

        // Get recent attendance data for these classes
        const recentClassesData = await Promise.all(
          classStaffData.map(async (classStaff: any) => {
            const classInfo = classStaff.classes
            const programName = classInfo.programs?.name || "Unknown"
            const className = `${programName} ${classInfo.year}-${classInfo.section}`

            // Get recent attendance for this class (last 7 days)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

            const { data: attendanceData } = await supabase
              .from("attendance")
              .select("status, date")
              .eq("class_id", classInfo.id)
              .eq("subject", classStaff.subject)
              .gte("date", sevenDaysAgoStr)
              .order("date", { ascending: false })
              .limit(1) // Get most recent attendance session

            // Get total students in class
            const { count: totalStudents } = await supabase
              .from("class_students")
              .select("*", { count: "exact", head: true })
              .eq("class_id", classInfo.id)

            let present = 0
            let total = totalStudents || 0
            let date = new Date().toISOString().split("T")[0]

            if (attendanceData && attendanceData.length > 0) {
              // Get attendance for the most recent date
              const recentDate = attendanceData[0].date
              const { data: recentAttendance } = await supabase
                .from("attendance")
                .select("status")
                .eq("class_id", classInfo.id)
                .eq("subject", classStaff.subject)
                .eq("date", recentDate)

              if (recentAttendance) {
                present = recentAttendance.filter((a) => a.status === "Present").length
                total = recentAttendance.length
                date = recentDate
              }
            }

            return {
              id: classInfo.id,
              name: className,
              date: date,
              present: present,
              total: total,
              subject: classStaff.subject,
            }
          }),
        )

        setRecentClasses(recentClassesData)
      } catch (error) {
        console.error("Error fetching recent classes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentClasses()
  }, [currentUser])

  const calculatePercentage = (present: number, total: number) => {
    if (total === 0) return 0
    return Math.round((present / total) * 100)
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return ["#4CAF50", "#81C784"]
    if (percentage >= 75) return ["#FFC107", "#FFD54F"]
    return ["#F44336", "#E57373"]
  }

  const toggleDrawer = () => {
    global.toggleDrawer && global.toggleDrawer()
  }

  const handleTakeAttendance = () => {
    router.push("/(tabs)/attendance")
  }

  const handleManageClasses = () => {
    router.push("/(tabs)/classes")
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8E54E9" />
      <LinearGradient colors={["#8E54E9", "#4776E6"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <ThemedText style={styles.greeting}>Hello, {staffName}</ThemedText>
            <ThemedText style={styles.date}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Attendance Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(142, 84, 233, 0.1)" }]}>
              <Ionicons name="checkmark-circle" size={24} color="#8E54E9" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statLabel}>Present</ThemedText>
              {isStatsLoading ? (
                <ActivityIndicator size="small" color="#8E54E9" />
              ) : (
                <>
                  <ThemedText style={styles.statNumber}>{attendanceStats.present}</ThemedText>
                  <View style={styles.statPercentage}>
                    <ThemedText style={styles.statPercentageText}>
                      {calculatePercentage(attendanceStats.present, attendanceStats.total)}%
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(244, 67, 54, 0.1)" }]}>
              <Ionicons name="close-circle" size={24} color="#F44336" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statLabel}>Absent</ThemedText>
              {isStatsLoading ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <>
                  <ThemedText style={styles.statNumber}>{attendanceStats.absent}</ThemedText>
                  <View style={styles.statPercentage}>
                    <ThemedText style={styles.statPercentageText}>
                      {calculatePercentage(attendanceStats.absent, attendanceStats.total)}%
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(255, 193, 7, 0.1)" }]}>
              <Ionicons name="help-circle" size={24} color="#FFC107" />
            </View>
            <View style={styles.statInfo}>
              <ThemedText style={styles.statLabel}>On Leave</ThemedText>
              {isStatsLoading ? (
                <ActivityIndicator size="small" color="#FFC107" />
              ) : (
                <>
                  <ThemedText style={styles.statNumber}>{attendanceStats.leave}</ThemedText>
                  <View style={styles.statPercentage}>
                    <ThemedText style={styles.statPercentageText}>
                      {calculatePercentage(attendanceStats.leave, attendanceStats.total)}%
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTakeAttendance}>
              <LinearGradient
                colors={["#4776E6", "#8E54E9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={styles.actionButtonText}>Take Attendance</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={["#FF9966", "#FF5E62"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={styles.actionButtonText}>Generate Report</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleManageClasses}>
              <LinearGradient
                colors={["#56ab2f", "#a8e063"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="people" size={24} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={styles.actionButtonText}>Manage Classes</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Attendance */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Attendance</ThemedText>
            <TouchableOpacity style={styles.viewAllButton}>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#8E54E9" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#8E54E9" style={{ marginTop: 20 }} />
          ) : recentClasses.length > 0 ? (
            recentClasses.map((classItem) => {
              const percentage = calculatePercentage(classItem.present, classItem.total)
              const colors = getAttendanceColor(percentage)

              return (
                <View key={classItem.id} style={styles.classCard}>
                  <View style={styles.classInfo}>
                    <ThemedText style={styles.className}>{classItem.name}</ThemedText>
                    <View style={styles.classDetails}>
                      <View style={styles.classDetailItem}>
                        <Ionicons name="calendar" size={14} color="#666" />
                        <ThemedText style={styles.classDetailText}>{classItem.date}</ThemedText>
                      </View>
                      <View style={styles.classDetailItem}>
                        <Ionicons name="people" size={14} color="#666" />
                        <ThemedText style={styles.classDetailText}>
                          {classItem.present}/{classItem.total} Students
                        </ThemedText>
                      </View>
                      <View style={styles.classDetailItem}>
                        <Ionicons name="book" size={14} color="#666" />
                        <ThemedText style={styles.classDetailText}>{classItem.subject}</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.attendanceInfo}>
                    <View style={styles.attendanceBar}>
                      <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.attendanceBarFill, { width: `${percentage}%` }]}
                      />
                    </View>
                    <ThemedText style={[styles.attendancePercentage, { color: colors[0] }]}>{percentage}%</ThemedText>
                  </View>

                  <TouchableOpacity style={styles.viewButton}>
                    <ThemedText style={styles.viewButtonText}>View</ThemedText>
                    <Ionicons name="chevron-forward" size={14} color="#8E54E9" />
                  </TouchableOpacity>
                </View>
              )
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school" size={48} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>No recent attendance data</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>Start taking attendance to see data here</ThemedText>
            </View>
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
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  date: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    width: width * 0.28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 120,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statInfo: {
    alignItems: "flex-start",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statPercentage: {
    marginTop: 5,
  },
  statPercentageText: {
    fontSize: 12,
    color: "#666",
  },
  sectionContainer: {
    padding: 20,
    marginBottom: 10,
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
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#8E54E9",
    marginRight: 5,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    alignItems: "center",
    width: width * 0.28,
  },
  actionButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
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
  classInfo: {
    marginBottom: 15,
  },
  className: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  classDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  classDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
  },
  classDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  attendanceInfo: {
    marginBottom: 15,
  },
  attendanceBar: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 5,
  },
  attendanceBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  attendancePercentage: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(142, 84, 233, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  viewButtonText: {
    color: "#8E54E9",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
})
