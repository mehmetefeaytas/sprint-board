/**
 * Etiketler karşılaştırılabilir olsun diye tek bir kurala göre küçültülür:
 * "ACİL", "Acil" ve "acil" aynı etiket sayılmalı.
 *
 * Neden düz `toLowerCase()` yetmiyor: JavaScript'in yerel ayardan bağımsız
 * küçültmesi Türkçe "İ" harfini "i" + birleşen üst nokta (U+0307) çiftine
 * çeviriyor, yani "ACİL" → "aci̇l". Görünüşte doğru, karşılaştırmada yanlış.
 *
 * Neden `toLocaleLowerCase('tr')` de kullanmıyoruz: o da "API" → "apı" yapar.
 * Etiketler serbest metin; İngilizce kısaltma da yazılabilir. Bu yüzden
 * standart küçültmenin ardından yalnızca artık üst nokta atılır — hem "ACİL"
 * hem "API" beklendiği gibi çözülür.
 */
export function normalizeLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\u0307/g, '')
    .replace(/\s+/g, ' ');
}
