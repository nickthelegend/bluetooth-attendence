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
  Alert, // Corrected: Import Alert from react-native
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { ThemedText } from "@/components/ThemedText"
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"
import { createClient, type User } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"

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

interface Student {
  id: string
  name: string
  rollNo: string
  present: boolean
  avatar: string
}

interface ClassItem {
  id: string
  name: string
  students: number
  subject: string
  teacher: string
  time: string
  room: string
  color: string[]
}

export default function AttendanceScreen() {
  const router = useRouter()
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [showCalendar, setShowCalendar] = useState(false)
  const [studentList, setStudentList] = useState<Student[]>([])
  const [fetchedClasses, setFetchedClasses] = useState<ClassItem[]>([])
  const [loggedInUserClassCount, setLoggedInUserClassCount] = useState<number | null>(null)
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [attendanceMode, setAttendanceMode] = useState<"normal" | "automatic">("normal")

  // Navigate to automatic attendance screen if mode changes and a class is selected
  useEffect(() => {
    if (attendanceMode === "automatic" && selectedClass) {
      router.push({
        pathname: "/automatic/automatic",
        params: { classId: selectedClass.id, subject: selectedClass.subject, className: selectedClass.name },
      })
      // Optionally reset to normal mode after navigation to prevent re-triggering if user comes back
      // setAttendanceMode("normal");
    }
  }, [attendanceMode, selectedClass, router])

  useEffect(() => {
    const fetchStaffClasses = async () => {
      setIsLoadingClasses(true)
      setLoggedInUserClassCount(null)
      setFetchedClasses([])
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setIsLoadingClasses(false)
        setLoggedInUserClassCount(0)
        return
      }
      setCurrentUser(user)
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, name")
        .eq("user_id", user.id)
        .maybeSingle()
      if (staffError || !staffData) {
        setIsLoadingClasses(false)
        setLoggedInUserClassCount(0)
        return
      }
      const staffId = staffData.id
      const staffName = staffData.name
      const { data: assignedClasses, error: assignedClassesError } = await supabase
        .from("class_staff")
        .select("subject, classes!inner(id, year, section, room_number, programs!inner(name))")
        .eq("staff_id", staffId)
      if (assignedClassesError) {
        setIsLoadingClasses(false)
        setLoggedInUserClassCount(0)
        return
      }
      if (assignedClasses) {
        setLoggedInUserClassCount(assignedClasses.length)
        const transformedClassesPromises = assignedClasses.map(async (item: any) => {
          const classDetails = item.classes
          if (!classDetails) return null
          const program = classDetails.programs
          if (!program) return null
          const { count: studentCount } = await supabase
            .from("class_students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classDetails.id)
          return {
            id: classDetails.id,
            name: `${program.name} ${classDetails.year}-${classDetails.section}`,
            students: studentCount || 0,
            subject: item.subject,
            teacher: staffName,
            time: "N/A",
            room: classDetails.room_number || "N/A",
            color: ["#4776E6", "#8E54E9"],
          }
        })
        const resolvedTransformedClasses = (await Promise.all(transformedClassesPromises)).filter(
          Boolean,
        ) as ClassItem[]
        setFetchedClasses(resolvedTransformedClasses)
      } else {
        setLoggedInUserClassCount(0)
        setFetchedClasses([])
      }
      setIsLoadingClasses(false)
    }
    fetchStaffClasses()
  }, [])

  useEffect(() => {
    const fetchStudentsForClass = async () => {
      if (!selectedClass) {
        setStudentList([])
        return
      }
      setIsLoadingStudents(true)
      setStudentList([])
      try {
        const { data: classStudentsData } = await supabase
          .from("class_students")
          .select("student_id")
          .eq("class_id", selectedClass.id)
        if (!classStudentsData || classStudentsData.length === 0) {
          setIsLoadingStudents(false)
          return
        }
        const studentIds = classStudentsData.map((cs) => cs.student_id)
        const { data: studentsData } = await supabase
          .from("students")
          .select("id, name, roll_number")
          .in("id", studentIds)
        if (studentsData) {
          const formattedStudents: Student[] = studentsData.map((student) => ({
            id: student.id,
            name: student.name,
            rollNo: student.roll_number,
            present: true,
            avatar: student.name.charAt(0).toUpperCase(),
          }))
          setStudentList(formattedStudents)
        }
      } catch (error: any) {
        console.error("Error fetching students:", error.message)
      } finally {
        setIsLoadingStudents(false)
      }
    }
    if (attendanceMode === "normal") {
      // Only fetch for normal mode
      fetchStudentsForClass()
    }
  }, [selectedClass, attendanceMode])

  const toggleAttendance = (id: string) => {
    setStudentList(
      studentList.map((student) => (student.id === id ? { ...student, present: !student.present } : student)),
    )
  }

  const markAllPresent = () => setStudentList(studentList.map((student) => ({ ...student, present: true })))
  const markAllAbsent = () => setStudentList(studentList.map((student) => ({ ...student, present: false })))

  const getAttendanceStats = () => {
    if (studentList.length === 0) return { present: 0, absent: 0, presentPercentage: 0 }
    const present = studentList.filter((s) => s.present).length
    const absent = studentList.length - present
    const presentPercentage = Math.round((present / studentList.length) * 100)
    return { present, absent, presentPercentage }
  }

  const toggleDrawer = () => global.toggleDrawer && global.toggleDrawer()

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !currentUser || studentList.length === 0) {
      Alert.alert("Missing Data", "Please select a class and ensure students are loaded.")
      return
    }

    const attendanceRecords = studentList.map((student) => ({
      class_id: selectedClass.id,
      student_id: student.id,
      subject: selectedClass.subject,
      date: date,
      status: student.present ? "Present" : "Absent",
      hours_attended: student.present ? 1 : 0, // Example, adjust as needed
      // staff_id: currentUser.id, // If you have a staff_id column in attendance
    }))

    console.log("Submitting attendance:", attendanceRecords)
    // const { error } = await supabase.from('attendance').upsert(attendanceRecords, {
    //   onConflict: 'class_id,student_id,date,subject' // Ensure your onConflict matches your table constraints
    // });
    // if (error) {
    //   console.error('Error submitting attendance:', error.message);
    //   Alert.alert('Error', `Failed to submit attendance: ${error.message}`);
    // } else {
    //   console.log('Attendance submitted successfully');
    //   Alert.alert('Success', 'Attendance submitted successfully!');
    // }
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
            <ThemedText style={styles.headerTitle}>Take Attendance</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Mark student attendance</ThemedText>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity style={styles.datePickerWrapper} onPress={() => setShowCalendar(!showCalendar)}>
            <MaterialIcons name="calendar-today" size={20} color="#8E54E9" style={styles.dateIcon} />
            <TextInput
              style={styles.dateInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              editable={false}
            />
            <MaterialIcons name="arrow-drop-down" size={24} color="#8E54E9" />
          </TouchableOpacity>
        </View>

        {/* Attendance Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <ThemedText style={styles.modeLabel}>Mode:</ThemedText>
          <TouchableOpacity
            style={[styles.modeButton, attendanceMode === "normal" && styles.modeButtonActive]}
            onPress={() => setAttendanceMode("normal")}
          >
            <ThemedText style={[styles.modeButtonText, attendanceMode === "normal" && styles.modeButtonTextActive]}>
              Normal
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, attendanceMode === "automatic" && styles.modeButtonActive]}
            onPress={() => {
              if (selectedClass) {
                setAttendanceMode("automatic")
              } else {
                Alert.alert("Select Class", "Please select a class first to use automatic attendance.")
              }
            }}
          >
            <ThemedText style={[styles.modeButtonText, attendanceMode === "automatic" && styles.modeButtonTextActive]}>
              Automatic
            </ThemedText>
          </TouchableOpacity>
        </View>

        {
          !selectedClass ? (
            <View style={styles.sectionContainer}>
              {/* Class Selection UI */}
              {isLoadingClasses ? (
                <ActivityIndicator size="large" color="#8E54E9" style={{ marginTop: 20 }} />
              ) : (
                <>
                  <View style={styles.classCountContainer}>
                    <ThemedText style={styles.sectionTitle}>Select Class</ThemedText>
                    {loggedInUserClassCount !== null && (
                      <ThemedText style={styles.classCountText}>
                        You have {loggedInUserClassCount} class{loggedInUserClassCount !== 1 ? "es" : ""} assigned.
                      </ThemedText>
                    )}
                  </View>
                  {fetchedClasses.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classCardsContainer}>
                      {fetchedClasses.map((classItem) => (
                        <TouchableOpacity
                          key={classItem.id}
                          style={styles.classCard}
                          onPress={() => {
                            setSelectedClass(classItem)
                            if (attendanceMode === "automatic") {
                              // If auto mode is already selected, trigger navigation
                              router.push({
                                pathname: "/automatic/automatic",
                                params: {
                                  classId: classItem.id,
                                  subject: classItem.subject,
                                  className: classItem.name,
                                },
                              })
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={classItem.color}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.classCardGradient}
                          >
                            <View style={styles.classCardIcon}>
                              <Ionicons name="people" size={24} color="#FFFFFF" />
                            </View>
                            <ThemedText style={styles.classCardName} numberOfLines={2}>
                              {classItem.name}
                            </ThemedText>
                            <ThemedText style={styles.classCardSubject}>{classItem.subject}</ThemedText>
                            <ThemedText style={styles.classCardStudents}>{classItem.students} Students</ThemedText>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <ThemedText style={styles.noClassesText}>
                      {loggedInUserClassCount === 0
                        ? "No classes assigned to you."
                        : "No classes found or error loading classes."}
                    </ThemedText>
                  )}
                </>
              )}
            </View>
          ) : attendanceMode === "normal" ? ( // Normal Attendance UI
            <>
              <View style={styles.attendanceStatsContainer}>
                {/* Stats UI */}
                <View style={styles.attendanceStatsCard}>
                  <View style={styles.attendanceStatsRow}>
                    <View style={styles.attendanceStatItem}>
                      <ThemedText style={styles.attendanceStatLabel}>Present</ThemedText>
                      <ThemedText style={styles.attendanceStatValue}>{getAttendanceStats().present}</ThemedText>
                    </View>
                    <View style={styles.attendanceStatItem}>
                      <ThemedText style={styles.attendanceStatLabel}>Absent</ThemedText>
                      <ThemedText style={styles.attendanceStatValue}>{getAttendanceStats().absent}</ThemedText>
                    </View>
                    <View style={styles.attendanceStatItem}>
                      <ThemedText style={styles.attendanceStatLabel}>Percentage</ThemedText>
                      <ThemedText style={styles.attendanceStatValue}>
                        {getAttendanceStats().presentPercentage}%
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.attendanceProgressBar}>
                    <View
                      style={[styles.attendanceProgressFill, { width: `${getAttendanceStats().presentPercentage}%` }]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                {/* Student List UI */}
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>
                    Students for {selectedClass.name} - {selectedClass.subject}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setSelectedClass(null)} style={styles.changeClassButton}>
                    <ThemedText style={styles.changeClassButtonText}>Change Class</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton} onPress={markAllPresent}>
                    <LinearGradient
                      colors={["#4CAF50", "#81C784"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      <ThemedText style={styles.actionButtonText}>All Present</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={markAllAbsent}>
                    <LinearGradient
                      colors={["#F44336", "#E57373"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionButtonGradient}
                    >
                      <ThemedText style={styles.actionButtonText}>All Absent</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {isLoadingStudents ? (
                  <ActivityIndicator size="large" color="#8E54E9" style={{ marginTop: 20 }} />
                ) : studentList.length > 0 ? (
                  <View style={styles.studentList}>
                    {studentList.map((student) => (
                      <View key={student.id} style={styles.studentCard}>
                        <View style={styles.studentAvatarContainer}>
                          <View
                            style={[styles.studentAvatar, { backgroundColor: student.present ? "#8E54E9" : "#F44336" }]}
                          >
                            <ThemedText style={styles.studentAvatarText}>{student.avatar}</ThemedText>
                          </View>
                        </View>
                        <View style={styles.studentInfo}>
                          <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                          <ThemedText style={styles.studentRoll}>Roll No: {student.rollNo}</ThemedText>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.attendanceToggle,
                            student.present ? styles.presentToggle : styles.absentToggle,
                          ]}
                          onPress={() => toggleAttendance(student.id)}
                        >
                          {student.present ? (
                            <FontAwesome5 name="check" size={16} color="#4CAF50" />
                          ) : (
                            <FontAwesome5 name="times" size={16} color="#F44336" />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <ThemedText style={styles.noStudentsText}>No students found for this class.</ThemedText>
                )}

                {studentList.length > 0 && (
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAttendance}>
                    <LinearGradient
                      colors={["#4776E6", "#8E54E9"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitGradient}
                    >
                      <ThemedText style={styles.submitButtonText}>Submit Attendance</ThemedText>
                      <MaterialIcons name="check-circle" size={20} color="#FFFFFF" style={styles.submitIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : null /* Placeholder for Automatic mode UI if not redirecting immediately */
        }
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
  datePickerContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  datePickerWrapper: {
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
  dateIcon: {
    marginRight: 10,
  },
  dateInput: {
    flex: 1,
    height: 50,
    color: "#333",
    fontSize: 16,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  classCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  classCountText: {
    fontSize: 14,
    color: "#666",
  },
  noClassesText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#777",
  },
  noStudentsText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#777",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  changeClassButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(142, 84, 233, 0.1)",
    borderRadius: 8,
  },
  changeClassButtonText: {
    color: "#8E54E9",
    fontWeight: "600",
    fontSize: 13,
  },
  classCardsContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  classCard: {
    width: 150,
    marginRight: 15,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  classCardGradient: {
    padding: 15,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  classCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  classCardName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    minHeight: 36,
    textAlign: "center",
  },
  classCardSubject: {
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 5,
    textAlign: "center",
    opacity: 0.9,
  },
  classCardStudents: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 5,
    textAlign: "center",
    opacity: 0.8,
  },
  attendanceStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  attendanceStatsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  attendanceStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  attendanceStatItem: {
    alignItems: "center",
    flex: 1,
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  attendanceStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  attendanceProgressBar: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  attendanceProgressFill: {
    height: "100%",
    backgroundColor: "#8E54E9",
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 15,
  },
  actionButton: {
    marginLeft: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  actionButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  studentList: {
    marginTop: 10,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  studentAvatarContainer: {
    marginRight: 15,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  studentRoll: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  attendanceToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  presentToggle: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  absentToggle: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  submitIcon: {
    marginLeft: 5,
  },
  modeToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 10,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8E54E9",
    marginHorizontal: 5,
  },
  modeButtonActive: {
    backgroundColor: "#8E54E9",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E54E9",
  },
  modeButtonTextActive: {
    color: "#FFFFFF",
  },
})
