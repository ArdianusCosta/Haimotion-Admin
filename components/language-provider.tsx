'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'en' | 'id'

interface Translations {
  [key: string]: string
}

const dictionaries: Record<Language, Translations> = {
  en: {
    Dashboard: 'Dashboard',
    Analytics: 'Analytics',
    Orders: 'Orders',
    Products: 'Products',
    Customers: 'Customers',
    'File Manager': 'File Manager',
    Chat: 'Chat',
    Mail: 'Mail',
    Kanban: 'Kanban',
    Calendar: 'Calendar',
    Project: 'Project',
    Tasks: 'Tasks',
    'My Tasks': 'My Tasks',
    'AI Assistant': 'AI Assistant',
    Layouts: 'Layouts',
    Settings: 'Settings',
    Workspace: 'Workspace',
    Apps: 'Apps',
    'Search anything': 'Search anything',
    'Localization': 'Localization',
    'Manage your timezone and language preferences.': 'Manage your timezone and language preferences.',
    'Language': 'Language',
    'Timezone': 'Timezone',
    'Date Format': 'Date Format',
    'Developer': 'Developer',
    'Setup Project': 'Setup Project',
    'Milestones': 'Milestones',
    'Module Flows': 'Module Flows',
    'Administration': 'Administration',
    'Roles & Permissions': 'Roles & Permissions'
  },
  id: {
    Dashboard: 'Beranda',
    Analytics: 'Analitik',
    Orders: 'Pesanan',
    Products: 'Produk',
    Customers: 'Pelanggan',
    'File Manager': 'Manajer File',
    Chat: 'Obrolan',
    Mail: 'Surat',
    Kanban: 'Kanban',
    Calendar: 'Kalender',
    Project: 'Proyek',
    Tasks: 'Tugas',
    'My Tasks': 'Tugas Saya',
    'AI Assistant': 'Asisten AI',
    Layouts: 'Tata Letak',
    Settings: 'Pengaturan',
    Workspace: 'Ruang Kerja',
    Apps: 'Aplikasi',
    'Search anything': 'Cari apa saja...',
    'Localization': 'Lokalisasi',
    'Manage your timezone and language preferences.': 'Kelola preferensi zona waktu dan bahasa Anda.',
    'Language': 'Bahasa',
    'Timezone': 'Zona Waktu',
    'Date Format': 'Format Tanggal',
    'Developer': 'Pengembang',
    'Setup Project': 'Siapkan Proyek',
    'Milestones': 'Pencapaian',
    'Module Flows': 'Alur Modul',
    'Administration': 'Administrasi',
    'Roles & Permissions': 'Peran & Izin'
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string) => {
    return dictionaries[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
