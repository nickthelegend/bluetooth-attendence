import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { IconSymbol } from "@/components/ui/IconSymbol"

const { width } = Dimensions.get("window")

export default function DashboardScreen() {
  // Mock data for attendance overview
  const attendanceData = {
    present: 85,
    absent: 12,
    leave: 3,
    total: 100,
    recentClasses: [
      { id: 1, name: "Class 10-A", date: "2023-04-14", present: 28, total: 30 },
      { id: 2, name: "Class 9-B", date: "2023-04-14", present: 25, total: 28 },
      { id: 3, name: "Class 11-C", date: "2023-04-13", present: 32, total: 35 },
      { id: 4, name: "Class 12-D", date: "2023-04-13", present: 22, total: 25 },
    ],
  }

  const calculatePercentage = (present, total) => {
    return Math.round((present / total) * 100)
  }

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return ["#4CAF50", "#81C784"]
    if (percentage >= 75) return ["#FFC107", "#FFD54F"]
    return ["#F44336", "#E57373"]
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#4776E6", "#8E54E9"]} style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.greeting}>Hello, Admin</ThemedText>
          <ThemedText style={styles.date}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(142, 84, 233, 0.1)" }]}>
            <IconSymbol size={24} name="person.fill.checkmark" color="#8E54E9" />
          </View>
          <View style={styles.statInfo}>
            <ThemedText style={styles.statLabel}>Present</ThemedText>
            <ThemedText style={styles.statNumber}>{attendanceData.present}</ThemedText>
            <View style={styles.statPercentage}>
              <ThemedText style={styles.statPercentageText}>
                {calculatePercentage(attendanceData.present, attendanceData.total)}%
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(244, 67, 54, 0.1)" }]}>
            <IconSymbol size={24} name="person.fill.xmark" color="#F44336" />
          </View>
          <View style={styles.statInfo}>
            <ThemedText style={styles.statLabel}>Absent</ThemedText>
            <ThemedText style={styles.statNumber}>{attendanceData.absent}</ThemedText>
            <View style={styles.statPercentage}>
              <ThemedText style={styles.statPercentageText}>
                {calculatePercentage(attendanceData.absent, attendanceData.total)}%
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "rgba(255, 193, 7, 0.1)" }]}>
            <IconSymbol size={24} name="person.fill.questionmark" color="#FFC107" />
          </View>
          <View style={styles.statInfo}>
            <ThemedText style={styles.statLabel}>On Leave</ThemedText>
            <ThemedText style={styles.statNumber}>{attendanceData.leave}</ThemedText>
            <View style={styles.statPercentage}>
              <ThemedText style={styles.statPercentageText}>
                {calculatePercentage(attendanceData.leave, attendanceData.total)}%
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#4776E6", "#8E54E9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <IconSymbol size={24} name="plus.circle.fill" color="#FFFFFF" />
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
              <IconSymbol size={24} name="doc.text.fill" color="#FFFFFF" />
            </LinearGradient>
            <ThemedText style={styles.actionButtonText}>Generate Report</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={["#56ab2f", "#a8e063"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <IconSymbol size={24} name="person.3.fill" color="#FFFFFF" />
            </LinearGradient>
            <ThemedText style={styles.actionButtonText}>Manage Classes</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Attendance</ThemedText>
          <TouchableOpacity style={styles.viewAllButton}>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <IconSymbol size={16} name="chevron.right" color="#8E54E9" />
          </TouchableOpacity>
        </View>

        {attendanceData.recentClasses.map((classItem) => {
          const percentage = calculatePercentage(classItem.present, classItem.total)
          const colors = getAttendanceColor(percentage)
          
          return (
            <View key={classItem.id} style={styles.classCard}>
              <View style={styles.classInfo}>
                <ThemedText style={styles.className}>{classItem.name}</ThemedText>
                <View style={styles.classDetails}>
                  <View style={styles.classDetailItem}>
                    <IconSymbol size={14} name="calendar" color="#666" />
                    <ThemedText style={styles.classDetailText}>{classItem.date}</ThemedText>
                  </View>
                  <View style={styles.classDetailItem}>
                    <IconSymbol size={14} name="person.2.fill" color="#666" />
                    <ThemedText style={styles.classDetailText}>
                      {classItem.present}/{classItem.total} Students
                    </ThemedText>
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
                <ThemedText style={[styles.attendancePercentage, { color: colors[0] }]}>
                  {percentage}%
                </ThemedText>
              </View>
              
              <TouchableOpacity style={styles.viewButton}>
                <ThemedText style={styles.viewButtonText}>View</ThemedText>
                <IconSymbol size={14} name="chevron.right" color="#8E54E9" />
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -30,
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
  },
  classDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
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
})

