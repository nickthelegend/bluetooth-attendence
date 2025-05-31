"use client"

import { useState, useEffect } from "react"
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { ThemedText } from "@/components/ThemedText"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { createClient, type User } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
// Consider using a Picker component for program selection
// import { Picker } from '@react-native-picker/picker';

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

interface Program {
  id: string
  name: string
}

export default function NewClassScreen() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [year, setYear] = useState("")
  const [section, setSection] = useState("")
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString()) // Default to current year
  const [roomNumber, setRoomNumber] = useState("")
  const [capacity, setCapacity] = useState("")
  const [subject, setSubject] = useState("") // Subject the staff will teach for this class

  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPrograms, setIsFetchingPrograms] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [staffId, setStaffId] = useState<string | null>(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsFetchingPrograms(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("id")
          .eq("user_id", user.id)
          .single() // Assuming one staff per user
        if (staffError || !staffData) {
          console.error("Error fetching staff ID or staff not found:", staffError?.message)
          Alert.alert("Error", "Could not find your staff profile. Please contact admin.")
          router.back()
          return
        }
        setStaffId(staffData.id)
      } else {
        Alert.alert("Authentication Error", "You are not logged in.")
        router.replace("/login") // Redirect to login if no user
        return
      }

      const { data, error } = await supabase.from("programs").select("id, name")
      if (error) {
        console.error("Error fetching programs:", error.message)
        Alert.alert("Error", "Could not load programs.")
      } else if (data) {
        setPrograms(data)
        if (data.length > 0) {
          setSelectedProgramId(data[0].id) // Default to first program
        }
      }
      setIsFetchingPrograms(false)
    }
    fetchInitialData()
  }, [])

  const handleCreateClass = async () => {
    if (!selectedProgramId || !year || !section || !academicYear || !subject || !staffId) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields (Program, Year, Section, Academic Year, Subject).",
      )
      return
    }
    setIsLoading(true)
    try {
      // 1. Create the class
      const { data: newClass, error: classError } = await supabase
        .from("classes")
        .insert({
          program_id: selectedProgramId,
          year: Number.parseInt(year, 10),
          section,
          academic_year: academicYear,
          room_number: roomNumber || null,
          capacity: capacity ? Number.parseInt(capacity, 10) : null,
        })
        .select()
        .single()

      if (classError || !newClass) {
        throw new Error(classError?.message || "Failed to create class.")
      }

      // 2. Assign the current staff to this new class
      const { error: classStaffError } = await supabase.from("class_staff").insert({
        class_id: newClass.id,
        staff_id: staffId,
        subject: subject, // Subject taught by this staff for this class
        role: "Instructor", // Default role
      })

      if (classStaffError) {
        // Optionally, try to delete the created class if staff assignment fails (rollback)
        await supabase.from("classes").delete().eq("id", newClass.id)
        throw new Error(classStaffError.message || "Failed to assign staff to class.")
      }

      Alert.alert("Success", "Class created and assigned successfully!")
      router.back() // Go back to the classes list
    } catch (error: any) {
      console.error("Error creating class:", error.message)
      Alert.alert("Error", `Failed to create class: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetchingPrograms) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#8E54E9" />
      </View>
    )
  }

  return (
    <>
      <LinearGradient colors={["#F8F9FA", "#E9ECEF"]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText style={styles.title}>Create a New Class</ThemedText>
          <ThemedText style={styles.subtitle}>Fill in the details below.</ThemedText>

          {/* Program Picker - Placeholder. Use a proper Picker component */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Program*</ThemedText>
            {programs.length > 0 ? (
              <View style={styles.pickerWrapper}>
                {/* Replace with <Picker> component */}
                <ThemedText style={styles.pickerPlaceholder}>
                  {selectedProgramId ? programs.find((p) => p.id === selectedProgramId)?.name : "Select Program"}
                </ThemedText>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Program Selection", "Implement a Picker here to select from available programs.")
                  }
                  style={styles.pickerTrigger}
                >
                  <Ionicons name="chevron-down" size={20} color="#8E54E9" />
                </TouchableOpacity>
              </View>
            ) : (
              <ThemedText>No programs available.</ThemedText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Subject Taught by You*</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mathematics, Physics"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <ThemedText style={styles.label}>Year* (e.g., 1, 2)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Class Year"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <ThemedText style={styles.label}>Section* (e.g., A, B)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Section"
                value={section}
                onChangeText={setSection}
                autoCapitalize="characters"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Academic Year* (e.g., 2023-2024)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="YYYY or YYYY-YYYY"
              value={academicYear}
              onChangeText={setAcademicYear}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <ThemedText style={styles.label}>Room Number</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Optional"
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <ThemedText style={styles.label}>Capacity</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Optional"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateClass} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <LinearGradient
                colors={["#4776E6", "#8E54E9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <MaterialIcons name="add-circle-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                <ThemedText style={styles.createButtonText}>Create Class</ThemedText>
              </LinearGradient>
            )}
          </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 50, // Ensure space for button
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputHalf: {
    width: "48%",
  },
  pickerWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50, // Standard height
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  pickerTrigger: {
    paddingLeft: 10,
  },
  createButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden", // For gradient
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
})
