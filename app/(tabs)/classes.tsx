"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native"

import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { IconSymbol } from "@/components/ui/IconSymbol"

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
    },
    {
      id: 2,
      name: "Class 9-B",
      teacher: "Mrs. Smith",
      students: 28,
      lastAttendance: "2023-04-14",
      attendanceRate: 89,
    },
    {
      id: 3,
      name: "Class 11-C",
      teacher: "Mr. Davis",
      students: 35,
      lastAttendance: "2023-04-13",
      attendanceRate: 94,
    },
    {
      id: 4,
      name: "Class 12-D",
      teacher: "Ms. Wilson",
      students: 25,
      lastAttendance: "2023-04-13",
      attendanceRate: 88,
    },
    {
      id: 5,
      name: "Class 8-A",
      teacher: "Mr. Thompson",
      students: 32,
      lastAttendance: "2023-04-12",
      attendanceRate: 91,
    },
    {
      id: 6,
      name: "Class 7-B",
      teacher: "Mrs. Anderson",
      students: 30,
      lastAttendance: "2023-04-12",
      attendanceRate: 87,
    },
  ]

  const filteredClasses = searchQuery
    ? classes.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.teacher.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : classes

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Classes</ThemedText>
        <ThemedText style={styles.headerSubtitle}>View and manage classes</ThemedText>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <IconSymbol size={20} name="magnifyingglass" color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search classes or teachers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <ThemedView style={styles.statCard}>
          <IconSymbol size={30} name="person.3.fill" color="#4c669f" />
          <ThemedText style={styles.statNumber}>{classes.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Classes</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol size={30} name="person.fill" color="#4c669f" />
          <ThemedText style={styles.statNumber}>{classes.reduce((sum, c) => sum + c.students, 0)}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Students</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol size={30} name="chart.bar.fill" color="#4c669f" />
          <ThemedText style={styles.statNumber}>
            {Math.round(classes.reduce((sum, c) => sum + c.attendanceRate, 0) / classes.length)}%
          </ThemedText>
          <ThemedText style={styles.statLabel}>Avg. Attendance</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.classesContainer}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>All Classes</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <IconSymbol size={20} name="plus" color="#fff" />
            <ThemedText style={styles.addButtonText}>Add Class</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {filteredClasses.map((classItem) => (
          <ThemedView key={classItem.id} style={styles.classCard}>
            <ThemedView style={styles.classHeader}>
              <ThemedView style={styles.classNameContainer}>
                <ThemedText style={styles.className}>{classItem.name}</ThemedText>
                <ThemedText style={styles.classTeacher}>{classItem.teacher}</ThemedText>
              </ThemedView>
              <ThemedView
                style={[
                  styles.attendanceRateBadge,
                  classItem.attendanceRate >= 90
                    ? styles.highAttendance
                    : classItem.attendanceRate >= 80
                      ? styles.mediumAttendance
                      : styles.lowAttendance,
                ]}
              >
                <ThemedText style={styles.attendanceRateText}>{classItem.attendanceRate}%</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.classDetails}>
              <ThemedView style={styles.detailItem}>
                <IconSymbol size={16} name="person.fill" color="#666" />
                <ThemedText style={styles.detailText}>{classItem.students} Students</ThemedText>
              </ThemedView>
              <ThemedView style={styles.detailItem}>
                <IconSymbol size={16} name="calendar" color="#666" />
                <ThemedText style={styles.detailText}>Last: {classItem.lastAttendance}</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.classActions}>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol size={16} name="person.badge.clock.fill" color="#4c669f" />
                <ThemedText style={styles.actionButtonText}>Take Attendance</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol size={16} name="doc.text.fill" color="#4c669f" />
                <ThemedText style={styles.actionButtonText}>View Report</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <IconSymbol size={16} name="pencil" color="#4c669f" />
                <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    width: "31%",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4c669f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  classCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  classTeacher: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  attendanceRateBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    minWidth: 60,
    alignItems: "center",
  },
  highAttendance: {
    backgroundColor: "#e6f7e6",
  },
  mediumAttendance: {
    backgroundColor: "#fff2e6",
  },
  lowAttendance: {
    backgroundColor: "#ffe6e6",
  },
  attendanceRateText: {
    fontWeight: "bold",
    fontSize: 14,
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
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#4c669f",
    marginLeft: 5,
  },
})
