import { db } from '@/constants/firebaseConfig';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

const PRIMARY_GREEN = '#A8E6A3';
const SECONDARY_GREEN = '#E8FCEB';

export default function CatenaCafeVendors() {
  const [maintenanceVendors, setMaintenanceVendors] = useState<any[]>([]);
  const [commonVendors, setCommonVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch maintenance logs
        const maintSnap = await getDocs(collection(db, 'catenacafemaintenance'));
        const maintData = maintSnap.docs.map(d => d.data());
        setMaintenanceVendors(maintData);
        // Build set of vendorName/vendorPhone in maintenance logs
        const maintVendorNames = new Set(maintData.map(m => m.vendorName));
        const maintVendorPhones = new Set(maintData.map(m => m.vendorPhone));
        // Fetch all vendors
        const vendorSnap = await getDocs(collection(db, 'catenacafevendors'));
        const vendorData = vendorSnap.docs.map(d => d.data());
        // Common vendors: not in maintenance logs by name or phone
        const common = vendorData.filter(v =>
          (!maintVendorNames.has(v.name)) && (!maintVendorPhones.has(v.contact))
        );
        setCommonVendors(common);
      } catch (e) {
        Alert.alert('Error', 'Failed to fetch vendor data.');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // PDF generation helpers
  const generateMaintenanceVendorsHTML = () => {
    return `
      <h2>Maintenance Vendors</h2>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Vendor Name</th>
            <th>Phone</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Description</th>
            <th>Room</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${maintenanceVendors.map(v => `
            <tr>
              <td>${v.vendorName || ''}</td>
              <td>${v.vendorPhone || ''}</td>
              <td>${v.paymentMode || ''}</td>
              <td>${v.status || ''}</td>
              <td>${v.desc || ''}</td>
              <td>${v.room || ''}</td>
              <td>${v.createdAt && v.createdAt.toDate ? v.createdAt.toDate().toLocaleDateString() : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateCommonVendorsHTML = () => {
    return `
      <h2>Common Vendors</h2>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          ${commonVendors.map(v => `
            <tr>
              <td>${v.name || ''}</td>
              <td>${v.contact || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const handleDownloadPDF = async (type: 'maintenance' | 'common') => {
    try {
      let html = '';
      let filename = '';
      if (type === 'maintenance') {
        html = generateMaintenanceVendorsHTML();
        filename = 'catena_maintenance_vendors.pdf';
      } else {
        html = generateCommonVendorsHTML();
        filename = 'catena_common_vendors.pdf';
      }
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF', UTI: 'com.adobe.pdf' });
      } else {
        // fallback: save to downloads
        const dest = FileSystem.documentDirectory + filename;
        await FileSystem.copyAsync({ from: uri, to: dest });
        Alert.alert('PDF Saved', 'PDF saved to device documents folder.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate or share PDF.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6fa' }}>
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          </View>
        ) : (
          <>
            <View style={styles.sectionContainer}>
              <Text style={styles.title}>Maintenance Vendors</Text>
              <VendorTable data={maintenanceVendors} />
              <Button 
                icon="download" 
                mode="contained" 
                style={styles.pdfBtn} 
                textColor="#fff"
                onPress={() => handleDownloadPDF('maintenance')}>
                Download as PDF
              </Button>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.title}>Common Vendors</Text>
              <CommonVendorTable data={commonVendors} />
              <Button 
                icon="download" 
                mode="contained" 
                style={styles.pdfBtn} 
                textColor="#fff"
                onPress={() => handleDownloadPDF('common')}>
                Download as PDF
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VendorTable({ data }: { data: any[] }) {
  return (
    <View style={styles.table}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.tableContent}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { minWidth: 120 }]}>Vendor Name</Text>
            <Text style={[styles.tableHeaderCell, { minWidth: 100 }]}>Phone</Text>
            <Text style={[styles.tableHeaderCell, { minWidth: 100 }]}>Payment</Text>
            <Text style={[styles.tableHeaderCell, { minWidth: 100 }]}>Status</Text>
            <Text style={[styles.tableHeaderCell, { minWidth: 150 }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { minWidth: 80 }]}>Room</Text>
            <Text style={[styles.tableHeaderCell, { minWidth: 100 }]}>Date</Text>
          </View>
          {data.length === 0 && <Text style={{ color: '#888', marginVertical: 8, paddingHorizontal: 16 }}>No maintenance vendors found.</Text>}
          {data.map((v, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { minWidth: 120 }]}>{v.vendorName}</Text>
              <Text style={[styles.tableCell, { minWidth: 100 }]}>{v.vendorPhone}</Text>
              <Text style={[styles.tableCell, { minWidth: 100 }]}>{v.paymentMode}</Text>
              <Text style={[styles.tableCell, { minWidth: 100 }]}>{v.status}</Text>
              <Text style={[styles.tableCell, { minWidth: 150 }]}>{v.desc}</Text>
              <Text style={[styles.tableCell, { minWidth: 80 }]}>{v.room}</Text>
              <Text style={[styles.tableCell, { minWidth: 100 }]}>{v.createdAt && v.createdAt.toDate ? v.createdAt.toDate().toLocaleDateString() : ''}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CommonVendorTable({ data }: { data: any[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Name</Text>
        <Text style={styles.tableHeaderCell}>Phone</Text>
      </View>
      {data.length === 0 && <Text style={{ color: '#888', marginVertical: 8 }}>No common vendors found.</Text>}
      {data.map((v, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableCell}>{v.name}</Text>
          <Text style={styles.tableCell}>{v.contact}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: 800,
  },
  tableContent: {
    minWidth: '100%',
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: '#111',
    paddingHorizontal: 8,
    textAlign: 'center'
  },
  table: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 20, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  tableHeader: { 
    flexDirection: 'row', 
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: PRIMARY_GREEN,
    borderBottomWidth: 1, 
    borderColor: SECONDARY_GREEN
  },
  tableHeaderCell: { 
    fontWeight: 'bold', 
    color: '#111', 
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 8
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1, 
    borderColor: '#eee',
    backgroundColor: '#fff'
  },
  tableCell: { 
    color: '#333', 
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 8
  },
  pdfBtn: { 
    alignSelf: 'flex-end', 
    marginBottom: 24,
    marginTop: 8,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
    paddingHorizontal: 16
  },
}); 