import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Wrench, Plus, ArrowLeft, TriangleAlert as AlertTriangle, X } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { MaintenanceLog } from '@/types';

export default function MaintenanceScreen() {
  const { user } = useAuth();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [showAddLog, setShowAddLog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [roomOrArea, setRoomOrArea] = useState('');
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (!selectedBranch) {
      router.replace('/branch-selector');
      return;
    }
    fetchMaintenanceLogs();
  }, [selectedBranch]);

  const fetchMaintenanceLogs = async () => {
    if (!selectedBranch) return;

    try {
      const q = query(
        collection(db, 'maintenanceLogs'),
        where('branchId', '==', selectedBranch.id),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MaintenanceLog));
      
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    }
  };

  const handleAddLog = async () => {
    if (!selectedBranch || !user) return;

    if (!roomOrArea.trim() || !issue.trim()) {
      Alert.alert('Error', 'Please fill in room/area and issue description');
      return;
    }

    setLoading(true);
    try {
      const logData: Omit<MaintenanceLog, 'id'> = {
        branchId: selectedBranch.id,
        roomOrArea: roomOrArea.trim(),
        issue: issue.trim(),
        description: description.trim(),
        status: 'pending',
        priority,
        reportedBy: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'maintenanceLogs'), logData);
      
      // Clear form and close modal
      setRoomOrArea('');
      setIssue('');
      setDescription('');
      setPriority('medium');
      setShowAddLog(false);
      
      // Refresh logs
      fetchMaintenanceLogs();
      
      Alert.alert('Success', 'Maintenance log added successfully');
    } catch (error) {
      console.error('Error adding maintenance log:', error);
      Alert.alert('Error', 'Failed to add maintenance log');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBranchSelector = () => {
    setSelectedBranch(null);
    router.replace('/branch-selector');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#F59E0B';
      case 'pending': return '#DC2626';
      default: return '#6B7280';
    }
  };

  if (!selectedBranch) return null;

  const pendingLogs = logs.filter(log => log.status === 'pending');
  const inProgressLogs = logs.filter(log => log.status === 'in-progress');
  const completedLogs = logs.filter(log => log.status === 'completed');

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: selectedBranch.color }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToBranchSelector}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Wrench size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Maintenance - {selectedBranch.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Log Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: selectedBranch.color }]}
          onPress={() => setShowAddLog(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Maintenance Log</Text>
        </TouchableOpacity>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderLeftColor: '#DC2626' }]}>
            <Text style={styles.summaryNumber}>{pendingLogs.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          
          <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.summaryNumber}>{inProgressLogs.length}</Text>
            <Text style={styles.summaryLabel}>In Progress</Text>
          </View>
          
          <View style={[styles.summaryCard, { borderLeftColor: '#059669' }]}>
            <Text style={styles.summaryNumber}>{completedLogs.length}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        {/* Maintenance Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Maintenance Logs</Text>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Wrench size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No maintenance logs yet</Text>
              <Text style={styles.emptySubtext}>Add your first maintenance log to get started</Text>
            </View>
          ) : (
            logs.map(log => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logRoom}>{log.roomOrArea}</Text>
                    <View style={styles.logMeta}>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(log.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(log.priority) }]}>
                          {log.priority.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(log.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(log.status) }]}>
                          {log.status.replace('-', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {log.priority === 'high' && (
                    <AlertTriangle size={20} color="#DC2626" />
                  )}
                </View>
                
                <Text style={styles.logIssue}>{log.issue}</Text>
                
                {log.description && (
                  <Text style={styles.logDescription}>{log.description}</Text>
                )}
                
                <View style={styles.logFooter}>
                  <Text style={styles.logReporter}>Reported by: {log.reportedBy}</Text>
                  <Text style={styles.logDate}>
                    {new Date(log.createdAt.toDate()).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Log Modal */}
      <Modal visible={showAddLog} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Maintenance Log</Text>
              <TouchableOpacity onPress={() => setShowAddLog(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room/Area *</Text>
                <TextInput
                  style={styles.input}
                  value={roomOrArea}
                  onChangeText={setRoomOrArea}
                  placeholder="e.g., Room 101, Lobby, Kitchen"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Issue *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={issue}
                  onChangeText={setIssue}
                  placeholder="Brief description of the issue"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detailed Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Additional details about the issue..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      priority === 'low' && { backgroundColor: '#F0F9F4', borderColor: '#059669' }
                    ]}
                    onPress={() => setPriority('low')}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      priority === 'low' && { color: '#059669' }
                    ]}>
                      Low
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      priority === 'medium' && { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }
                    ]}
                    onPress={() => setPriority('medium')}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      priority === 'medium' && { color: '#F59E0B' }
                    ]}>
                      Medium
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      priority === 'high' && { backgroundColor: '#FEF2F2', borderColor: '#DC2626' }
                    ]}
                    onPress={() => setPriority('high')}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      priority === 'high' && { color: '#DC2626' }
                    ]}>
                      High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleAddLog}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding...' : 'Add Maintenance Log'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flex: 0.3,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  logRoom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  logMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logIssue: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 22,
  },
  logDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  logReporter: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  logDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 0.3,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});