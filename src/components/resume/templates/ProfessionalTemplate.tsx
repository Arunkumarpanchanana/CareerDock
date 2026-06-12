'use client'

import type { Profile } from '@/types/database'
import type { ResumeFormData } from '@/lib/resume'

export function ProfessionalTemplate({ profile, data }: { profile: Profile | null; data: ResumeFormData }) {
  return (
    <div className="p-8" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-xl font-bold text-gray-900">
          {profile?.full_name || 'Your Name'}
        </h1>
        <div className="text-sm text-gray-600 mt-1 space-x-2">
          {profile?.location && <span>{profile.location}</span>}
          {profile?.role_title && <>{profile?.location && <span>|</span>}<span>{profile.role_title}</span></>}
        </div>
        <div className="text-xs text-gray-500 mt-1.5 space-x-3">
          {profile?.email && <span>{profile.email}</span>}
          {profile?.phone && <span>{profile.phone}</span>}
          {profile?.linkedin && <span>{profile.linkedin.replace(/^https?:\/\//, '')}</span>}
          {profile?.website && <span>{profile.website.replace(/^https?:\/\//, '')}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Professional Summary</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
        </section>
      )}

      {/* Experience — FIRST for professionals */}
      {data.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">Experience</h2>
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{exp.role}</h3>
                  <p className="text-sm text-gray-700">{exp.company}</p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap ml-4">{exp.start_date} – {exp.end_date || 'Present'}</p>
              </div>
              {exp.bullets.filter((b) => b.trim()).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {exp.bullets.filter((b) => b.trim()).map((bullet, j) => (
                    <li key={j} className="text-sm text-gray-700 pl-4 relative">
                      <span className="absolute left-0 top-0">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{edu.institution}</h3>
                  <p className="text-sm text-gray-700">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                </div>
                <p className="text-xs text-gray-500">{edu.year}</p>
              </div>
              {edu.gpa && <p className="text-xs text-gray-600 mt-0.5">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">Projects</h2>
          {data.projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-bold text-gray-900">{proj.name}</h3>
                {proj.url && <span className="text-xs text-blue-700">{proj.url.replace(/^https?:\/\//, '')}</span>}
              </div>
              {proj.description && <p className="text-sm text-gray-700 mt-1">{proj.description}</p>}
              {proj.tech_stack && <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Technologies:</span> {proj.tech_stack}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Skills</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{data.skills.join(', ')}</p>
        </section>
      )}

      {/* Certificates */}
      {data.certificates.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">Certificates</h2>
          {data.certificates.map((cert, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{cert.name}</h3>
                  <p className="text-sm text-gray-700">{cert.issuer}</p>
                </div>
                <div className="text-right">
                  {cert.date && <p className="text-xs text-gray-500">{cert.date}</p>}
                  {cert.url && <span className="text-xs text-blue-700">Credential</span>}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {!data.summary && data.experience.length === 0 && data.education.length === 0 && data.projects.length === 0 && data.skills.length === 0 && data.certificates.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-8">Fill in your resume details to see the preview</p>
      )}
    </div>
  )
}
