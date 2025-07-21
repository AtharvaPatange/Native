import { db } from '@/constants/firebaseConfig';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

const PRIMARY_BROWN = '#8D6748';
const SECONDARY_BROWN = '#CBB292';

export default function OjasVendors() {
  const [maintenanceVendors, setMaintenanceVendors] = useState<any[]>([]);
  const [commonVendors, setCommonVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch maintenance logs
        const maintSnap = await getDocs(collection(db, 'ojasmaintenance'));
        const maintData = maintSnap.docs.map(d => d.data());
        setMaintenanceVendors(maintData);
        // Build set of vendorName/vendorPhone in maintenance logs
        const maintVendorNames = new Set(maintData.map(m => m.vendorName));
        const maintVendorPhones = new Set(maintData.map(m => m.vendorPhone));
        // Fetch all vendors
        const vendorSnap = await getDocs(collection(db, 'ojasvendors'));
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
        filename = 'ojas_maintenance_vendors.pdf';
      } else {
        html = generateCommonVendorsHTML();
        filename = 'ojas_common_vendors.pdf';
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
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Maintenance Vendors</Text>
        {loading ? <ActivityIndicator /> : (
          <>
            <VendorTable data={maintenanceVendors} />
            <Button icon="download" mode="outlined" style={styles.pdfBtn} onPress={() => handleDownloadPDF('maintenance')}>
              Download as PDF
            </Button>
            <Text style={styles.title}>Common Vendors</Text>
            <CommonVendorTable data={commonVendors} />
            <Button icon="download" mode="outlined" style={styles.pdfBtn} onPress={() => handleDownloadPDF('common')}>
              Download as PDF
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VendorTable({ data }: { data: any[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Vendor Name</Text>
        <Text style={styles.tableHeaderCell}>Phone</Text>
        <Text style={styles.tableHeaderCell}>Payment</Text>
        <Text style={styles.tableHeaderCell}>Status</Text>
        <Text style={styles.tableHeaderCell}>Description</Text>
        <Text style={styles.tableHeaderCell}>Room</Text>
        <Text style={styles.tableHeaderCell}>Date</Text>
      </View>
      {data.length === 0 && <Text style={{ color: '#888', marginVertical: 8 }}>No maintenance vendors found.</Text>}
      {data.map((v, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.tableCell}>{v.vendorName}</Text>
          <Text style={styles.tableCell}>{v.vendorPhone}</Text>
          <Text style={styles.tableCell}>{v.paymentMode}</Text>
          <Text style={styles.tableCell}>{v.status}</Text>
          <Text style={styles.tableCell}>{v.desc}</Text>
          <Text style={styles.tableCell}>{v.room}</Text>
          <Text style={styles.tableCell}>{v.createdAt && v.createdAt.toDate ? v.createdAt.toDate().toLocaleDateString() : ''}</Text>
        </View>
      ))}
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#111' },
  table: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, padding: 8, elevation: 1, borderColor: PRIMARY_BROWN },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: SECONDARY_BROWN, paddingBottom: 4, backgroundColor: SECONDARY_BROWN },
  tableHeaderCell: { flex: 1, fontWeight: 'bold', color: '#111', fontSize: 13 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 4 },
  tableCell: { flex: 1, color: '#111', fontSize: 13 },
  pdfBtn: { marginVertical: 8, alignSelf: 'flex-end', backgroundColor: PRIMARY_BROWN },
}); 