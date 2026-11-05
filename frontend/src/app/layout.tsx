import './globals.css';
import '@/features/catalogo/hero-controls.css';
import './page-headings.css';
import '@/features/aprende/activities.css';
export const metadata={title:'Cinemateca',description:'Cine, memoria y formación audiovisual de Boyacá',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
