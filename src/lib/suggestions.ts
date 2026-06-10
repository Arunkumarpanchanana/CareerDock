export const SUGGESTED_SKILLS: Record<string, string[]> = {
  Frontend: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Vue.js', 'Angular', 'Redux', 'GraphQL', 'REST APIs', 'Webpack', 'Vite', 'Jest', 'Cypress'],
  Backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Express', 'Django', 'Spring Boot', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL'],
  DevOps: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'GitHub Actions', 'Terraform', 'Ansible', 'Linux', 'Nginx', 'Prometheus', 'Grafana'],
  Data: ['SQL', 'Python', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'Tableau', 'Power BI', 'Apache Spark', 'Airflow'],
  Mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo'],
  Tools: ['Git', 'VS Code', 'Figma', 'Jira', 'Confluence', 'Notion', 'Slack', 'Postman'],
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
]

export const PREBUILT_SKILLS = Object.values(SUGGESTED_SKILLS).flat()
