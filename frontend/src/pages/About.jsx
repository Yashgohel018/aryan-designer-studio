import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FaTrophy, FaWhatsapp, FaCut } from 'react-icons/fa'

export default function About() {
  const { hash } = useLocation()

  // SEO: page title
  useEffect(() => {
    document.title = 'About Us — Aryan Designer Studio'
    return () => { document.title = 'Aryan Designer Studio' }
  }, [])

  useEffect(() => {
    if (hash === '#story') {
      // Small delay to let the page render fully before scrolling
      setTimeout(() => {
        const el = document.getElementById('story')
        if (el) {
          const navbarHeight = 70
          const skipTopPadding = 4
          const y = el.getBoundingClientRect().top + window.scrollY - navbarHeight + skipTopPadding
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 80)
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [hash])

  return (
    <>
      {/* Hero */}
      <div className="about-hero">
        <div className="container">
          <h1>About <em>Aryan Designer Studio</em></h1>
          <p>Where craftsmanship meets contemporary men's fashion.</p>
        </div>
      </div>

      {/* Story */}
      <section id="story" style={{ padding: '2.2rem 0 5rem', background: 'var(--off-white)', scrollMarginTop: '70px' }}>
        <div className="container about-story">
          <div>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>Our Story</span>
            <h2 style={{ marginTop: '0.75rem', marginBottom: '1.5rem' }}>Crafted for the Modern Man</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              Aryan Designer Studio was born from a simple belief — every man deserves to look and feel exceptional.
              Founded by Krish Gohel (Krrish Aryan), we design and curate premium men's clothing with an
              uncompromising eye for quality, fit, and detail.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, fontSize: '0.95rem' }}>
              From crisp formal shirts to relaxed casual tees, every piece in our collection is thoughtfully
              chosen to help you dress with confidence — whether you're heading to the office or out on the town.
            </p>
          </div>
          <div style={{ background: 'var(--black)', borderRadius: 'var(--radius-lg)', padding: '3rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {[
              { num: '500+', label: 'Happy Customers' },
              { num: '100+', label: 'Unique Styles' },
              { num: '9', label: 'Product Categories' },
              { num: '100%', label: 'Premium Quality' },
            ].map(s => (
              <div key={s.num} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', color: 'var(--gold)' }}>{s.num}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>What we stand for</span>
            <h2 style={{ marginTop: '0.75rem' }}>Our Values</h2>
          </div>
          <div className="about-values-grid">
            {[
              { icon: <FaTrophy />, title: 'Premium Quality', desc: 'We source only the finest fabrics and materials. Every stitch is a commitment to excellence that lasts.' },
              { icon: <FaCut />, title: 'Thoughtful Design', desc: 'Our designs balance timeless elegance with modern minimalism — clothes that work for every occasion.' },
              { icon: <FaWhatsapp />, title: 'Personal Service', desc: 'Order directly via WhatsApp and get a personalized experience from the owner himself.' },
            ].map(v => (
              <div key={v.title} className="about-value-card">
                <div className="about-value-icon">{v.icon}</div>
                <div className="about-value-title">{v.title}</div>
                <p className="about-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
