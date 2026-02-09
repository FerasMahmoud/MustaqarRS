'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomName: string;
  roomNameAr: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  monthlyRate: number;
  cleaningFee: number;
  totalAmount: number;
  paymentMethod: 'stripe' | 'bank_transfer';
  locale: 'en' | 'ar';
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  pageAr: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    direction: 'rtl',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#8B7355',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  receiptNumberBadge: {
    backgroundColor: '#F5F0EB',
    padding: 8,
    marginTop: 10,
    borderRadius: 4,
  },
  receiptNumberText: {
    fontSize: 12,
    color: '#2C1810',
    fontWeight: 'bold',
  },
  paidBadge: {
    backgroundColor: '#22c55e',
    padding: 8,
    marginTop: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  paidText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2C1810',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D4A574',
    paddingBottom: 5,
  },
  table: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0D5C7',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D5C7',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableRowTotal: {
    flexDirection: 'row',
    backgroundColor: '#F5F0EB',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  tableCellLabel: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2C1810',
    width: '40%',
  },
  tableCellValue: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    width: '60%',
  },
  totalLabel: {
    flex: 1,
    padding: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C1810',
    width: '60%',
  },
  totalValue: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C1810',
    width: '40%',
  },
  paymentMethodSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F5F0EB',
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
  },
  paymentMethodLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  paymentMethodValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  footer: {
    marginTop: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0D5C7',
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
  thankYouSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F5F0EB',
    textAlign: 'center',
    borderRadius: 4,
  },
  thankYouText: {
    fontSize: 12,
    color: '#2C1810',
    fontWeight: 'bold',
  },
});

interface ReceiptPDFProps {
  data: ReceiptData;
}

export function ReceiptPDF({ data }: ReceiptPDFProps) {
  const isRtl = data.locale === 'ar';

  // Guest information section
  const guestDetails = [
    {
      label: isRtl ? 'الاسم' : 'Guest Name',
      value: data.guestName,
    },
    {
      label: isRtl ? 'البريد الإلكتروني' : 'Email',
      value: data.guestEmail,
    },
    {
      label: isRtl ? 'الهاتف' : 'Phone',
      value: data.guestPhone,
    },
  ];

  // Booking details section
  const bookingDetails = [
    {
      label: isRtl ? 'الوحدة' : 'Unit',
      value: isRtl ? data.roomNameAr : data.roomName,
    },
    {
      label: isRtl ? 'تاريخ البداية' : 'Check-in Date',
      value: new Date(data.startDate).toLocaleDateString(
        isRtl ? 'ar-SA' : 'en-US'
      ),
    },
    {
      label: isRtl ? 'تاريخ النهاية' : 'Check-out Date',
      value: new Date(data.endDate).toLocaleDateString(
        isRtl ? 'ar-SA' : 'en-US'
      ),
    },
    {
      label: isRtl ? 'المدة' : 'Duration',
      value: `${data.durationDays} ${isRtl ? 'يوم' : 'days'}`,
    },
  ];

  // Payment breakdown
  const rentalAmount = data.totalAmount - (data.cleaningFee || 0);
  const paymentBreakdown = [
    {
      label: isRtl ? 'إيجار الوحدة' : 'Room Rental',
      value: `${rentalAmount.toLocaleString()} SAR`,
    },
  ];

  // Add cleaning fee if applicable
  if (data.cleaningFee > 0) {
    paymentBreakdown.push({
      label: isRtl ? 'رسوم التنظيف' : 'Cleaning Fee',
      value: `${data.cleaningFee.toLocaleString()} SAR`,
    });
  }

  // Payment method display text
  const paymentMethodText = data.paymentMethod === 'stripe'
    ? (isRtl ? 'بطاقة ائتمان (Stripe)' : 'Credit Card (Stripe)')
    : (isRtl ? 'تحويل بنكي' : 'Bank Transfer');

  return (
    <Document>
      <Page size="A4" style={isRtl ? styles.pageAr : styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isRtl ? 'إيصال الدفع' : 'PAYMENT RECEIPT'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isRtl
              ? 'استوديو فاخر في الرياض'
              : 'Luxury Studio Apartment in Riyadh'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isRtl ? 'تاريخ الدفع: ' : 'Payment Date: '}
            {new Date(data.paymentDate).toLocaleDateString(
              isRtl ? 'ar-SA' : 'en-US'
            )}
          </Text>

          {/* Receipt Number Badge */}
          <View style={styles.receiptNumberBadge}>
            <Text style={styles.receiptNumberText}>
              {isRtl ? `رقم الإيصال: ${data.receiptNumber}` : `Receipt #: ${data.receiptNumber}`}
            </Text>
          </View>

          {/* PAID Badge */}
          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>
              {isRtl ? '✓ مدفوع' : '✓ PAID'}
            </Text>
          </View>
        </View>

        {/* Guest Information */}
        <View>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'معلومات الضيف' : 'GUEST INFORMATION'}
          </Text>
          <View style={styles.table}>
            {guestDetails.map((detail, idx) => (
              <View
                key={idx}
                style={
                  idx === guestDetails.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <View style={[styles.tableCellLabel, { width: '35%' }]}>
                  <Text>{detail.label}</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '65%' }]}>
                  <Text>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Booking Details */}
        <View>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'تفاصيل الحجز' : 'BOOKING DETAILS'}
          </Text>
          <View style={styles.table}>
            {bookingDetails.map((detail, idx) => (
              <View
                key={idx}
                style={
                  idx === bookingDetails.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <View style={[styles.tableCellLabel, { width: '35%' }]}>
                  <Text>{detail.label}</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '65%' }]}>
                  <Text>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Breakdown */}
        <View>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'تفاصيل الدفع' : 'PAYMENT BREAKDOWN'}
          </Text>
          <View style={styles.table}>
            {paymentBreakdown.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={[styles.tableCellLabel, { width: '60%' }]}>
                  <Text>{item.label}</Text>
                </View>
                <View style={[styles.tableCellValue, { width: '40%' }]}>
                  <Text>{item.value}</Text>
                </View>
              </View>
            ))}
            {/* Total Row */}
            <View style={styles.tableRowTotal}>
              <View style={[styles.totalLabel, { width: '60%' }]}>
                <Text>{isRtl ? 'الإجمالي المدفوع' : 'TOTAL PAID'}</Text>
              </View>
              <View style={[styles.totalValue, { width: '40%' }]}>
                <Text>{data.totalAmount.toLocaleString()} SAR</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethodSection}>
          <Text style={styles.paymentMethodLabel}>
            {isRtl ? 'طريقة الدفع' : 'Payment Method'}
          </Text>
          <Text style={styles.paymentMethodValue}>
            {paymentMethodText}
          </Text>
        </View>

        {/* Thank You Section */}
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>
            {isRtl
              ? 'شكراً لاختيارك لنا! 🏠'
              : 'Thank you for choosing us! 🏠'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {isRtl
              ? 'هذا الإيصال هو تأكيد رسمي لدفعتك.'
              : 'This receipt is an official confirmation of your payment.'}
          </Text>
          <Text style={{ marginTop: 5 }}>
            {isRtl
              ? 'للاستفسارات: +966531182200 | Firas@fitechco.com'
              : 'For inquiries: +966531182200 | Firas@fitechco.com'}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
