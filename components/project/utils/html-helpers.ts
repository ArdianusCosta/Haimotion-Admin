export function deeplyDecodeHTML(html: string) {
  if (!html) return '';
  let prev = '';
  let curr = html;
  let maxIters = 5;
  while (prev !== curr && maxIters > 0) {
    prev = curr;
    curr = curr
         .replace(/&amp;/gi, "&")
         .replace(/&lt;/gi, "<")
         .replace(/&gt;/gi, ">")
         .replace(/&quot;/gi, '"')
         .replace(/&#039;/gi, "'")
         .replace(/&nbsp;/gi, " ");
    maxIters--;
  }
  return curr;
}

export function stripHtmlTags(html: string) {
  let decoded = html;
  if (!decoded) return '';
  let iters = 10;
  while (iters > 0) {
    let prev = decoded;
    decoded = decoded.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#039;/gi, "'").replace(/&nbsp;/gi, " ");
    if (prev === decoded) break;
    iters--;
  }
  return decoded.replace(/<[^>]*>?/gm, '').trim();
}
