"use client";

import Link from 'next/link';
import { K9Logo } from '@/components/k9-logo';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Zap, Activity, Search, FileText,
  Bell, CheckCircle2, BarChart3, Clock, Users, ChevronDown,
  Star, TrendingUp, Lock, Eye, AlertTriangle, Plus
} from 'lucide-react';

/* ─────────────────── helpers ─────────────────── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-medium text-slate-900 text-[15px] pr-8">{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-5' : 'max-h-0'}`}>
        <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─────────────────── data ─────────────────── */
const features = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Auditoria Automatizada',
    desc: 'Cada contrato é analisado por IA que identifica cláusulas de risco, inconsistências e oportunidades de melhoria.',
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Alertas Inteligentes',
    desc: 'Notificações automáticas sobre vencimentos, obrigações pendentes e mudanças regulatórias.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Dashboards em Tempo Real',
    desc: 'Visão consolidada do portfólio de contratos com métricas de risco, valor e performance.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Compliance Integrado',
    desc: 'Verificações automáticas de conformidade com normas regulatórias e políticas internas da empresa.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Fluxo de Aprovações',
    desc: 'Workflows multi-nível para revisão e aprovação de contratos com rastreabilidade completa.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Contas a Pagar e Receber',
    desc: 'Controle financeiro integrado com visão de fluxo de caixa vinculado a obrigações contratuais.',
  },
];

const testimonials = [
  {
    name: 'Rafael Mendes',
    role: 'Diretor Jurídico, Nexus Corp',
    text: 'Reduzimos em 40% o tempo de revisão de contratos. A auditoria automatizada identificou riscos que nosso time não havia percebido.',
    rating: 5,
  },
  {
    name: 'Carolina Vieira',
    role: 'CFO, Grupo Atria',
    text: 'A visibilidade financeira que o Kanine trouxe para nosso portfólio de contratos mudou completamente nossa gestão de riscos.',
    rating: 5,
  },
  {
    name: 'Pedro Albuquerque',
    role: 'Head de Operações, DataFlow',
    text: 'Integração simples, resultados imediatos. Temos controle total sobre prazos e obrigações desde o primeiro mês.',
    rating: 5,
  },
];

const faqs = [
  { q: 'Existe um período de teste gratuito?', a: 'Sim, oferecemos 14 dias de teste gratuito com acesso completo a todas as funcionalidades. Não é necessário cartão de crédito.' },
  { q: 'Como funciona a auditoria por IA?', a: 'Nosso motor de IA analisa cada cláusula do contrato buscando riscos, inconsistências e oportunidades. O processo leva em média 30 segundos por documento.' },
  { q: 'Posso integrar com meu ERP?', a: 'Sim, oferecemos integrações via API REST com os principais ERPs do mercado como SAP, TOTVS e Oracle.' },
  { q: 'Meus dados estão seguros?', a: 'Todos os dados são criptografados em repouso e em trânsito. Seguimos os padrões SOC 2 Type II e LGPD.' },
  { q: 'Quantos contratos posso gerenciar?', a: 'Não há limite de contratos em nenhum dos planos. A cobrança é baseada no número de usuários da plataforma.' },
];

/* ─────────────────── page ─────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-white text-slate-800 min-h-screen selection:bg-blue-50 selection:text-blue-900 antialiased">

      {/* ═══════════ NAV ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <K9Logo className="w-7 h-7" />
              <span className="text-lg font-bold tracking-tight text-slate-900">Kanine</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-500">
              <a href="#funcionalidades" className="hover:text-slate-900 transition-colors">Funcionalidades</a>
              <a href="#produto" className="hover:text-slate-900 transition-colors">Produto</a>
              <a href="#depoimentos" className="hover:text-slate-900 transition-colors">Depoimentos</a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">
                Entrar
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-slate-900 text-white text-[13px] font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero content: left-aligned like TrustPay / Humify */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-md mb-6"
              >
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-xs font-medium text-emerald-700">Plataforma de Gestão de Contratos</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-bold text-slate-900 leading-[1.15] tracking-tight"
              >
                Controle total dos seus contratos em um único lugar
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16 }}
                className="text-base text-slate-500 mt-5 leading-relaxed max-w-lg"
              >
                Gerencie, audite e monitore automaticamente contratos e obrigações financeiras.
                Reduza riscos e ganhe eficiência com inteligência artificial.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24 }}
                className="flex items-center gap-3 mt-8"
              >
                <Link
                  href="/register"
                  className="px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Começar gratuitamente
                </Link>
                <Link
                  href="#produto"
                  className="px-6 py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Ver demonstração
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex items-center gap-8 mt-12 pt-8 border-t border-slate-100"
              >
                <div>
                  <div className="text-2xl font-bold text-slate-900">2.400+</div>
                  <div className="text-xs text-slate-500 mt-0.5">Contratos auditados</div>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">98%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Satisfação dos clientes</div>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">40%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Redução de riscos</div>
                </div>
              </motion.div>
            </div>

            {/* Right: floating UI card preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden md:block"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-5">
                {/* Mini Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <K9Logo className="w-5 h-5" />
                    <span className="text-sm font-bold text-slate-900">Painel Geral</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Última att: 11:20 AM</div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[11px] text-slate-500">Ativos</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">147</div>
                    <div className="text-[10px] text-emerald-600 mt-1 font-medium">↑ 12%</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[11px] text-slate-500">Vencendo</div>
                    <div className="text-xl font-bold text-amber-600 mt-1">23</div>
                    <div className="text-[10px] text-amber-600 mt-1 font-medium">próx. 30 dias</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[11px] text-slate-500">Risco</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">92<span className="text-sm text-slate-400">/100</span></div>
                    <div className="text-[10px] text-emerald-600 mt-1 font-medium">Saudável</div>
                  </div>
                </div>

                {/* Contracts list */}
                <div className="space-y-2">
                  {[
                    { name: 'NDA – Tech Corp', type: 'Confidencialidade', status: 'Vigente', statusColor: 'text-emerald-700 bg-emerald-50' },
                    { name: 'Locação Sala 04', type: 'Imobiliário', status: 'Vencendo', statusColor: 'text-amber-700 bg-amber-50' },
                    { name: 'SLA AWS Cloud', type: 'Serviços', status: 'Vigente', statusColor: 'text-emerald-700 bg-emerald-50' },
                    { name: 'Contrato PRJ-042', type: 'Consultoria', status: 'Em revisão', statusColor: 'text-blue-700 bg-blue-50' },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400">{c.type}</div>
                        </div>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${c.statusColor}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Risk bar */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-medium text-slate-700">Saúde do Portfólio</span>
                    <span className="text-[11px] text-slate-400">Mensal</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
                    <div className="h-full bg-amber-400" style={{ width: '18%' }} />
                    <div className="h-full bg-red-400 rounded-r-full" style={{ width: '10%' }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-slate-400">Conforme 72%</span>
                    <span className="text-[10px] text-slate-400">Atenção 18%</span>
                    <span className="text-[10px] text-slate-400">Crítico 10%</span>
                  </div>
                </div>
              </div>

              {/* Floating alert card - offset for depth */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 p-3 w-60">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-amber-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-slate-900">Contrato vencendo</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Locação Sala 04 vence em 12 dias</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Logos bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 pt-8 border-t border-slate-100"
          >
            <p className="text-xs text-slate-400 text-center mb-6 font-medium uppercase tracking-wider">Confiado por mais de 500 empresas</p>
            <div className="flex items-center justify-center gap-10 md:gap-16 opacity-40 grayscale flex-wrap">
              <span className="text-lg font-bold tracking-tight text-slate-900">TOTVS</span>
              <span className="text-lg font-bold tracking-tight text-slate-900">Bradesco</span>
              <span className="text-lg font-bold tracking-tight text-slate-900">Vivo</span>
              <span className="text-lg font-bold tracking-tight text-slate-900">Ambev</span>
              <span className="text-lg font-bold tracking-tight text-slate-900">BTG</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <Section id="funcionalidades" className="py-20 md:py-28 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Funcionalidades</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 tracking-tight leading-tight">
              Tudo que você precisa para gestão de contratos
            </h2>
            <p className="text-slate-500 mt-4 text-[15px] leading-relaxed">
              Da análise ao monitoramento contínuo.
              Cada funcionalidade foi projetada para eliminar trabalho manual e reduzir riscos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-100 p-6 hover:border-slate-200 hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white mb-4 group-hover:bg-slate-800 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 text-[15px]">{f.title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ PRODUCT SHOWCASE ═══════════ */}
      <Section id="produto" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Produto</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              Gestão inteligente começa aqui
            </h2>
            <p className="text-slate-500 mt-4 text-[15px] leading-relaxed">
              Interface projetada para decisões rápidas. Todas as informações que importam em uma visão consolidada.
            </p>
          </div>

          {/* Product screenshot mockup */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 md:p-4">
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border border-slate-200 rounded-md px-4 py-1 text-[11px] text-slate-400 w-80 text-center">
                    app.kanine.com.br/dashboard
                  </div>
                </div>
              </div>

              {/* App content */}
              <div className="flex min-h-[420px]">
                {/* Sidebar */}
                <div className="w-52 border-r border-slate-100 p-4 hidden md:flex flex-col">
                  <div className="flex items-center gap-2 mb-8">
                    <K9Logo className="w-5 h-5" />
                    <span className="text-sm font-bold text-slate-900">Kanine</span>
                  </div>

                  <div className="space-y-0.5 text-[13px]">
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-100 text-slate-900 rounded-lg font-medium">
                      <Activity className="w-4 h-4" /> Dashboard
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-slate-500 rounded-lg">
                      <FileText className="w-4 h-4" /> Contratos
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-slate-500 rounded-lg">
                      <Bell className="w-4 h-4" /> Notificações
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-slate-500 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" /> Aprovações
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 text-slate-500 rounded-lg">
                      <BarChart3 className="w-4 h-4" /> Financeiro
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-lg font-bold text-slate-900">Painel de Controle</div>
                      <div className="text-[12px] text-slate-400 mt-0.5">Visão consolidada do portfólio</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] text-slate-500">
                        Fev 2026
                      </div>
                      <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[12px] font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Novo
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Total', value: '312', sub: 'contratos' },
                      { label: 'Ativos', value: '287', sub: '+8 este mês', subColor: 'text-emerald-600' },
                      { label: 'Vencendo', value: '18', sub: 'em 30 dias', subColor: 'text-amber-600' },
                      { label: 'Valor total', value: 'R$ 4.2M', sub: '+12% vs anterior', subColor: 'text-emerald-600' },
                    ].map((m, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] text-slate-400">{m.label}</div>
                        <div className="text-lg font-bold text-slate-900 mt-1">{m.value}</div>
                        <div className={`text-[10px] mt-0.5 ${m.subColor || 'text-slate-400'}`}>{m.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder + list */}
                  <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-3 bg-slate-50 rounded-lg p-4">
                      <div className="text-[12px] font-medium text-slate-700 mb-3">Volume (6 meses)</div>
                      {/* Simple bar chart representation */}
                      <div className="flex items-end gap-2 h-24">
                        {[45, 62, 38, 75, 58, 82].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full rounded-sm ${i === 5 ? 'bg-slate-900' : 'bg-slate-200'}`}
                              style={{ height: `${h}%` }}
                            />
                            <span className="text-[9px] text-slate-400">
                              {['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 bg-slate-50 rounded-lg p-4">
                      <div className="text-[12px] font-medium text-slate-700 mb-3">Recentes</div>
                      <div className="space-y-2.5">
                        {[
                          { name: 'NDA Tech Corp', time: '2h atrás' },
                          { name: 'Locação Sala 04', time: '5h atrás' },
                          { name: 'SLA Cloud', time: '1d atrás' },
                        ].map((r, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-white rounded border border-slate-200 flex items-center justify-center">
                                <FileText className="w-3 h-3 text-slate-400" />
                              </div>
                              <span className="text-[11px] text-slate-700 font-medium">{r.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{r.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <Section id="depoimentos" className="py-20 md:py-28 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Depoimentos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-100 p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{t.name}</div>
                    <div className="text-[12px] text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ FAQ ═══════════ */}
      <Section id="faq" className="py-20 md:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
              Perguntas frequentes
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 px-6">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════ CTA ═══════════ */}
      <Section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Pronto para transformar sua gestão de contratos?
          </h2>
          <p className="text-slate-500 mt-4 max-w-lg mx-auto text-[15px] leading-relaxed">
            Comece gratuitamente em minutos. Sem cartão de crédito, sem compromisso.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              Começar agora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-slate-100 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <K9Logo className="w-6 h-6" />
                <span className="text-sm font-bold text-slate-900">Kanine</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plataforma de gestão e auditoria inteligente de contratos.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">Produto</h4>
              <div className="space-y-2.5">
                <a href="#funcionalidades" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Funcionalidades</a>
                <a href="#produto" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Demonstração</a>
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Preços</a>
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Integrações</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">Empresa</h4>
              <div className="space-y-2.5">
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Sobre</a>
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Blog</a>
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Carreiras</a>
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Contato</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">Legal</h4>
              <div className="space-y-2.5">
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Privacidade</a>
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Termos de uso</a>
                <a href="#" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">LGPD</a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">&copy; 2026 Kanine. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">LinkedIn</a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
