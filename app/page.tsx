import Link from 'next/link';
import { DM_Serif_Display } from 'next/font/google';
import { K9Logo, KanineBrand } from '@/components/k9-logo';

const serif = DM_Serif_Display({ weight: '400', subsets: ['latin'] });

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] selection:bg-amber-200 selection:text-amber-900">
      {/* ═══════════════ NAV ═══════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between h-20 border-b border-stone-900/5">
            <Link href="/" className="flex items-center gap-2 text-stone-900">
              <KanineBrand />
            </Link>

            <div className="hidden md:flex items-center gap-8 text-[13px] tracking-wide text-stone-500">
              <a href="#features" className="hover:text-stone-900 transition-colors duration-300">Recursos</a>
              <a href="#how" className="hover:text-stone-900 transition-colors duration-300">Metodologia</a>
              <a href="#testimonials" className="hover:text-stone-900 transition-colors duration-300">Casos de Uso</a>
            </div>

            <div className="flex items-center gap-5">
              <Link href="/login" className="text-[13px] text-stone-600 hover:text-stone-900 transition-colors duration-300">
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-[13px] font-semibold text-white bg-stone-900 px-5 py-2.5 rounded-lg hover:bg-stone-800 transition-all duration-300 hover:shadow-lg hover:shadow-stone-900/20"
              >
                Iniciar Análise
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-36 pb-28 md:pt-44 md:pb-36 overflow-hidden">
        {/* Ambient light */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-amber-100/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-orange-50/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          {/* Badge */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-3 text-[12px] tracking-widest uppercase text-stone-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Auditoria Ativa
              </span>
              <span className="text-stone-300">—</span>
              Inteligência K9
            </span>
          </div>

          {/* Headline */}
          <div className="max-w-5xl">
            <h1 className={`${serif.className} text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.02] tracking-tight text-stone-900`}>
              Detecção precisa de<br />
              riscos contratuais<br />
              <span className="text-amber-500">em segundos.</span>
            </h1>
          </div>

          {/* Sub + CTA */}
          <div className="mt-12 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
            <p className="text-stone-500 text-lg leading-relaxed max-w-md">
              Upload do PDF. O motor K9 analisa cláusulas, valida dados e identifica riscos ocultos.
              Auditoria completa com precisão investigativa.
            </p>

            <div className="flex items-center gap-4 shrink-0">
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 px-7 py-4 bg-stone-900 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/15 hover:-translate-y-px"
              >
                Começar Agora
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#how"
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors duration-300 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
              >
                Ver demonstração
              </a>
            </div>
          </div>

          {/* ── Hero visual: Dashboard mockup ── */}
          <div className="mt-20 relative">
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-stone-100 bg-stone-50/80">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                </div>
                <div className="ml-4 flex-1 max-w-xs h-6 rounded-md bg-stone-100 flex items-center px-3">
                  <span className="text-[10px] text-stone-400">kanine.app/dashboard</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 md:p-10 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Analisados', value: '47', color: 'text-stone-900', icon: '🔍' },
                    { label: 'Conformes', value: '32', color: 'text-emerald-600', icon: '✓' },
                    { label: 'Atenção', value: '8', color: 'text-amber-600', icon: '⚠' },
                    { label: 'Críticos', value: '7', color: 'text-red-500', icon: '✕' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-stone-50/80 rounded-xl p-4 border border-stone-100">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-stone-400 uppercase tracking-wider font-medium">{stat.label}</p>
                        <span className="text-xs opacity-50">{stat.icon}</span>
                      </div>
                      <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Contract rows */}
                <div className="space-y-3">
                  {[
                    { name: 'Acordo de Prestação — Silva & Martins', value: 'R$ 142.500,00', status: 'Conforme', statusColor: 'bg-emerald-100 text-emerald-700' },
                    { name: 'NDA Confidencialidade — Tech Corp', value: 'Cláusula 5.3 divergente', status: 'Atenção', statusColor: 'bg-amber-100 text-amber-700' },
                    { name: 'Locação Comercial — Av. Paulista 1200', value: 'R$ 18.000,00/mês', status: 'Conforme', statusColor: 'bg-emerald-100 text-emerald-700' },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between p-4 rounded-xl bg-stone-50/50 border border-stone-100 hover:border-stone-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-stone-200/60 flex items-center justify-center">
                          <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-800">{c.name}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{c.value}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${c.statusColor}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating K9 chat card */}
            <div className="absolute -bottom-8 -right-4 md:right-8 w-72 bg-white rounded-xl border border-stone-200 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)] p-5 animate-float hidden md:block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center relative overflow-hidden">
                  <K9Logo className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-800">Assistente K9</p>
                  <p className="text-[10px] text-stone-400">analisando contrato NDA...</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-stone-50 rounded-lg px-3 py-2 text-[12px] text-stone-600">
                  Há riscos na rescisão?
                </div>
                <div className="bg-amber-50 rounded-lg px-3 py-2 text-[12px] text-amber-800 border border-amber-100">
                  <span className="font-semibold">Alerta:</span> A cláusula 5.3 permite rescisão unilateral sem justa causa. Risco moderado.
                </div>
              </div>
            </div>

            {/* Floating alert */}
            <div className="absolute -top-4 -left-4 md:left-8 bg-white rounded-xl border border-stone-200 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3 animate-float-delayed hidden md:flex">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[12px] text-stone-600">
                K9 detectou <span className="font-semibold text-amber-600">3 pontos de atenção</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="py-28 md:py-36 bg-stone-900 text-white relative overflow-hidden">
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-lg mb-20">
            <span className="text-[12px] tracking-widest uppercase text-amber-400 font-medium">Capacidades</span>
            <h2 className={`${serif.className} text-4xl md:text-5xl mt-4 leading-tight`}>
              Auditoria automatizada<br />com precisão.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {[
              {
                number: '01',
                title: 'Extração Estruturada',
                desc: 'O motor K9 processa PDFs e extrai metadados críticos: partes, valores, datas e vigência com alta fidelidade.',
                accent: 'text-amber-400',
              },
              {
                number: '02',
                title: 'Análise de Risco',
                desc: 'Monitoramento contínuo de cláusulas abusivas, prazos exíguos e obrigações desproporcionais.',
                accent: 'text-red-400',
              },
              {
                number: '03',
                title: 'Busca Semântica',
                desc: 'Questions & Answers contextual. Localize informações específicas instantaneamente através de linguagem natural.',
                accent: 'text-emerald-400',
              },
            ].map((f) => (
              <div key={f.number} className="bg-stone-900 p-8 md:p-10 group hover:bg-stone-800/80 transition-colors duration-500">
                <span className={`text-[11px] font-mono tracking-wider ${f.accent}`}>{f.number}</span>
                <h3 className="text-xl font-semibold mt-4 mb-3">{f.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{f.desc}</p>
                <div className={`w-8 h-px ${f.accent.replace('text-', 'bg-')} mt-6 group-hover:w-16 transition-all duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how" className="py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-20">
            <div>
              <span className="text-[12px] tracking-widest uppercase text-amber-600 font-medium">Fluxo de Trabalho</span>
              <h2 className={`${serif.className} text-4xl md:text-5xl text-stone-900 mt-4`}>
                Simples. Rápido.<br />Eficaz.
              </h2>
            </div>
            <Link
              href="/register"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 self-start md:self-auto"
            >
              Começar agora →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: '01',
                title: 'Upload Seguro',
                desc: 'Envie seus contratos em PDF. Processamento criptografado e seguro.',
                line: true,
              },
              {
                step: '02',
                title: 'Processamento K9',
                desc: 'A IA analisa o documento, estruturando dados e identificando pontos de atenção.',
                line: true,
              },
              {
                step: '03',
                title: 'Gestão Inteligente',
                desc: 'Acesse insights, gerencie vencimentos e consulte o assistente virtual.',
                line: false,
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-bold text-stone-200/80 font-mono">{item.step}</span>
                  {item.line && (
                    <div className="hidden md:block flex-1 h-px bg-stone-200 ml-2" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="py-28 md:py-36 bg-stone-50 border-y border-stone-200/60">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="max-w-lg mb-20">
            <span className="text-[12px] tracking-widest uppercase text-amber-600 font-medium">Feedback</span>
            <h2 className={`${serif.className} text-4xl md:text-5xl text-stone-900 mt-4`}>
              Resultados reais.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'A precisão na detecção de cláusulas complexas superou nossas expectativas. Ferramenta essencial para due diligence.',
                name: 'Roberto Silva',
                role: 'Sócio Diretor',
                company: 'Silva & Associados',
                initials: 'RS',
                bg: 'bg-amber-50',
                initialsBg: 'bg-amber-600',
              },
              {
                quote: 'Reduzimos o tempo de revisão em 70%. O assistente responde perguntas específicas com base no contrato instantaneamente.',
                name: 'Mariana Costa',
                role: 'Jurídico Interno',
                company: 'Tech Corp',
                initials: 'MC',
                bg: 'bg-stone-100',
                initialsBg: 'bg-stone-700',
              },
              {
                quote: 'O monitoramento de vencimentos e renovações automáticas eliminou completamente nossos riscos de perda de prazo.',
                name: 'Fernando Lima',
                role: 'Gerente de Contratos',
                company: 'Grupo Mattos',
                initials: 'FL',
                bg: 'bg-red-50',
                initialsBg: 'bg-red-600',
              },
            ].map((t) => (
              <div key={t.name} className={`${t.bg} rounded-2xl p-8 border border-stone-200/40`}>
                <p className="text-stone-700 text-sm leading-relaxed mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.initialsBg} flex items-center justify-center text-white text-xs font-bold`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{t.name}</p>
                    <p className="text-[11px] text-stone-500">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-28 md:py-36">
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <K9Logo className="w-20 h-20" />
          </div>
          <h2 className={`${serif.className} text-4xl md:text-[3.5rem] text-stone-900 leading-tight`}>
            Segurança e precisão<br />para seus contratos.
          </h2>
          <p className="text-stone-500 text-lg mt-6 mb-12 max-w-md mx-auto">
            Inicie sua conta gratuita hoje. Sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/15 hover:-translate-y-px"
            >
              Criar Conta Gratuita
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/login" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-stone-200/60 py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-800">
            <KanineBrand size="small" />
          </div>
          <p className="text-[12px] text-stone-400">
            © {new Date().getFullYear()} Kanine. Auditoria Inteligente de Contratos.
          </p>
        </div>
      </footer>
    </div>
  );
}
