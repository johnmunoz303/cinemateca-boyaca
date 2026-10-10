"use client";
import { Film, MapPin, Mail, Phone } from "lucide-react";
export default function Footer() {
    return (<footer>
      <div className="footer-grid">
        <div>
          <div className="brand">
            <Film />
            <span>
              CINEMATECA<small>DE BOYACÁ</small>
            </span>
          </div>
          <p>
            Preservamos la memoria audiovisual de Boyacá y llevamos el cine a
            todos los rincones del departamento.
          </p>
          <div className="socials">
            <span>f</span>
            <span>◎</span>
            <span>▶</span>
            <span>𝕏</span>
          </div>
        </div>
        <div>
          <h3>CONTACTO</h3>
          <p>
            <MapPin />
            Carrera 11 #19-56
            <br />
            Tunja, Boyacá, Colombia
          </p>
          <p>
            <Phone />
            +57 (8) 744 1234
          </p>
          <p>
            <Mail />
            contacto@cinematecadeboyaca.gov.co
          </p>
        </div>
        <div>
          <h3>INFORMACIÓN LEGAL</h3>
          <p>Documentos institucionales</p>
          <p>Política de Privacidad</p>
          <p>Términos de Uso</p>
          <p>Documentos pendientes de validación</p>
        </div>
      </div>
      <small>
        © {new Date().getFullYear()} Cinemateca de Boyacá. Gobierno
        Departamental de Boyacá.
        <br />
        Una iniciativa de: <b>Secretaría de Cultura y Patrimonio</b>
      </small>
    </footer>);
}
