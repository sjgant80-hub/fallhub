/* FallHub · top nav injector · loaded on every page */
(function(){
  if (window.__fh_nav) return; window.__fh_nav = true;
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  var css = ''
    + '.site-header{position:sticky;top:0;z-index:50;background:rgba(11,10,15,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:14px 32px;display:flex;justify-content:space-between;align-items:center}'
    + '.site-header .brand{display:flex;align-items:center;gap:12px;font-family:var(--serif);font-size:22px;color:var(--creamL);text-decoration:none}'
    + '.site-header .brand .glyph{color:var(--ox2);font-size:24px}'
    + '.site-header .brand .co{color:var(--muted);font-family:var(--mono);font-size:9.5px;letter-spacing:0.16em;margin-left:6px;text-transform:uppercase}'
    + '.site-header .nav{display:flex;gap:22px;font-family:var(--mono);font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase}'
    + '.site-header .nav a{color:var(--dim);text-decoration:none}'
    + '.site-header .nav a:hover, .site-header .nav a.on{color:var(--creamL)}'
    + '@media(max-width:820px){.site-header{padding:10px 16px}.site-header .nav{gap:12px;font-size:9.5px;flex-wrap:wrap;justify-content:flex-end}.site-header .brand{font-size:18px}.site-header .brand .co{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var pages = [
    { href: 'verticals.html',  label: 'Verticals' },
    { href: 'modules.html',    label: 'Modules' },
    { href: 'clients.html',    label: 'For clients' },
    { href: 'investors.html',  label: 'Investors' },
    { href: 'setup.html',      label: 'Get started' }
  ];

  var el = document.createElement('header');
  el.className = 'site-header';
  el.innerHTML = ''
    + '<a href="index.html" class="brand"><span class="glyph">◊</span>FallHub<span class="co">AI-Native Solutions</span></a>'
    + '<nav class="nav">'
    + pages.map(function(p){ return '<a href="'+p.href+'"'+(here===p.href?' class="on"':'')+'>'+p.label+'</a>'; }).join('')
    + '</nav>';

  if (document.body) document.body.insertBefore(el, document.body.firstChild);
  else document.addEventListener('DOMContentLoaded', function(){ document.body.insertBefore(el, document.body.firstChild); });

  // Footer
  var ft = document.createElement('footer');
  ft.className = 'footer';
  ft.innerHTML = '<span class="glyph">◊</span> · <strong style="color:var(--cream)">FallHub</strong> by <a href="https://www.ai-nativesolutions.com/">AI-Native Solutions</a> · <a href="verticals.html">Verticals</a> · <a href="modules.html">Modules</a> · <a href="clients.html">Clients</a> · <a href="investors.html">Investors</a> · <a href="setup.html">Get started</a> · MIT · ◊·κ=1';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(ft); });
  if (document.body && document.readyState !== 'loading') document.body.appendChild(ft);
})();
