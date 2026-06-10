export const SUGGESTED_SKILLS: Record<string, string[]> = {
  Frontend: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Vue.js', 'Angular', 'Redux', 'GraphQL', 'REST APIs', 'Webpack', 'Vite', 'Jest', 'Cypress'],
  Backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Express', 'Django', 'Spring Boot', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL'],
  DevOps: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'GitHub Actions', 'Terraform', 'Ansible', 'Linux', 'Nginx', 'Prometheus', 'Grafana'],
  Data: ['SQL', 'Python', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'Tableau', 'Power BI', 'Apache Spark', 'Airflow'],
  Mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo'],
  Tools: ['Git', 'VS Code', 'Figma', 'Jira', 'Confluence', 'Notion', 'Slack', 'Postman'],
  Leadership: ['Team Leadership', 'Strategic Planning', 'OKR Planning', 'Cross-functional Collaboration', 'Stakeholder Management', 'Agile/Scrum', 'Roadmap Planning', 'Budget Management', 'Vendor Management', 'Risk Management', 'Change Management', 'Conflict Resolution'],
  Management: ['Performance Management', '1:1 Coaching', 'Career Development', 'Hiring & Recruitment', 'Onboarding', 'Resource Planning', 'Sprint Planning', 'Retrospectives', 'KPI Tracking', 'Team Building', 'DEI Initiatives', 'Mentorship Programs'],
  Strategy: ['Product Strategy', 'Go-to-Market Strategy', 'Market Research', 'A/B Testing', 'Data-driven Decision Making', 'Competitive Analysis', 'Business Development', 'P&L Management', 'Revenue Growth', 'Customer Discovery', 'Unit Economics', 'Fundraising'],
}

export const SUGGESTED_BULLETS: Record<string, string[]> = {
  general: [
    'Collaborated with cross-functional teams to deliver projects on time and within scope',
    'Mentored junior developers through code reviews and pair programming sessions',
    'Improved code quality by implementing automated testing and code review processes',
    'Reduced technical debt by refactoring legacy code and improving architecture',
    'Participated in agile ceremonies including daily standups, sprint planning, and retrospectives',
  ],
  frontend: [
    'Built responsive, accessible UI components using React and TypeScript',
    'Optimized bundle size by 40% through code splitting and lazy loading',
    'Implemented state management with Redux/Zustand, reducing prop drilling',
    'Achieved 95+ Lighthouse performance score through performance optimization',
    'Developed reusable component library used across 5+ products',
  ],
  backend: [
    'Designed and implemented RESTful APIs handling 10k+ requests per minute',
    'Optimized database queries reducing response time by 60%',
    'Implemented authentication and authorization using JWT and OAuth 2.0',
    'Built event-driven microservices architecture using message queues',
    'Reduced server costs by 30% through infrastructure optimization',
  ],
  fullstack: [
    'Architected and built full-stack applications from concept to deployment',
    'Implemented end-to-end testing strategy achieving 90% code coverage',
    'Designed database schema and API contracts for new features',
    'Deployed and monitored applications using Docker and cloud services',
    'Led migration of legacy monolith to microservices architecture',
  ],
  leadership: [
    'Led a cross-functional team of 12 engineers, designers, and product managers to deliver 3 major product launches on schedule',
    'Defined and communicated product vision and quarterly OKRs aligned with company-wide strategic initiatives',
    'Established engineering best practices including code review standards, CI/CD pipelines, and on-call rotations',
    'Reduced team attrition by 40% through career development programs, regular 1:1s, and inclusive team culture',
    'Drove 30% improvement in sprint velocity by implementing agile ceremonies and removing process bottlenecks',
  ],
  management: [
    'Managed performance reviews and career growth for a team of 8 direct reports across multiple disciplines',
    'Designed and implemented an onboarding program that reduced ramp-up time for new hires by 50%',
    'Owned quarterly resource planning across 3 squads, balancing feature work with tech debt and incident response',
    'Facilitated retrospectives that drove measurable process improvements quarter over quarter',
    'Partnered with HR to launch a company-wide mentorship program pairing 50+ junior and senior employees',
  ],
  strategy: [
    'Developed and executed a 12-month product roadmap that grew MAU by 200% and revenue by $5M ARR',
    'Conducted competitive analysis and user research to identify high-impact features, prioritized via RICE scoring',
    'Built financial models and unit economics dashboards used by the executive team for strategic decisions',
    'Led due diligence and integration of 2 acquired startups, ensuring smooth technology and team consolidation',
    'Presented quarterly business reviews to the board, translating engineering metrics into business outcomes',
  ],
}

export const SUMMARY_TEMPLATES: { label: string; text: string }[] = [
  {
    label: 'Software Engineer',
    text: 'Results-driven Software Engineer with 3+ years of experience building scalable web applications. Proficient in React, Node.js, and TypeScript with a strong focus on clean architecture and test-driven development. Passionate about delivering high-quality software that solves real-world problems.',
  },
  {
    label: 'Frontend Developer',
    text: 'Creative Frontend Developer with expertise in React, TypeScript, and modern CSS. Experienced in building responsive, accessible, and performant web applications. Strong collaborator with a keen eye for design systems and user experience.',
  },
  {
    label: 'Full Stack Developer',
    text: 'Versatile Full Stack Developer skilled in end-to-end application development using TypeScript, React, Node.js, and PostgreSQL. Proven track record of delivering features from database schema design to polished UI. Advocate for clean code, automated testing, and DevOps best practices.',
  },
  {
    label: 'Data Scientist',
    text: 'Analytical Data Scientist with experience in machine learning, statistical modeling, and data visualization. Proficient in Python, TensorFlow, and SQL. Skilled at translating complex data into actionable business insights and building production-ready ML pipelines.',
  },
  {
    label: 'Engineering Manager',
    text: 'Engineering Manager with 8+ years of experience leading high-performing teams to deliver scalable, customer-facing products. Skilled in agile transformation, talent development, and cross-functional collaboration. Proven track record of shipping complex projects on time while fostering an inclusive, growth-oriented team culture.',
  },
  {
    label: 'Product Manager',
    text: 'Results-oriented Product Manager with 5+ years of experience defining product strategy, prioritizing roadmaps, and delivering user-centric features. Expertise in user research, A/B testing, and data-driven decision making. Adept at aligning engineering, design, and business stakeholders around a shared product vision.',
  },
  {
    label: 'Program Manager',
    text: 'Strategic Program Manager with expertise in driving large-scale, cross-functional initiatives from ideation to completion. Skilled in risk management, resource allocation, and stakeholder communication. Consistently delivers programs on time and within budget while improving operational efficiency across teams.',
  },
  {
    label: 'Team Lead',
    text: 'Experienced Team Lead with a strong background in coaching, sprint execution, and technical delivery. Balances people management with hands-on contribution to unblock teams and maintain code quality. Committed to building psychologically safe teams where every member can do their best work.',
  },
  {
    label: 'Director of Engineering',
    text: 'Director of Engineering with 12+ years of experience scaling engineering organizations from 10 to 100+ people. Expert in organizational design, engineering culture, and strategic planning. Drove 3x revenue growth by aligning engineering execution with business goals and building a world-class technical organization.',
  },
  {
    label: 'VP / Executive',
    text: 'Senior technology executive with 15+ years of experience driving digital transformation and business growth. Proven ability to define technology strategy, manage P&L, and lead large-scale organizations through periods of rapid change. Passionate about building diverse, high-trust teams that deliver outsized business impact.',
  },
]

export const PREBUILT_SKILLS = Object.values(SUGGESTED_SKILLS).flat()
