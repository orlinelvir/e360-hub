import Link from "next/link";
// Hemos quitado Instagram, Facebook y Linkedin de aquí
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#030812] border-t border-gray-800/50 pt-20 pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Columna 1: Marca de E360 */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <img src="/logo.png" alt="E360 Logo" className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Capacitación de élite para dueños de negocios multiservicios. Domina el negocio del capital y escala tu agencia con tecnología y respaldo real.
            </p>
            <div className="flex gap-4">
              {/* Iconos SVG Nativos para evitar errores de Lucide */}
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          {/* Columna 2: Plan de Estudios */}
          <div>
            <h4 className="text-white font-bold mb-6">El Instituto</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Inicio</Link></li>
              <li><Link href="/funding" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Capital y Fondeo</Link></li>
              <li><Link href="/credit-repair" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Restauración de Crédito</Link></li>
              <li><Link href="/incorporation" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Estructura Corporativa</Link></li>
              <li><Link href="/crm" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Tecnología CRM</Link></li>
            </ul>
          </div>

          {/* Columna 3: Enlaces Importantes */}
          <div>
            <h4 className="text-white font-bold mb-6">Soporte</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Portal de Estudiantes</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h4 className="text-white font-bold mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <Mail size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>soporte@emprende360.info</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <Phone size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>+1 (862) 424-4738</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">550 Broad St<br/>Newark, NJ 07102, USA</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright - Exclusivo de E360 */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} E360 Hub. Todos los derechos reservados.
          </p>
          <div className="text-gray-600 text-xs font-medium uppercase tracking-widest">
            A Yampiero de Dios Company
          </div>
        </div>
      </div>
    </footer>
  );
}