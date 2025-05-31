"use client"

import { useState, useEffect, useCallback } from "react"
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { ThemedText } from "@/components/ThemedText"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

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

interface ClassDetails {
  id: string
  name: string
  programName: string
  year: number
  section: string
  academic_year: string
  room_number?: string
  capacity?: number
}

interface StudentData {
  id: string
  name: string
  email: string
  roll_number: string
}

export default function ManageClassScreen() {
  const router = useRouter()
  const { id: classId } = useLocalSearchParams<{ id: string }>()

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<StudentData[]>([])
  const [availableToAddStudents, setAvailableToAddStudents] = useState<StudentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStudentSectionLoading, setIsStudentSectionLoading] = useState(false)
  const [isAddingStudentsVisible, setIsAddingStudentsVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const fetchClassAndEnrolledStudents = useCallback(
    async (isRefresh = false) => {
      if (!classId) return
      if (!isRefresh) setIsLoading(true)
      else setIsStudentSectionLoading(true)

      try {
        // Fetch Class Details
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select(
            `
          id,
          year,
          section,
          academic_year,
          room_number,
          capacity,
          program:programs (name)
        `,
          )
          .eq("id", classId)
          .single()

        if (classError || !classData) {
          throw new Error(classError?.message || "Could not load class details.")
        }
        const programName = (classData.program as any)?.name || "N/A"
        setClassDetails({
          ...classData,
          name: `${programName} ${classData.year}-${classData.section}`,
          programName: programName,
        })

        // Fetch Students in this Class
        const { data: classStudentsData, error: classStudentsError } = await supabase
          .from("class_students")
          .select("student:students!inner(id, name, email, roll_number)")
          .eq("class_id", classId)

        if (classStudentsError) {
          throw new Error(classStudentsError.message || "Could not load enrolled students.")
        }

        const currentEnrolled =
          classStudentsData?.map((cs: any) => ({
            id: cs.student.id,
            name: cs.student.name,
            email: cs.student.email,
            roll_number: cs.student.roll_number,
          })) || []
        setEnrolledStudents(currentEnrolled)
      } catch (error: any) {
        console.error("Error fetching class/student data:", error.message)
        Alert.alert("Error", error.message)
        if (!isRefresh) router.back()
      } finally {
        if (!isRefresh) setIsLoading(false)
        else setIsStudentSectionLoading(false)
        setRefreshing(false)
      }
    },
    [classId, router],
  )

  useEffect(() => {
    fetchClassAndEnrolledStudents()
  }, [fetchClassAndEnrolledStudents])

  // Fetch all students (for adding) - only when the add section is visible
  useEffect(() => {
    if (!isAddingStudentsVisible || !classId) {
      setAvailableToAddStudents([])
      return
    }

    const fetchAllStudentsForAdding = async () => {
      setIsStudentSectionLoading(true)
      try {
        // Fetch all students
        const { data: allStudentsData, error: allStudentsError } = await supabase
          .from("students")
          .select("id, name, email, roll_number")
          .limit(100)

        if (allStudentsError) {
          throw new Error(allStudentsError.message || "Could not load all students.")
        }

        if (allStudentsData) {
          // Filter out students already enrolled in the current class
          const notEnrolled = allStudentsData.filter((s) => !enrolledStudents.find((es) => es.id === s.id))
          setAvailableToAddStudents(notEnrolled as StudentData[])
        } else {
          setAvailableToAddStudents([])
        }
      } catch (error: any) {
        console.error("Error fetching students for adding:", error.message)
        Alert.alert("Error", error.message)
        setAvailableToAddStudents([])
      } finally {
        setIsStudentSectionLoading(false)
      }
    }

    fetchAllStudentsForAdding()
  }, [isAddingStudentsVisible, classId, enrolledStudents])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchClassAndEnrolledStudents(true).then(() => {
      if (isAddingStudentsVisible) {
        // Optionally re-trigger fetchAllStudentsForAdding if add section is open
        // This is implicitly handled by enrolledStudents changing in its dependency array
      }
    })
  }, [fetchClassAndEnrolledStudents, isAddingStudentsVisible])

  const handleAddStudentToClass = async (studentId: string) => {
    if (!classId) return
    const studentToAdd = availableToAddStudents.find((s) => s.id === studentId)
    if (!studentToAdd) {
      Alert.alert("Error", "Student not found in available list.")
      return
    }

    Alert.alert("Confirm Add Student", `Add ${studentToAdd.name} to this class?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Add",
        onPress: async () => {
          setIsStudentSectionLoading(true)
          const { error } = await supabase.from("class_students").insert({ class_id: classId, student_id: studentId })
          setIsStudentSectionLoading(false)
          if (error) {
            Alert.alert("Error", `Failed to add student: ${error.message}`)
          } else {
            Alert.alert("Success", `${studentToAdd.name} added to the class.`)
            setEnrolledStudents((prev) => [...prev, studentToAdd].sort((a, b) => a.name.localeCompare(b.name)))
            setAvailableToAddStudents((prev) => prev.filter((s) => s.id !== studentId))
          }
        },
      },
    ])
  }

  const handleRemoveStudentFromClass = async (studentId: string) => {
    if (!classId) return
    const studentToRemove = enrolledStudents.find((s) => s.id === studentId)
    if (!studentToRemove) return

    Alert.alert("Confirm Remove Student", `Remove ${studentToRemove.name} from this class?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setIsStudentSectionLoading(true)
          const { error } = await supabase
            .from("class_students")
            .delete()
            .match({ class_id: classId, student_id: studentId })
          setIsStudentSectionLoading(false)
          if (error) {
            Alert.alert("Error", `Failed to remove student: ${error.message}`)
          } else {
            Alert.alert("Success", `${studentToRemove.name} removed from the class.`)
            setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId))
            if (isAddingStudentsVisible) {
              setAvailableToAddStudents((prev) =>
                [...prev, studentToRemove].sort((a, b) => a.name.localeCompare(b.name)),
              )
            }
          }
        },
      },
    ])
  }

  const filteredAvailableStudents = searchTerm
    ? availableToAddStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : availableToAddStudents

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" }}>
        <ActivityIndicator size="large" color="#8E54E9" />
      </View>
    )
  }

  if (!classDetails) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" }}>
        <ThemedText>Class not found.</ThemedText>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: classDetails.name || "Manage Class",
          headerShown: true,
        }}
      />
      <LinearGradient colors={["#F8F9FA", "#E9ECEF"]} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8E54E9"]} />}
        >
          <View style={styles.headerSection}>
            <ThemedText style={styles.className}>{classDetails.name}</ThemedText>
            <ThemedText style={styles.classMeta}>
              Program: {classDetails.programName} | Acad. Year: {classDetails.academic_year}
            </ThemedText>
            <ThemedText style={styles.classMeta}>
              Room: {classDetails.room_number || "N/A"} | Capacity: {classDetails.capacity || "N/A"}
            </ThemedText>
          </View>

          {/* Enrolled Students Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Enrolled Students ({enrolledStudents.length})</ThemedText>
            {isStudentSectionLoading && !refreshing ? (
              <ActivityIndicator size="small" color="#8E54E9" style={{ marginVertical: 10 }} />
            ) : enrolledStudents.length === 0 ? (
              <ThemedText style={styles.emptyText}>No students enrolled in this class yet.</ThemedText>
            ) : (
              enrolledStudents.map((student) => (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                    <ThemedText style={styles.studentDetails}>
                      Roll: {student.roll_number} | Email: {student.email}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.actionButtonRemove}
                    onPress={() => handleRemoveStudentFromClass(student.id)}
                    disabled={isStudentSectionLoading}
                  >
                    <MaterialIcons name="remove-circle-outline" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Add Students Section */}
          <View style={styles.section}>
            <TouchableOpacity
              onPress={() => setIsAddingStudentsVisible(!isAddingStudentsVisible)}
              style={styles.manageButton}
            >
              <ThemedText style={styles.manageButtonText}>
                {isAddingStudentsVisible ? "Hide Student Adder" : "Add Students to Class"}
              </ThemedText>
              <Ionicons name={isAddingStudentsVisible ? "chevron-up" : "chevron-down"} size={20} color="#fff" />
            </TouchableOpacity>

            {isAddingStudentsVisible && (
              <View style={styles.addStudentContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students by name, email, roll no..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholderTextColor="#999"
                />
                {isStudentSectionLoading && !refreshing ? (
                  <ActivityIndicator size="small" color="#8E54E9" style={{ marginVertical: 10 }} />
                ) : filteredAvailableStudents.length === 0 && searchTerm ? (
                  <ThemedText style={styles.emptyText}>No matching students found.</ThemedText>
                ) : filteredAvailableStudents.length === 0 && !searchTerm ? (
                  <ThemedText style={styles.emptyText}>
                    All students are already in this class or no students available to add.
                  </ThemedText>
                ) : (
                  filteredAvailableStudents.map((student) => (
                    <View key={student.id} style={styles.studentCardAdd}>
                      <View style={styles.studentInfo}>
                        <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                        <ThemedText style={styles.studentDetails}>
                          Roll: {student.roll_number} | Email: {student.email}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.actionButtonAdd}
                        onPress={() => handleAddStudentToClass(student.id)}
                        disabled={isStudentSectionLoading}
                      >
                        <MaterialIcons name="add-circle-outline" size={24} color="#4CAF50" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  headerSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  className: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#8E54E9",
    marginBottom: 8,
  },
  classMeta: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  studentCardAdd: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  studentInfo: {
    flex: 1,
    marginRight: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
  },
  studentDetails: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },
  actionButtonRemove: {
    padding: 5,
  },
  actionButtonAdd: {
    padding: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginVertical: 15,
    fontSize: 14,
  },
  manageButton: {
    backgroundColor: "#8E54E9",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  manageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addStudentContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  searchInput: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    marginBottom: 15,
  },
})
