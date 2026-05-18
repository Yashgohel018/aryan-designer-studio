import React from 'react'
import { Link } from 'react-router-dom'
import { FaInstagram, FaWhatsapp, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'

const ENV_WHATSAPP = import.meta.env.VITE_OWNER_WHATSAPP
const OWNER_WHATSAPP = (ENV_WHATSAPP || '+916355220940').replace(/[^0-9]/g, '')
const waLink = `https://wa.me/${OWNER_WHATSAPP}`
const instaLink = 'https://www.instagram.com/krish_aryan__?igsh=MWc1NGdpaGd2d3gwYw=='

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand column */}
          <div>
            <div className="footer-brand-name">Aryan Designer Studio</div>
            <p className="footer-tagline">
              Premium men's fashion crafted with passion.<br />
              Dress sharp. Live bold. Own your style.
            </p>
            <div className="footer-social">
              <a href={instaLink} target="_blank" rel="noreferrer" title="Instagram"><FaInstagram /></a>
              <a href={waLink} target="_blank" rel="noreferrer" title="WhatsApp"><FaWhatsapp /></a>
            </div>
          </div>

          {/* Shop column */}
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              {[
                ['Shirts', 'Shirts'],
                ['T-Shirts', 'T-Shirts'],
                ['Pants', 'Pants'],
                ['Formal Sets', 'Formal Sets'],
                ['Belts', 'Belts'],
                ['Branded Shoes', 'Branded Shoes'],
                ['Watches', 'Watches'],
              ].map(([label, cat]) => (
                <li key={cat}>
                  <Link to={`/products?cat=${encodeURIComponent(cat)}`}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact-item">
              <span><FaPhone /></span>
              <a href="tel:+916355220940">+91 6355220940</a>
            </div>
            <div className="footer-contact-item">
              <span><FaWhatsapp /></span>
              <a href={waLink} target="_blank" rel="noreferrer">WhatsApp Us</a>
            </div>
            <div className="footer-contact-item">
              <span><FaInstagram /></span>
              <a href={instaLink} target="_blank" rel="noreferrer">@krish_aryan_</a>
            </div>
            <div className="footer-contact-item">
              <span><FaMapMarkerAlt /></span>
              <a href="https://share.google/7dLoeKJ0syeFZPmdP" target="_blank" rel="noreferrer">View Location</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} <span className="footer-gold">Aryan Designer Studio</span>. All rights reserved.</span>
          <span>Crafted with love by Krish Gohel</span>
        </div>
      </div>
    </footer>
  )
}
