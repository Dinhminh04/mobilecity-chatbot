import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cửa hàng điện thoại Uy tín - Cam kết giá RẺ | MobileCity',
  description: 'MobileCity - Chuỗi cửa hàng điện thoại chính hãng uy tín tại Việt Nam',
  icons: { icon: 'https://cdn.mobilecity.vn/mobilecity-vn/images/2022/01/mc-logo-15-1.png.webp' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}