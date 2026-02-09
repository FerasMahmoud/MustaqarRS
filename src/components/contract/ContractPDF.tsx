'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

export interface ContractData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdType: string;
  guestIdNumber: string;
  guestNationality: string;
  roomName: string;
  roomNameAr: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  monthlyRate: number;
  totalAmount: number;
  signatureData?: string; // Base64 PNG from canvas
  termsAccepted: boolean;
  bookingDate: string;
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
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
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  tableCellHeader: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    backgroundColor: '#F5F0EB',
    fontWeight: 'bold',
    color: '#2C1810',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '35%',
    fontWeight: 'bold',
    color: '#2C1810',
  },
  value: {
    width: '65%',
    color: '#333',
  },
  termsSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  termItem: {
    marginBottom: 6,
    paddingLeft: 10,
    fontSize: 9,
    lineHeight: 1.4,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 30,
    textAlign: 'center',
  },
  signatureImage: {
    width: 100,
    height: 60,
    marginBottom: 10,
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
  goldColor: {
    color: '#D4A574',
  },
});

interface ContractPDFProps {
  data: ContractData;
}

export function ContractPDF({ data }: ContractPDFProps) {
  const isRtl = data.locale === 'ar';

  const reservationDetails = [
    {
      label: isRtl ? 'نوع الإيجار' : 'Rent Type',
      value: isRtl ? 'شهري' : 'Monthly',
    },
    {
      label: isRtl ? 'الوحدة' : 'Unit',
      value: isRtl ? data.roomNameAr : data.roomName,
    },
    {
      label: isRtl ? 'تاريخ البداية' : 'Start Date',
      value: new Date(data.startDate).toLocaleDateString(
        isRtl ? 'ar-SA' : 'en-US'
      ),
    },
    {
      label: isRtl ? 'تاريخ النهاية' : 'End Date',
      value: new Date(data.endDate).toLocaleDateString(
        isRtl ? 'ar-SA' : 'en-US'
      ),
    },
    {
      label: isRtl ? 'المدة' : 'Duration',
      value: `${data.durationDays} ${isRtl ? 'يوم' : 'days'}`,
    },
    {
      label: isRtl ? 'الإيجار الشهري' : 'Monthly Rate',
      value: `${data.monthlyRate.toLocaleString()} SAR`,
    },
    {
      label: isRtl ? 'الإجمالي' : 'Total Amount',
      value: `${data.totalAmount.toLocaleString()} SAR`,
    },
  ];

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
    {
      label: isRtl ? 'نوع الهوية' : 'ID Type',
      value: data.guestIdType,
    },
    {
      label: isRtl ? 'رقم الهوية' : 'ID Number',
      value: data.guestIdNumber,
    },
    {
      label: isRtl ? 'الجنسية' : 'Nationality',
      value: data.guestNationality,
    },
  ];

  const contractTerms = [
    isRtl
      ? '١. يخضع عقد الإيجار هذا لقوانين المملكة العربية السعودية ويتم تنفيذه وفقاً لقوانين وأنظمة المملكة.'
      : '1. This rental agreement is subject to the laws of the Kingdom of Saudi Arabia.',
    isRtl
      ? '٢. يتم دفع فترة الإيجار شهرياً. مبلغ الإيجار غير قابل للاسترجاع مرة واحدة بدء الفترة.'
      : '2. The rental period shall be paid monthly. The rental amount is non-refundable once commenced.',
    isRtl
      ? '٣. يجب على الضيف تقديم وثيقة هوية صحيحة للتحقق عند تسجيل الوصول.'
      : '3. The guest must submit a valid identification document for verification at check-in.',
    isRtl
      ? '٤. الصيانة والإصلاحات للعناصر الهيكلية من مسؤولية مالك العقار.'
      : '4. Maintenance of structural elements is the responsibility of the property owner.',
    isRtl
      ? '٥. الإلغاء المبكر يخضع لرسوم غرامة كما محدد في سياسة الإلغاء.'
      : '5. Early cancellation is subject to penalty charges as specified in the Cancellation Policy.',
    isRtl
      ? '٦. الضيف مسؤول عن دفع فواتير الكهرباء والمياه وفقاً للاستخدام العادل.'
      : '6. The guest is responsible for electricity and water bills according to fair usage.',
    isRtl
      ? '٧. الضيف مسؤول عن أي ضرر للعقار يسببه بأفعاله أو إهماله.'
      : '7. The guest is liable for any damage caused by their actions or negligence.',
    isRtl
      ? '٨. تسليم المفاتيح يتم عند تسجيل الوصول والضيف مسؤول عن حفظها.'
      : '8. Key handover occurs at check-in and the guest is responsible for their safekeeping.',
    isRtl
      ? '٩. مبلغ التأمين يعادل إيجار شهر واحد ويتم استرجاعه خلال ١٤ يوم بعد المغادرة.'
      : '9. Security deposit equals one month\'s rent and is refunded within 14 days after check-out.',
    isRtl
      ? '١٠. تأجير العقار من الباطن أو الاستخدام التجاري ممنوع تماماً.'
      : '10. Subletting or commercial use of the property is strictly prohibited.',
    isRtl
      ? '١١. الضيف يوافق على الحفاظ على السلام والهدوء ولا يشارك في أي أنشطة غير قانونية.'
      : '11. The guest agrees to maintain peaceful enjoyment and no illegal activities.',
    isRtl
      ? '١٢. مالك العقار له حق الدخول مع إخطار 24 ساعة للصيانة أو التفتيش.'
      : '12. Property owner reserves the right to enter with 24-hour notice for maintenance.',
    isRtl
      ? '١٣. يمكن تعديل العقد بإخطار كتابي موقع من كلا الطرفين.'
      : '13. The agreement may be amended with written notice signed by both parties.',
  ];

  return (
    <Document>
      <Page size="A4" style={isRtl ? styles.pageAr : styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isRtl ? 'عقد إيجار' : 'RENTAL AGREEMENT'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isRtl
              ? 'استوديو فاخر في الرياض'
              : 'Luxury Studio Apartment in Riyadh'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isRtl ? 'التاريخ: ' : 'Date: '}
            {new Date(data.bookingDate).toLocaleDateString(
              isRtl ? 'ar-SA' : 'en-US'
            )}
          </Text>
        </View>

        {/* Reservation Details */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'تفاصيل الحجز' : 'RESERVATION DETAILS'}
          </Text>
          <View style={styles.table}>
            {reservationDetails.map((detail, idx) => (
              <View
                key={idx}
                style={
                  idx === reservationDetails.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <View
                  style={[
                    styles.tableCell,
                    { width: '40%', fontWeight: 'bold', color: '#2C1810' },
                  ]}
                >
                  <Text>{detail.label}</Text>
                </View>
                <View style={[styles.tableCell, { width: '60%' }]}>
                  <Text>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Guest Information */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'بيانات الضيف' : 'GUEST INFORMATION'}
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
                <View
                  style={[
                    styles.tableCell,
                    { width: '40%', fontWeight: 'bold', color: '#2C1810' },
                  ]}
                >
                  <Text>{detail.label}</Text>
                </View>
                <View style={[styles.tableCell, { width: '60%' }]}>
                  <Text>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Contract Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'شروط العقد' : 'CONTRACT TERMS'}
          </Text>
          {contractTerms.map((term, idx) => (
            <Text key={idx} style={styles.termItem}>
              {term}
            </Text>
          ))}
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>
              {isRtl ? 'توقيع الضيف' : 'Guest Signature'}
            </Text>
            {data.signatureData && (
              <Image
                src={data.signatureData}
                style={styles.signatureImage}
                cache={false}
              />
            )}
            <Text style={{ fontSize: 9, marginTop: 10 }}>
              {new Date(data.bookingDate).toLocaleDateString(
                isRtl ? 'ar-SA' : 'en-US'
              )}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 10, marginBottom: 5 }}>
              {isRtl ? 'توقيع الإدارة' : 'Management Signature'}
            </Text>
            <View style={styles.signatureImage} />
            <Text style={{ fontSize: 9, marginTop: 10 }}>
              {new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {isRtl
              ? 'هذا العقد هو وثيقة رسمية تحكمه قوانين المملكة العربية السعودية'
              : 'This agreement is a formal contract governed by the laws of the Kingdom of Saudi Arabia.'}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
