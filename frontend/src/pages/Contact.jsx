import React from 'react'
import { FaWhatsapp, FaInstagram, FaMapMarkerAlt, FaPhone, FaUserCircle } from 'react-icons/fa'

const ENV_WHATSAPP = import.meta.env.VITE_OWNER_WHATSAPP
const OWNER_WHATSAPP = (ENV_WHATSAPP || '+916355220940').replace(/[^0-9]/g, '')
const waLink = `https://wa.me/${OWNER_WHATSAPP}`
const instaLink = 'https://www.instagram.com/krish_aryan__?igsh=MWc1NGdpaGd2d3gwYw=='
const addressLink = 'https://share.google/7dLoeKJ0syeFZPmdP'

export default function Contact() {
  return (
    <>
      {/* Hero */}
      <div className="contact-hero">
        <div className="container">
          <h1 style={{ color: '#fff' }}>Get in Touch</h1>
          <p>We'd love to hear from you. Reach out via any channel below.</p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="contact-page">
        <div className="container">
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-card-icon"><FaWhatsapp /></div>
              <h3>WhatsApp</h3>
              <p>Message us directly on WhatsApp to place an order or ask any question.</p>
              <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm">
                Message on WhatsApp
              </a>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon"><FaInstagram /></div>
              <h3>Instagram</h3>
              <p>Follow @krish_aryan_ for the latest collections, outfit inspiration and drops.</p>
              <a href={instaLink} target="_blank" rel="noreferrer" className="btn btn-dark btn-sm">
                Follow on Instagram
              </a>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon"><FaMapMarkerAlt /></div>
              <h3>Visit Us</h3>
              <p>Find our studio location on Google Maps. Walk-ins welcome during business hours.</p>
              <a href={addressLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                View on Maps
              </a>
            </div>
          </div>

          {/* Owner info */}
          <div style={{ marginTop: '4rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, background: 'var(--black)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--gold)', flexShrink: 0 }}>
              <FaUserCircle />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.3rem' }}>Owner &amp; Designer</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', marginBottom: '0.4rem' }}>Krish Gohel (Krrish Aryan)</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                Founder of Aryan Designer Studio. Passionate about men's fashion and premium craftsmanship.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a href={`tel:+91${OWNER_WHATSAPP}`} className="btn btn-outline btn-sm"><FaPhone style={{ marginRight: '0.4rem' }} />+91 6355220940</a>
                <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm"><FaWhatsapp style={{ marginRight: '0.4rem' }} />WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
