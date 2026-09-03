import fs from 'fs'
let code = fs.readFileSync('./components/project-page.tsx', 'utf-8')

code = code.replace(
  `<div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">`,
  `<div className="min-w-0 flex-1 pr-2">
                      <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors" title={project.name}>{project.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={stripHtmlTags(project.description)}>`
)

code = code.replace(
  `function stripHtmlTags(html: string) {
  const decoded = deeplyDecodeHTML(html);
  return decoded.replace(/<[^>]*>?/gm, '').trim();
}`,
  `function stripHtmlTags(html: string) {
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
}`
)

fs.writeFileSync('./components/project-page.tsx', code)
