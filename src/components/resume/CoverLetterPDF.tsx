'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Profile } from '@/types/database'

const styles = StyleSheet.create({
  page: {
    padding: 54,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: '#555',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    marginBottom: 12,
    color: '#555',
  },
  recipient: {
    fontSize: 10,
    marginBottom: 20,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.7,
  },
  signature: {
    marginTop: 32,
    fontSize: 10,
  },
})

export function CoverLetterPDFDocument({
  profile,
  content,
  jobTitle,
  company,
}: {
  profile: Profile | null
  content: string
  jobTitle: string
  company: string
}) {
  const name = profile?.full_name || 'Applicant'
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {profile?.email && <Text style={styles.contact}>{profile.email}</Text>}
          {profile?.phone && <Text style={styles.contact}>{profile.phone}</Text>}
          {profile?.location && <Text style={styles.contact}>{profile.location}</Text>}
        </View>

        <Text style={styles.date}>{today}</Text>

        <View style={styles.recipient}>
          <Text>Hiring Manager</Text>
          <Text>{company}</Text>
        </View>

        <View style={styles.body}>
          {content.split('\n\n').map((paragraph, i) => (
            <Text key={i} style={{ marginBottom: 8 }}>{paragraph}</Text>
          ))}
        </View>

        <View style={styles.signature}>
          <Text>Sincerely,</Text>
          <Text>{name}</Text>
        </View>
      </Page>
    </Document>
  )
}
