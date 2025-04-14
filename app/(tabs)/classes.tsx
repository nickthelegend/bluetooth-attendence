"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View, Dimensions, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { ThemedText } from "@/components/ThemedText"
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export default function ClassesScreen() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for classes
  const classes = [
    {
      id: 1,
      name: "Class 10-A",
      teacher: "Mr. Johnson",
      students: 30,
      lastAttendance: "2023-04-14",
      attendanceRate: 92,
      subject: "Mathematics",
    },
    {
      id: 2,
      name: "Class 9-B",
      teacher: "Mrs. Smith",
      students: 28,
      lastAttendance: "2023-04-14",
      attendanceRate: 89,
      subject: "Science",
    },
    {
      id: 3,
      name: "Class 11-C",
      teacher: "Mr. Davis",
      students: 35,
      lastAttendance: "2023-04-13",
      attendanceRate: 94,
      subject: "English",
    },
    {
      id: 4,
      name: "Class 12-D",
      teacher: "Ms. Wilson",
      students: 25,
      lastAttendance: "2023-04-13",
      attendanceRate: 88,
      subject: "History",
    },
    {
      id: 5,
      name: "Class 8-A",
      teacher: "Mr. Thompson",
      students: 32,
      lastAttendance: "2023-04-12",
      attendanceRate: 91,
      subject: "Geography",
    },
    {
      id: 6,
      name: "Class 7-B",
      teacher: "Mrs. Anderson",
      students: 30,
      lastAttendance: "2023-04-12",
      attendanceRate: 87,
      subject: "Physics",
    },
  ]

  const filteredClasses = searchQuery
    ? classes.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subject.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : classes

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return ["#4CAF50", "#81C784"]
    if (rate >= 75) return ["#FFC107", "#FFD54F"]
    return ["#F44336", "#E57373"]
  }

  // Function to toggle drawer from parent component
  const toggleDrawer = () => {
    // This will be handled by the drawer context in _layout.tsx
    global.toggleDrawer && global.toggleDrawer()
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
            <ThemedText style={styles.statNumber}>{classes.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Classes</ThemedText>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(76, 175, 80, 0.1)" }]}>
              <Ionicons name="people" size={24} color="#4CAF50" />
            </View>
            <ThemedText style={styles.statNumber}>{classes.reduce((sum, c) => sum + c.students, 0)}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Students</ThemedText>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(255, 193, 7, 0.1)" }]}>
              <MaterialIcons name="bar-chart" size={24} color="#FFC107" />
            </View>
            <ThemedText style={styles.statNumber}>
              {Math.round(classes.reduce((sum, c) => sum + c.attendanceRate, 0) / classes.length)}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>Avg. Attendance</ThemedText>
          </View>
        </View>

        <View style={styles.classesContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>All Classes</ThemedText>
            <TouchableOpacity style={styles.addButton}>
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

          {filteredClasses.map((classItem) => {
            const attendanceColors = getAttendanceColor(classItem.attendanceRate)

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
                  <LinearGradient
                    colors={attendanceColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.attendanceRateBadge}
                  >
                    <ThemedText style={styles.attendanceRateText}>{classItem.attendanceRate}%</ThemedText>
                  </LinearGradient>
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
                    <MaterialIcons name="calendar-today" size={16} color="#666" />
                    <ThemedText style={styles.detailText}>Last: {classItem.lastAttendance}</ThemedText>
                  </View>
                </View>

                <View style={styles.classActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <View style={[styles.actionButtonIcon, { backgroundColor: "rgba(142, 84, 233, 0.1)" }]}>
                      <FontAwesome5 name="user-check" size={16} color="#8E54E9" />
                    </View>
                    <ThemedText style={styles.actionButtonText}>Take Attendance</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <View style={[styles.actionButtonIcon, { backgroundColor: "rgba(76, 175, 80, 0.1)" }]}>
                      <MaterialIcons name="description" size={16} color="#4CAF50" />
                    </View>
                    <ThemedText style={styles.actionButtonText}>View Report</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <View style={[styles.actionButtonIcon, { backgroundColor: "rgba(255, 193, 7, 0.1)" }]}>
                      <MaterialIcons name="edit" size={16} color="#FFC107" />
                    </View>
                    <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
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
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  },
  className: {
    fontSize: 18,
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
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  classActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  actionButtonIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#666",
  },
})
