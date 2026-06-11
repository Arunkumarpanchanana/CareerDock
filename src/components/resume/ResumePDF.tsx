'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { ResumeFormData } from '@/lib/resume'
import type { Profile } from '@/types/database'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/Helvetica.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helvetica/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 54,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: '#555',
    marginBottom: 4,
  },
  contacts: {
    fontSize: 8,
    color: '#666',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  expBlock: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  expTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  expCompany: {
    fontSize: 9,
    color: '#333',
  },
  date: {
    fontSize: 8,
    color: '#666',
  },
  bulletList: {
    marginTop: 2,
    paddingLeft: 14,
  },
  bullet: {
    fontSize: 9,
    marginBottom: 1,
  },
  desc: {
    fontSize: 9,
    marginTop: 1,
  },
  tech: {
    fontSize: 8,
    color: '#555',
    marginTop: 1,
  },
  skillsLine: {
    fontSize: 9,
  },
  eduBlock: {
    marginBottom: 8,
  },
  projBlock: {
    marginBottom: 8,
  },
  certBlock: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
})

export function ResumePDFDocument({
  profile,
  data,
}: {
  profile: Profile | null
  data: ResumeFormData
}) {
  const name = profile?.full_name || 'Resume'
  const contacts = [
    profile?.email,
    profile?.phone,
    profile?.linkedin?.replace(/^https?:\/\//, ''),
    profile?.website?.replace(/^https?:\/\//, ''),
  ].filter(Boolean) as string[]

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {profile?.location && profile?.role_title ? (
            <Text style={styles.meta}>
              {profile.location} | {profile.role_title}
            </Text>
          ) : profile?.location ? (
            <Text style={styles.meta}>{profile.location}</Text>
          ) : profile?.role_title ? (
            <Text style={styles.meta}>{profile.role_title}</Text>
          ) : null}
          {contacts.length > 0 && (
            <Text style={styles.contacts}>{contacts.join('  ·  ')}</Text>
          )}
        </View>

        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.desc}>{data.summary}</Text>
          </View>
        )}

        {data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experience.map((exp, i) => {
              const bullets = exp.bullets.filter((b) => b.trim())
              return (
                <View key={i} style={styles.expBlock}>
                  <View style={styles.expHeader}>
                    <View>
                      <Text style={styles.expTitle}>{exp.role}</Text>
                      <Text style={styles.expCompany}>{exp.company}</Text>
                    </View>
                    <Text style={styles.date}>
                      {exp.start_date} – {exp.end_date || 'Present'}
                    </Text>
                  </View>
                  {bullets.length > 0 && (
                    <View style={styles.bulletList}>
                      {bullets.map((b, j) => (
                        <Text key={j} style={styles.bullet}>• {b}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}

        {data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={styles.eduBlock}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.expTitle}>{edu.institution}</Text>
                    <Text style={styles.expCompany}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.date}>{edu.year}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={styles.projBlock}>
                <Text style={styles.expTitle}>{proj.name}</Text>
                {proj.description && (
                  <Text style={styles.desc}>{proj.description}</Text>
                )}
                {proj.tech_stack && (
                  <Text style={styles.tech}>Technologies: {proj.tech_stack}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillsLine}>{data.skills.join(', ')}</Text>
          </View>
        )}

        {data.certificates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificates</Text>
            {data.certificates.map((cert, i) => (
              <View key={i} style={styles.certBlock}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.expTitle}>{cert.name}</Text>
                    <Text style={styles.expCompany}>{cert.issuer}</Text>
                  </View>
                  <Text style={styles.date}>{cert.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
