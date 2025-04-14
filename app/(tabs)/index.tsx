import { StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { LinearGradient } from 'expo-linear-gradient'

import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { IconSymbol } from "@/components/ui/IconSymbol"

export default function DashboardScreen() {
  // Mock data for attendance overview
  const attendanceData = {
    present: 85,
    absent: 12,
    leave: 3,
    total: 100,
    recentClasses: [
      { id: 1, name: 'Class 10-A', date: '2023-04-14', present: 28, total: 30 },
      { id: 2, name: 'Class 9-B', date: '2023-04-14', present: 25, total: 28 },
      { id: 3, name: 'Class 11-C', date: '2023-04-13', present: 32, total: 35 },
      { id: 4, name: 'Class 12-D', date: '2023-04-13', present: 22, total: 25 },
    ]
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Attendance Overview</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Today's Summary</ThemedText>
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={[styles.statCard, styles.presentCard]}
        >
          <IconSymbol size={40} name="person.fill.checkmark" color="#fff" />
          <ThemedView>
            <ThemedText style={styles.statNumber}>{attendanceData.present}</ThemedText>
            <ThemedText style={styles.statLabel}>Present</ThemedText>
          </ThemedView>
        </LinearGradient>

        <LinearGradient
          colors={['#ff4b1f', '#ff9068']}
          style={[styles.statCard, styles.absentCard]}
        >
          <IconSymbol size={40} name="person.fill.xmark" color="#fff" />
          <ThemedView>
            <ThemedText style={styles.statNumber}>{attendanceData.absent}</ThemedText>
            <ThemedText style={styles.statLabel}>Absent</ThemedText>
          </ThemedView>
        </LinearGradient>

        <LinearGradient
          colors={['#56ab2f', '#a8e063']}
          style={[styles.statCard, styles.leaveCard]}
        >
          <IconSymbol size={40} name="person.fill.questionmark" color="#fff" />
          <ThemedView>
            <ThemedText style={styles.statNumber}>{attendanceData.leave}</ThemedText>
            <ThemedText style={styles.statLabel}>On Leave</ThemedText>
          </ThemedView>
        </LinearGradient>
      </ThemedView>

      <ThemedView style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Recent Attendance</ThemedText>
        <TouchableOpacity>
          <ThemedText style={styles.viewAllText}>View All</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.recentContainer}>
        {attendanceData.recentClasses.map((classItem) => (
          <ThemedView key={classItem.id} style={styles.classCard}>
            <ThemedView style={styles.classInfo}>
              <ThemedText style={styles.className}>{classItem.name}</ThemedText>
              <ThemedText style={styles.classDate}>{classItem.date}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.attendanceInfo}>
              <ThemedText style={styles.attendanceText}>
                {classItem.present}/{classItem.total}
              </ThemedText>
              <ThemedView style={styles.attendanceBar}>
                <ThemedView 
                  style={[
                    styles.attendanceBarFill, 
                    { width: `${(classItem.present / classItem.total) * 100}%` }
                  ]} 
                />
              </ThemedView>
            </ThemedView>
            <TouchableOpacity style={styles.viewButton}>
              <ThemedText style={styles.viewButtonText}>View</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ))}
      </ThemedView>

      <ThemedView style={styles.quickActions}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <ThemedView style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol size={30} name="plus.circle.fill" color="#4c669f" />
            <ThemedText style={styles.actionButtonText}>Take Attendance</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol size={30} name="doc.text.fill" color="#4c669f" />
            <ThemedText style={styles.actionButtonText}>Generate Report</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol size={30} name="person.3.fill" color="#4c669f" />
            <ThemedText style={styles.actionButtonText}>Manage Classes</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  statCard: {
    width: '31%',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  presentCard: {
    backgroundColor: '#4c669f',
  },
  absentCard: {
    backgroundColor: '#ff4b1f',
  },
  leaveCard: {
    backgroundColor: '#56ab2f',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4c669f',
  },
  recentContainer: {
    padding: 15,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  classInfo: {
    flex: 2,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  classDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  attendanceInfo: {
    flex: 2,
    marginHorizontal: 10,
  },
  attendanceText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  attendanceBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  attendanceBarFill: {
    height: '100%',
    backgroundColor: '#4c669f',
    borderRadius: 4,
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  viewButtonText: {
    color: '#4c669f',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActions: {
    padding: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#fff',
    width: '31%',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
})
