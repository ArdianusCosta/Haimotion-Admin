import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  Shield,
  Lock,
  FileText,
  CheckCircle2,
  Building2,
  Users,
  HardDrive,
  ExternalLink,
  Mail,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Eye,
  Server,
  Database,
  Globe,
  AlertCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — HaiMotion ERP',
  description: 'Official Privacy Policy and Data Protection Information for HaiMotion ERP enterprise platform.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = 'November 3, 2026'

  const sections = [
    { id: 'introduction', title: '1. Introduction & Overview' },
    { id: 'information-collected', title: '2. Information We Collect' },
    { id: 'how-we-use', title: '3. How We Use Information' },
    { id: 'google-oauth-drive', title: '4. Google OAuth & Google Drive Integration' },
    { id: 'storage-security', title: '5. Data Storage, Security & Access Control' },
    { id: 'third-party', title: '6. Third-Party Services' },
    { id: 'retention-deletion', title: '7. Data Retention & Deletion Policy' },
    { id: 'user-rights', title: '8. User Rights & Data Subject Choices' },
    { id: 'policy-changes', title: '9. Changes to This Policy' },
    { id: 'contact-us', title: '10. Contact Us' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <div className="relative size-9 rounded-xl overflow-hidden shadow-sm border border-border/50 bg-card">
                <Image
                  src="/logohm.jpeg"
                  alt="HaiMotion Logo"
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-none text-foreground">
                  HaiMotion
                </span>
                <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
                  Enterprise Resource Planning
                </span>
              </div>
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-border/80 mx-2" />
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Privacy Policy
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
              <span>Back to App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative border-b border-border/60 bg-gradient-to-b from-muted/40 via-muted/10 to-background py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Shield className="size-3.5" />
              Official Compliance Document
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              HaiMotion ERP Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              This Privacy Policy explains how HaiMotion collects, uses, protects, and handles information across our enterprise resource planning systems, internal project tools, and connected third-party integrations.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Last Updated: <strong className="text-foreground">{lastUpdated}</strong></span>
              </div>
              <span className="size-1 rounded-full bg-muted-foreground/40" />
              <div className="flex items-center gap-1.5">
                <Globe className="size-3.5" />
                <span>Application Domain: <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">dashboardv2.haimotion.com</code></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Table of Contents - Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/60">
                <FileText className="size-4 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Table of Contents
                </h2>
              </div>
              <nav className="space-y-1 text-sm">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <span className="truncate">{section.title}</span>
                    <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-5 border-t border-border/60">
                <div className="rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-primary" />
                    Data Protection Contact
                  </div>
                  <p>Have questions regarding your rights or our data practices?</p>
                  <a
                    href="mailto:contact.haimotion@gmail.com"
                    className="font-mono text-primary hover:underline block truncate font-medium"
                  >
                    contact.haimotion@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Policy Text - Main Column */}
          <article className="lg:col-span-8 space-y-12 text-sm sm:text-base leading-relaxed text-muted-foreground">

            {/* Section 1 */}
            <section id="introduction" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Introduction & Overview
                </h2>
              </div>
              <p>
                Welcome to <strong>HaiMotion ERP</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Application&rdquo;), operated by <strong>PT. Hai Motion Kreatif</strong> (&ldquo;HaiMotion&rdquo;), accessible via <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">https://dashboardv2.haimotion.com</code>.
              </p>
              <p>
                HaiMotion ERP is an integrated enterprise management platform designed to streamline internal company operations, including collaborative task tracking, client relationship management (CRM), project coordination, financial and invoicing records, team calendar scheduling, and resource administration.
              </p>
              <p>
                This Privacy Policy outlines how personal and corporate data is collected, stored, processed, and safeguarded when authorized users access or interact with the platform. By accessing or using HaiMotion ERP, you acknowledge the practices described herein.
              </p>
            </section>

            {/* Section 2 */}
            <section id="information-collected" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Information We Collect
                </h2>
              </div>
              <p>
                We only collect data necessary to provide effective enterprise workflow services. The categories of information collected include:
              </p>

              <div className="grid gap-3 pt-2">
                <div className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Users className="size-4 text-primary" />
                    <span>A. User Account & Authentication Information</span>
                  </div>
                  <p className="text-sm">
                    When user accounts are provisioned or when users sign in, we process basic profile information including full name, business email address, job title, company division/department, role privileges, and authentication tokens (either via direct password credentials or Google Single Sign-On).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Building2 className="size-4 text-primary" />
                    <span>B. Enterprise Operational & Project Data</span>
                  </div>
                  <p className="text-sm">
                    In the normal course of using ERP modules, users create and store operational data including:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Projects & Tasks:</strong> Task titles, descriptions, assignees, deadlines, progress stages, and project attachments.</li>
                    <li><strong>CRM & Clients:</strong> Client names, corporate email addresses, phone contacts, service requirements, and communication notes.</li>
                    <li><strong>Finance & Billing:</strong> Accounts, ledger entries, invoice drafts, payment records, and financial statement summaries.</li>
                    <li><strong>Human Resources:</strong> Internal team directories, operational roles, and divisional hierarchies.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Server className="size-4 text-primary" />
                    <span>C. Technical Logs & Audit Trails</span>
                  </div>
                  <p className="text-sm">
                    To maintain data integrity and security, our system logs operational activities (such as login timestamps, record creations, task updates, and document exports). Logs record the acting user ID, action type, description, and timestamp.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="how-we-use" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  How We Use Your Information
                </h2>
              </div>
              <p>
                Information collected in HaiMotion ERP is used strictly for enterprise business execution. We do not sell, rent, or monetize your personal or business data. Data is used exclusively for:
              </p>
              <ul className="space-y-2.5 pt-1">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>Authenticating and verifying identities:</strong> Ensuring that only authorized team members access designated organizational workspaces.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>Providing core ERP workflows:</strong> Managing production pipelines, monitoring deadlines, dispatching internal notifications, and calculating financial summaries.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>Security, auditability, and fraud prevention:</strong> Tracking administrative changes, detecting unauthorized access attempts, and preserving compliance audit logs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-1" />
                  <span><strong>System maintenance and technical diagnostics:</strong> Identifying platform errors, ensuring performance reliability, and optimizing user experience.</span>
                </li>
              </ul>
            </section>

            {/* Section 4 - Crucial for Google OAuth Verification */}
            <section id="google-oauth-drive" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Google OAuth & Google Drive Integration
                </h2>
              </div>
              <p>
                HaiMotion ERP integrates with Google APIs to deliver streamlined authentication and optional cloud storage capabilities. We maintain strict compliance with Google&apos;s data security standards.
              </p>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Lock className="size-4 text-primary" />
                  <span>Google User Data Compliance Statement</span>
                </div>
                <p className="text-sm">
                  HaiMotion ERP&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Google API Services User Data Policy
                    <ExternalLink className="size-3" />
                  </a>
                  , including the Limited Use requirements.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-base font-semibold text-foreground">
                  A. Google Single Sign-On (OAuth 2.0 Authentication)
                </h3>
                <p className="text-sm">
                  When users choose to sign in using their Google Workspace or Google account, we request the standard OAuth scopes (<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">openid</code>, <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">profile</code>, and <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">email</code>). This data is strictly used to verify user identity, match the user with their active employee profile, and populate basic profile fields (name and display photo).
                </p>

                <h3 className="text-base font-semibold text-foreground">
                  B. Google Drive Integration (Scopes & Permissions)
                </h3>
                <p className="text-sm">
                  HaiMotion ERP supports optional Google Drive integration designed for enterprise file handling and deliverable attachments. When enabled by users:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    <strong>Scoped, User-Initiated Access:</strong> Google Drive permissions are used solely to allow authorized users to select, link, or export project deliverables, creative assets, and invoice PDFs directly to or from their designated Google Drive folders.
                  </li>
                  <li>
                    <strong>No Broad File Scanning:</strong> HaiMotion ERP never scans, reads, or indexes personal files outside of the specific items or folders explicitly authorized or selected by the user.
                  </li>
                  <li>
                    <strong>No Third-Party Sharing:</strong> We do not transfer, sell, or disclose Google Drive file contents or metadata to third parties, advertising brokers, or unauthorized external entities.
                  </li>
                  <li>
                    <strong>No AI/ML Training on Google Data:</strong> Information received via Google APIs and Google Drive is <strong>never</strong> used to train, retrain, or fine-tune generalized machine learning models or artificial intelligence systems.
                  </li>
                </ul>

                <h3 className="text-base font-semibold text-foreground">
                  C. Revocation of Google Permissions
                </h3>
                <p className="text-sm">
                  Users can disconnect their Google account from HaiMotion ERP at any time via their profile settings or directly through the{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Google Security Permissions Dashboard
                    <ExternalLink className="size-3" />
                  </a>.
                  Upon disconnection, HaiMotion ERP immediately stops querying Google APIs on behalf of that account.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="storage-security" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  5
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Data Storage, Security & Access Control
                </h2>
              </div>
              <p>
                We enforce technical, administrative, and physical safeguards designed to prevent unauthorized access, disclosure, alteration, or destruction of corporate information:
              </p>
              <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <Lock className="size-4 text-emerald-500" />
                    <span>Role-Based Access Control (RBAC)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Granular permissions dictate what records each user can view or edit based on division (e.g., Creative, Finance, IT, HR) and rank (Superadmin, Division Admin, Staff).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <Shield className="size-4 text-emerald-500" />
                    <span>Encryption in Transit</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All network traffic between users and HaiMotion ERP is secured using standard TLS (HTTPS), protecting sensitive session tokens and business records against interception.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <Database className="size-4 text-emerald-500" />
                    <span>Secure Database Infrastructure</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Production databases are hosted in isolated network environments with protected credentials, strict connection pooling, and regular encrypted backups.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <Eye className="size-4 text-emerald-500" />
                    <span>Activity Audit Logging</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Administrative actions, user logins, data modifications, and document exports are permanently tracked in internal audit logs for compliance review.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="third-party" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  6
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Third-Party Services
                </h2>
              </div>
              <p>
                To provide high-availability enterprise services, HaiMotion ERP interacts with select trusted infrastructure and service providers:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong>Google Cloud Platform & Google Workspace:</strong> For identity verification (Google Sign-In) and optional Google Drive document integration.
                </li>
                <li>
                  <strong>Cloud Infrastructure & Database Hosting:</strong> Hosting providers providing computational capacity, secure database instances, and network delivery.
                </li>
                <li>
                  <strong>Firebase / Realtime Notification Services:</strong> Used to deliver instantaneous in-app alerts, calendar reminders, and task status notifications to users.
                </li>
              </ul>
              <p className="text-sm">
                Each external vendor processes data in accordance with their respective privacy and data processing agreements and is bound to protect confidential information.
              </p>
            </section>

            {/* Section 7 */}
            <section id="retention-deletion" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  7
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Data Retention & Deletion Policy
                </h2>
              </div>
              <p>
                We retain enterprise operational data for as long as necessary to fulfill company contractual agreements, maintain business records, and satisfy legal or tax compliance obligations:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong>Active Accounts:</strong> User account data and operational task logs remain active throughout the employee&apos;s tenure or engagement with HaiMotion.
                </li>
                <li>
                  <strong>Offboarded / Resigned Staff:</strong> When an employee departs, their account status is marked as resigned/inactive, immediately revoking access while preserving historic task audit trails for organizational accountability.
                </li>
                <li>
                  <strong>Data Deletion Requests:</strong> Authorized users or organizational stakeholders may request data review, archival, or permanent deletion by submitting a formal written request to our designated privacy contact.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="user-rights" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  8
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  User Rights & Data Subject Choices
                </h2>
              </div>
              <p>
                Under applicable privacy laws and organizational policy, users have specific rights regarding their personal data:
              </p>
              <ul className="space-y-2 pt-1 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Right of Access:</strong> Request a copy of the personal information stored in your user profile.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Right to Rectification:</strong> Request correction of inaccurate, outdated, or incomplete personal details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Right to Erasure / Revocation:</strong> Request deletion of personal records or disconnect third-party integrations (including Google OAuth permissions) at any time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Right to Object & Restrict Processing:</strong> Request restrictions on specific processing activities where applicable under company policy.</span>
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="policy-changes" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  9
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Changes to This Policy
                </h2>
              </div>
              <p>
                We may periodically update this Privacy Policy to reflect modifications in our enterprise capabilities, third-party API changes, or evolving regulatory standards.
              </p>
              <p>
                When modifications occur, the &ldquo;Last Updated&rdquo; date at the top of this document will be revised accordingly. For material modifications, authorized company administrators will receive an in-app notice or official email dispatch.
              </p>
            </section>

            {/* Section 10 */}
            <section id="contact-us" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  10
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Contact Information
                </h2>
              </div>
              <p>
                If you have questions, feedback, or inquiries concerning this Privacy Policy, our data handling standards, or third-party OAuth integrations, please contact our team:
              </p>

              <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-3">
                <div className="font-semibold text-foreground text-base">
                  PT. Hai Motion Kreatif — Data Protection Office
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 text-primary shrink-0" />
                    <span>Official Privacy Email:</span>
                    <a
                      href="mailto:contact.haimotion@gmail.com"
                      className="font-mono text-primary font-semibold hover:underline"
                    >
                      contact.haimotion@gmail.com
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Globe className="size-4 text-primary shrink-0" />
                    <span>Application URL:</span>
                    <a
                      href="https://dashboardv2.haimotion.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-foreground hover:underline"
                    >
                      https://dashboardv2.haimotion.com
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary shrink-0" />
                    <span>Organization: PT. Hai Motion Kreatif</span>
                  </p>
                </div>
              </div>
            </section>

          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-border/60 bg-muted/20 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="relative size-5 rounded overflow-hidden">
              <Image
                src="/logohm.jpeg"
                alt="HaiMotion Logo"
                fill
                sizes="20px"
                className="object-cover"
              />
            </div>
            <span>&copy; {new Date().getFullYear()} PT. Hai Motion Kreatif. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/privacy-policy" className="text-foreground font-semibold">
              Privacy Policy
            </Link>
            <a
              href="mailto:contact.haimotion@gmail.com"
              className="hover:text-foreground transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

