const fs = require('fs');
const path = 'components/northstar-dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldRender = `{financeMenu.map(({ label, icon }) => <button key={label} onClick={() => handleNavigate(label)} className={\`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors \${section === label ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}\`}><Icon icon={icon} className="size-4 shrink-0" />{!effectiveCollapsed && <span className="flex-1 text-left">{t(label)}</span>}</button>)}`;

const newRender = `{financeMenu.map(({ label, icon, subItems }) => {
                const isOpen = openGroups[label] || false;
                const isSubActive = subItems?.some(s => s.label === section);
                const isGroupActive = section === label || isSubActive;
                return (
                  <div key={label} className="flex flex-col gap-1">
                    <button 
                      onClick={() => subItems ? setOpenGroups({...openGroups, [label]: !isOpen}) : handleNavigate(label)} 
                      className={\`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors \${isGroupActive ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}\`}
                    >
                      <Icon icon={icon} className="size-4 shrink-0" />
                      {!effectiveCollapsed && <span className="flex-1 text-left">{t(label)}</span>}
                      {subItems && !effectiveCollapsed && (
                        <svg className={\`size-4 shrink-0 transition-transform \${isOpen ? 'rotate-90' : ''}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      )}
                    </button>
                    {subItems && isOpen && !effectiveCollapsed && (
                      <div className="flex flex-col gap-1 pl-9 pr-3">
                        {subItems.map((sub) => (
                          <button
                            key={sub.label}
                            onClick={() => handleNavigate(sub.label)}
                            className={\`flex items-center rounded-lg px-2 py-2 text-sm transition-colors \${section === sub.label ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}\`}
                          >
                            <span className="flex-1 text-left truncate">{t(sub.label)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}`;

code = code.replace(oldRender, newRender);

const stateHook = `const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Penjualan': true })`;
code = code.replace('const [mobileMenuOpen, setMobileMenuOpen] = useState(false)', `const [mobileMenuOpen, setMobileMenuOpen] = useState(false)\n  ${stateHook}`);

fs.writeFileSync(path, code);
