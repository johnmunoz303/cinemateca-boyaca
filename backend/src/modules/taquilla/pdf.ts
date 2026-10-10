import QRCode from 'qrcode';
export function ticketPdf(ticket:string,lines:string[]){
 const qr=QRCode.create(ticket,{errorCorrectionLevel:'M'}),n=qr.modules.size,scale=250/(n+8);
 const escape=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ').replace(/([\\()])/g,'\\$1');
 let content='BT /F1 18 Tf 40 790 Td (Cinemateca de Boyaca) Tj ET\n';
 lines.forEach((line,i)=>content+=`BT /F1 11 Tf 40 ${755-i*23} Td (${escape(line).slice(0,150)}) Tj ET\n`);
 content+='0 0 0 rg\n';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.modules.get(y,x))content+=`${(40+(x+4)*scale).toFixed(3)} ${(310+(n-y+3)*scale).toFixed(3)} ${scale.toFixed(3)} ${scale.toFixed(3)} re f\n`;
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`];
 let pdf='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(pdf);
}
