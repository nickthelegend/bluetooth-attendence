"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { IconSymbol } from "@/components/ui/IconSymbol"

export default function AttendanceScreen() {
  const [selectedClass, setSelectedClass] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  // Mock data for classes
  const classes = [
    { id: 1, name: "Class 10-A", students: 30 },
    { id: 2, name: "Class 9-B", students: 28 },
    { id: 3, name: "Class 11-C", students: 35 },
    { id: 4, name: "Class 12-D", students: 25 },
  ]

  // Mock data for students (only shown when a class is selected)
  const students = [
    { id: 1, name: "John Doe", rollNo: "101", present: true },
    { id: 2, name: "Jane Smith", rollNo: "102", present: true },
    { id: 3, name: "Michael Johnson", rollNo: "103", present: false },
    { id: 4, name: "Emily Brown", rollNo: "104", present: true },
    { id: 5, name: "David Wilson", rollNo: "105", present: true },
    { id: 6, name: "Sarah Taylor", rollNo: "106", present: false },
    { id: 7, name: "James Anderson", rollNo: "107", present: true },
    { id: 8, name: "Olivia Martinez", rollNo: "108", present: true },
    { id: 9, name: "Robert Garcia", rollNo: "109", present: false },
    { id: 10, name: "Sophia Rodriguez", rollNo: "110", present: true },
  ]

  const [studentList, setStudentList] = useState(students)

  const toggleAttendance = (id) => {
    setStudentList(
      studentList.map((student) => (student.id === id ? { ...student, present: !student.present } : student)),
    )
  }

  const markAllPresent = () => {
    setStudentList(studentList.map((student) => ({ ...student, present: true })))
  }

  const markAllAbsent = () => {
    setStudentList(studentList.map((student) => ({ ...student, present: false })))
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Take Attendance</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Mark student attendance</ThemedText>
      </ThemedView>

      <ThemedView style={styles.dateSelector}>
        <ThemedText style={styles.dateLabel}>Date:</ThemedText>
        <TextInput style={styles.dateInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      </ThemedView>

      <ThemedView style={styles.classSelector}>
        <ThemedText style={styles.sectionTitle}>Select Class</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classCardsContainer}>
          {classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={[styles.classCard, selectedClass === classItem.id && styles.selectedClassCard]}
              onPress={() => setSelectedClass(classItem.id)}
            >
              <IconSymbol size={30} name="person.3.fill" color={selectedClass === classItem.id ? "#fff" : "#4c669f"} />
              <ThemedText style={[styles.classCardName, selectedClass === classItem.id && styles.selectedClassText]}>
                {classItem.name}
              </ThemedText>
              <ThemedText
                style={[styles.classCardStudents, selectedClass === classItem.id && styles.selectedClassText]}
              >
                {classItem.students} Students
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {selectedClass && (
        <>
          <ThemedView style={styles.attendanceActions}>
            <ThemedText style={styles.sectionTitle}>Student Attendance</ThemedText>
            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={markAllPresent}>
                <ThemedText style={styles.actionButtonText}>Mark All Present</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.absentButton]} onPress={markAllAbsent}>
                <ThemedText style={styles.actionButtonText}>Mark All Absent</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.studentList}>
            {studentList.map((student) => (
              <ThemedView key={student.id} style={styles.studentCard}>
                <ThemedView style={styles.studentInfo}>
                  <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                  <ThemedText style={styles.studentRoll}>Roll No: {student.rollNo}</ThemedText>
                </ThemedView>
                <Switch
                  value={student.present}
                  onValueChange={() => toggleAttendance(student.id)}
                  trackColor={{ false: "#ff4b1f", true: "#4c669f" }}
                  thumbColor={student.present ? "#fff" : "#fff"}
                />
              </ThemedView>
            ))}
          </ThemedView>

          <TouchableOpacity style={styles.submitButton}>
            <LinearGradient colors={["#4c669f", "#3b5998", "#192f6a"]} style={styles.submitGradient}>
              <ThemedText style={styles.submitButtonText}>Submit Attendance</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 0,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  dateInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
  },
  classSelector: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  classCardsContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  classCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    width: 150,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedClassCard: {
    backgroundColor: "#4c669f",
  },
  classCardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  classCardStudents: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  selectedClassText: {
    color: "#fff",
  },
  attendanceActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#4c669f",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  absentButton: {
    backgroundColor: "#ff4b1f",
    marginRight: 0,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  studentList: {
    padding: 20,
    paddingTop: 0,
  },
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  submitButton: {
    margin: 20,
    borderRadius: 5,
    overflow: "hidden",
  },
  submitGradient: {
    padding: 15,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
