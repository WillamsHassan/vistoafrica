import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import CookieConsent from '../components/CookieConsent'
import { getAnalyticsConsent, startAnalyticsSession, trackEvent, trackPageView } from '../services/analytics'

const PublicLayout = () => {
  const location = useLocation()
  const [analyticsAccepted, setAnalyticsAccepted] = useState(getAnalyticsConsent())

  useEffect(() => {
    if (!analyticsAccepted) return
    startAnalyticsSession(location.pathname)
    trackPageView(location.pathname)
    if (location.pathname.startsWith('/cours-')) trackEvent('COURSE_VIEW', location.pathname, { course: location.pathname.slice(1) })
  }, [analyticsAccepted, location.pathname])

  return (
    <div className="min-h-screen bg-brand-cream text-slate-900">
      <Navbar />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pt-24"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />
      <CookieConsent onChange={setAnalyticsAccepted} />
    </div>
  )
}

export default PublicLayout
