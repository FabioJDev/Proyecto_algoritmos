import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="bg-card border-t border-white/5 mt-auto">
            <div className="max-w-[1280px] mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">💎</span>
                            <span className="text-xl font-bold text-white">SmartMarket</span>
                        </Link>
                        <p className="text-text-muted text-sm">
                            La plataforma líder en subastas online. Compra y vende con confianza y seguridad.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Plataforma</h3>
                        <ul className="space-y-2 text-sm text-text-muted">
                            <li><Link to="/" className="hover:text-primary transition-colors">Inicio</Link></li>
                            <li><Link to="/create" className="hover:text-primary transition-colors">Vender</Link></li>
                            <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Soporte</h3>
                        <ul className="space-y-2 text-sm text-text-muted">
                            <li><a href="#" className="hover:text-primary transition-colors">Ayuda</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Síguenos</h3>
                        <div className="flex gap-4">
                            {/* Social Icons (Placeholders) */}
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                <span className="sr-only">Facebook</span>
                                f
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                <span className="sr-only">Twitter</span>
                                t
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                <span className="sr-only">Instagram</span>
                                i
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 mt-12 pt-8 text-center text-sm text-text-muted">
                    <p>&copy; {new Date().getFullYear()} SmartMarket. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    )
}
