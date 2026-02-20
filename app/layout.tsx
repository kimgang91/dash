import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '고캠핑 DB 영업 현황 대시보드',
  description: 'MD별 영업 성과 및 성과급 대상자 선정 대시보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
