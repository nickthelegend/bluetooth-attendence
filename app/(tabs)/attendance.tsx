"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, View, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { IconSymbol } from "@/components/ui/IconSymbol"

const { width } = Dimensions.get("window")

export default function AttendanceScreen() {
  const [selectedClass, setSelectedClass] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  // Mock data for classes
  const classes = [
    { id: 1, name: "Class 10-A", students: 30, subject: "Mathematics" },
    { id: 2, name: "Class 9-B", students: 28, subject: "Science" },
    { id: 3, name: "Class 11-C", students: 35, subject: "English" },
    { id: 4, name: "Class 12-D", students: 25, subject: "History" },
  ]

  // Mock data for students (only shown when a class is selected)
  const students = [
    { id: 1, name: "John Doe", rollNo: "101", present: true, avatar: "J" },
    { id: 2, name: "Jane Smith", rollNo: "102", present: true, avatar: "J" },
    { id: 3, name: "Michael Johnson", rollNo: "103", present: false, avatar: "M" },
    { id: 4, name: "Emily Brown", rollNo: "104", present: true, avatar: "E" },
    { id: 5, name: "David Wilson", rollNo: "105", present: true, avatar: "D" },
    { id: 6, name: "Sarah Taylor", rollNo: "106", present: false, avatar: "S" },
    { id: 7, name: "James Anderson", rollNo: "107", present: true, avatar: "J" },
    { id: 8, name: "Olivia Martinez", rollNo: "108", present: true, avatar: "O" },
    { id: 9, name: "Robert Garcia", rollNo: "109", present: false, avatar: "R" },
    { id: 10, name: "Sophia Rodriguez", rollNo: "110", present: true, avatar: "S" },
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

  const getAttendanceStats = () => {
    const present = studentList.filter(s => s.present).length
    const absent = studentList.length - present
    const presentPercentage = Math.round((present / studentList.length) * 100)
    
    return { present, absent, presentPercentage }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#4776E6", "#8E54E9"]} style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Take Attendance</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Mark student attendance</ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.datePickerContainer}>
        <View style={styles.datePickerWrapper}>
          <IconSymbol size={20} name="calendar" color="#8E54E9" style={styles.dateIcon} />
          <TextInput
            style={styles.dateInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <ThemedText style={styles.sectionTitle}>Select Class</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classCardsContainer}>
          {classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={[styles.classCard, selectedClass === classItem.id && styles.selectedClassCard]}
              onPress={() => setSelectedClass(classItem.id)}
            >
              <LinearGradient
                colors={selectedClass === classItem.id ? ["#4776E6", "#8E54E9"] : ["#F8F9FA", "#F8F9FA"]}
                style={styles.classCardGradient}
              >
                <View style={styles.classCardIcon}>
                  <IconSymbol
                    size={24}
                    name="person.3.fill"
                    color={selectedClass === classItem.id ? "#FFFFFF" : "#8E54E9"}
                  />
                </View>
                <ThemedText
                  style={[styles.classCardName, selectedClass === classItem.id && styles.selectedClassText]}
                >
                  {classItem.name}
                </ThemedText>
                <ThemedText
                  style={[styles.classCardSubject, selectedClass === classItem.id && styles.selectedClassText]}
                >
                  {classItem.subject}
                </ThemedText>
                <ThemedText
                  style={[styles.classCardStudents, selectedClass === classItem.id && styles.selectedClassText]}
                >
                  {classItem.students} Students
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedClass && (
        <>
          <View style={styles.attendanceStatsContainer}>
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
                  <ThemedText style={styles.attendanceStatValue}>{getAttendanceStats().presentPercentage}%</ThemedText>
                </View>
              </View>
              <View style={styles.attendanceProgressBar}>
                <View
                  style={[
                    styles.attendanceProgressFill,
                    { width: `${getAttendanceStats().presentPercentage}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Student Attendance</ThemedText>
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
            </View>

            <View style={styles.studentList}>
              {studentList.map((student) => (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentAvatarContainer}>
                    <View
                      style={[
                        styles.studentAvatar,
                        { backgroundColor: student.present ? "#8E54E9" : "#F44336" },
                      ]}
                    >
                      <ThemedText style={styles.studentAvatarText}>{student.avatar}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.studentInfo}>
                    <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                    <ThemedText style={styles.studentRoll}>Roll No: {student.rollNo}</ThemedText>
                  </View>
                  <Switch
                    value={student.present}
                    onValueChange={() => toggleAttendance(student.id)}
                    trackColor={{ false: "#ffcdd2", true: "#d1c4e9" }}
                    thumbColor={student.present ? "#8E54E9" : "#F44336"}
                    ios_backgroundColor="#ffcdd2"
                    style={styles.attendanceSwitch}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton}>
              <LinearGradient
                colors={["#4776E6", "#8E54E9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <ThemedText style={styles.submitButtonText}>Submit Attendance</ThemedText>
                <IconSymbol size={20} name="checkmark.circle.fill" color="#FFFFFF" style={styles.submitIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
  },
  datePickerContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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
    height: "100%",
    alignItems: "center",
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  classCardSubject: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  classCardStudents: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  selectedClassText: {
    color: "#FFFFFF",
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
  attendanceSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
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
})

