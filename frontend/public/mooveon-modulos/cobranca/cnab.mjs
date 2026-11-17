// Position-based readers. Sources and supported versions: docs/COBRANCA.md.
// Only normal settlement (06), without adjustments, is eligible for batch posting.
import { assert, integer, date } from '../orcamentos/domain.mjs';
const get = (line, start, end) => line.slice(start - 1, end).trim();
const banks = { '341': 'Itaú', '237': 'Bradesco' };
function linesOf(input) {
  assert(typeof input === 'string' && input.length <= 1000000, 'Arquivo deve ter até 1 MB.');
  const lines = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  assert(lines.length >= 3 && lines.length <= 10000, 'Arquivo vazio ou com quantidade de registros inválida.');
  const length = lines[0].length; assert([240,400].includes(length), 'Layout não reconhecido: esperado CNAB 240 ou 400.');
  assert(lines.every(l=>l.length === length), 'Arquivo truncado ou com registros de tamanhos diferentes.'); return { lines, length };
}
function numeric(line,a,b,label) { const value=get(line,a,b); assert(/^\d+$/.test(value), `${label}: campo numérico inválido.`); return integer(Number(value),label); }
function bankDate(value) { assert(/^\d{6}(\d{2})?$/.test(value),'Data bancária inválida.');const year=value.length===6?'20'+value.slice(4):value.slice(4);return date(`${year}-${value.slice(2,4)}-${value.slice(0,2)}`); }
export function inspectRemittance(input) {
  const {lines,length}=linesOf(input),h=lines[0],isRemittance=length===400?get(h,1,2)==='01':get(h,8,8)==='0'&&get(h,143,143)==='1';
  if(!isRemittance)return null;
  const bank=length===400?get(h,77,79):get(h,1,3);
  return { bankCode: bank, bankName: banks[bank]||`Banco ${bank}`, layout:length, charges:lines.filter(l=>length===400?l[0]==='1':l[7]==='3'&&l[13]==='P').length, records:lines.length };
}
function finishRow(row,extras) {
  row.status=row.occurrence==='06'?'liquidado':'outra_ocorrencia';
  row.reference=`CNAB:${row.ourNumber}:${row.occurrence}:${row.paidDate}:${row.amountCents}`;
  if(extras)row.error='Há juros, descontos, tarifas, abatimentos ou rateio. Confira o demonstrativo e registre manualmente.';
  return row;
}
export function parseCNAB(input) {
  const {lines,length}=linesOf(input),h=lines[0];
  assert(!inspectRemittance(input), 'Este arquivo é uma REMESSA. Ele não comprova pagamentos. Importe o retorno do banco.');
  const bank=length===400?get(h,77,79):get(h,1,3); assert(banks[bank], 'Banco não suportado. Leitores disponíveis: Itaú 341 e Bradesco 237.');
  const rows=length===400?parse400(lines,bank):parse240(lines,bank);
  assert(rows.length>0&&rows.length<=1000,'Importe de 1 a 1.000 ocorrências por vez.');
  // Multiple occurrences for one title need human review (e.g. settlement + reversal).
  const counts=new Map();for(const r of rows){const k=r.account+'|'+r.ourNumber;counts.set(k,(counts.get(k)||0)+1);}
  for(const r of rows)if(counts.get(r.account+'|'+r.ourNumber)>1)r.error='Mais de uma ocorrência do mesmo boleto no arquivo. Confira a sequência no banco.';
  return {layout:`${banks[bank]} · CNAB ${length}`,bankCode:bank,rows};
}
function parse400(lines,bank) {
  const h=lines[0]; assert(get(h,1,2)==='02'&&get(h,3,9)==='RETORNO'&&get(h,10,11)==='01','Cabeçalho não é retorno de cobrança CNAB 400.');
  assert(lines.at(-1)[0]==='9','Trailer CNAB 400 ausente.');
  assert(lines.every((l,n)=>numeric(l,395,400,'Sequência')===n+1),'Sequência dos registros inválida.');
  const rows=[];
  for(let n=1;n<lines.length-1;n++){
    const l=lines[n];assert(['1','3','4','5'].includes(l[0]),`Registro ${l[0]} não suportado no retorno 400.`);if(l[0]!=='1')continue;
    const account=bank==='341'?`${get(l,18,21)}/${get(l,24,28)}-${get(l,29,29)}`:get(l,21,37);
    const ourNumber=bank==='341'?`${get(l,83,85)}/${get(l,86,93)}-${get(l,94,94)}`:get(l,71,82);
    const row={line:n+1,bankCode:bank,account,ourNumber,occurrence:get(l,109,110),paidDate:'',amountCents:0};
    try {
      row.paidDate=bankDate(get(l,111,116));row.amountCents=numeric(l,254,266,'Valor da liquidação');
      const fields=bank==='341'?[[176,188],[215,227],[228,240],[241,253],[267,279],[280,292]]:[[189,201],[215,227],[228,240],[241,253],[267,279],[280,292]];
      let extras=fields.some(([a,b])=>numeric(l,a,b,'Ajustes do título')!==0);if(bank==='237'&&(get(l,105,105)==='R'||!['00',''].includes(get(l,106,107))))extras=true;
      finishRow(row,extras);
    }catch(e){row.error=e.message;row.status='erro';row.reference=`CNAB-LINHA-${n+1}`;}
    rows.push(row);
  }return rows;
}
function parse240(lines,bank) {
  const h=lines[0],last=lines.at(-1);
  assert(get(h,4,8)==='00000'&&get(h,143,143)==='2','Cabeçalho não é retorno CNAB 240.');
  const version=get(h,164,166);assert(version===(bank==='341'?'040':'084'),`Versão ${version} ainda não suportada para este banco. Não houve baixa.`);
  assert(get(last,4,8)==='99999'&&numeric(last,24,29,'Total de registros')===lines.length,'Trailer ou quantidade de registros do arquivo inválida.');
  assert(lines.every(l=>get(l,1,3)===bank),'Arquivo contém códigos de banco diferentes.');
  const rows=[];let lot=null,pending=null,lots=0,seq=0,lotStart=0;
  for(let n=1;n<lines.length-1;n++){
    const l=lines[n],type=l[7],lotId=get(l,4,7);
    if(type==='1') { assert(!lot&&!pending,'Lote anterior incompleto.');assert(get(l,9,9)==='T'&&get(l,10,11)==='01','Lote não é retorno de cobrança.');lot=lotId;lotStart=n;seq=0;lots++;continue; }
    assert(lot===lotId,'Registro fora do lote esperado.');
    if(type==='5'){assert(!pending,'Segmento T sem U correspondente.');assert(numeric(l,18,23,'Total do lote')===n-lotStart+1,'Contagem do lote inválida.');lot=null;continue;}
    assert(type==='3','Tipo de registro não suportado no lote.');assert(numeric(l,9,13,'Sequência no lote')===++seq,'Sequência no lote inválida.');
    const segment=l[13];
    if(segment==='T'){
      assert(!pending,'Segmento T sem U correspondente.');
      pending={line:n+1,bankCode:bank,account:bank==='341'?`${get(l,19,22)}/${get(l,31,35)}-${get(l,37,37)}`:`${get(l,18,22)}/${get(l,24,35)}-${get(l,36,37)}`,ourNumber:bank==='341'?`${get(l,38,40)}/${get(l,41,48)}-${get(l,49,49)}`:get(l,38,57),occurrence:get(l,16,17),fee:numeric(l,199,213,'Tarifas'),paidDate:'',amountCents:0};
    }else if(segment==='U'){
      assert(pending&&get(l,16,17)===pending.occurrence,'Segmentos T/U sem correspondência.');
      try{pending.paidDate=bankDate(get(l,138,145));pending.amountCents=numeric(l,78,92,'Valor liquidado');finishRow(pending,[ [18,32],[33,47],[48,62],[63,77],[108,122],[123,137] ].some(([a,b])=>numeric(l,a,b,'Ajustes')!==0)||(bank==='341'&&pending.fee!==0));}
      catch(e){pending.error=e.message;pending.status='erro';pending.reference=`CNAB-LINHA-${pending.line}`;}
      delete pending.fee;rows.push(pending);pending=null;
    }else{assert(segment==='Y'&&!pending,`Segmento ${segment} não suportado ou fora de ordem.`);}
  }
  assert(!lot&&!pending&&numeric(last,18,23,'Total de lotes')===lots,'Arquivo com lote incompleto.');return rows;
}
