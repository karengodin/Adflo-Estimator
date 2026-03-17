'use client'

import { useState, useEffect } from 'react'
import { calcEstimate, TIER_COLORS } from '../lib/estimator'
import type { Session, Question, LogicSettings } from '@/types'

interface Props {
  session: Session & { answers: Record<number, 'Yes' | 'No'>; activated_levers: number[] }
  questions: Question[]
  logic: LogicSettings
  estimate: ReturnType<typeof calcEstimate>
}

const FEATURES = [
  { name: 'Product Catalog',              desc: 'Client media products, rate card pricing, and inventory',                 always: true },
  { name: 'Order Management',             desc: 'Core order intake, line items, and flights',                              always: true },
  { name: 'Kanban Workflow',              desc: 'Configurable task cards and swimlanes',                                   always: true },
  { name: 'Tap Reporting Integration',    desc: 'Integration with TapClicks Reporting platform',                          always: true },
  { name: 'Buysheet / IO Export',         desc: 'Export insertion orders from order data',                                always: true },
  { name: 'Audit Logs',                   desc: 'Change history and visibility into order modifications',                  always: true },
  { name: 'Historical Data Migration',    desc: 'Import of historical campaign and order data',                            qIds: [5]  },
  { name: 'Multi-Step Approvals',         desc: 'Multiple approval stages before activation',                             qIds: [9]  },
  { name: 'Cross-Dept Approvals',         desc: 'Approval routing across multiple departments',                           qIds: [10] },
  { name: 'Conditional Workflow Routing', desc: 'If/then rules for dynamic order routing',                                qIds: [11] },
  { name: 'SLA Tracking',                 desc: 'Automated deadline enforcement in workflows',                            qIds: [12] },
  { name: 'CRM Integration',              desc: 'Bi-directional or one-way sync with CRM',                                qIds: [13] },
  { name: 'Proposal Tool Integration',    desc: 'Connection to proposal or quoting tools',                                qIds: [14] },
  { name: 'Billing System Integration',   desc: 'Integration with finance or billing systems',                            qIds: [15] },
  { name: 'Inbound API / Webhooks',       desc: 'Receive data from external platforms',                                   qIds: [16] },
  { name: 'Bi-Directional Sync',          desc: 'Two-way data sync between Adflo and external systems',                  qIds: [17] },
  { name: 'Push Connectors',              desc: 'Automated push to vendor systems',                                       qIds: [18] },
  { name: 'Custom Order Forms',           desc: 'Multiple custom order intake forms',                                     qIds: [19] },
  { name: 'Custom Product Forms',         desc: 'Custom fields per product type',                                         qIds: [20] },
  { name: 'Custom Task Forms',            desc: 'Custom fields on workflow tasks',                                        qIds: [21] },
  { name: 'Multi-BU Support',             desc: 'Multiple business units with access controls',                           qIds: [22] },
  { name: 'Role-Based Access',            desc: 'Granular permission levels by user role',                                qIds: [23] },
  { name: 'Custom Margin Tracking',       desc: 'Margin calculation per campaign',                                        qIds: [24] },
  { name: 'Custom Financial Reporting',   desc: 'Bespoke financial reports',                                              qIds: [25] },
  { name: 'Cost Reconciliation',          desc: 'Planned vs. actual cost reconciliation',                                 qIds: [26] },
  { name: 'COGS Tracking',               desc: 'Cost of goods sold per line item',                                       qIds: [27] },
  { name: 'Billing Automation',           desc: 'Automated invoice generation from order data',                           qIds: [28] },
  { name: 'Change Orders',               desc: 'Revenue adjustment via change order workflow',                            qIds: [29] },
  { name: 'Campaign Pacing',              desc: 'Real-time pacing data during active campaigns',                          qIds: [30] },
  { name: 'Multi-Region Support',         desc: 'Multiple geographic markets or regions',                                 qIds: [37] },
]

function autoObjectives(answers: Record<number, 'Yes' | 'No'>, clientName: string): string {
  const lines: string[] = []
  if (answers[2] === 'Yes') lines.push('Establish Adflo as the single source of truth for all order and campaign data.')
  if (answers[1] === 'Yes') lines.push('Consolidate multiple order and campaign management systems into one unified platform.')
  if (answers[8] === 'Yes') lines.push('Standardize workflows across teams currently following different processes for the same campaign types.')
  if (answers[13] === 'Yes' || answers[14] === 'Yes' || answers[15] === 'Yes') lines.push('Integrate Adflo with existing business systems to eliminate manual data entry and reduce operational risk.')
  if (answers[9] === 'Yes' || answers[10] === 'Yes') lines.push('Implement structured, multi-step approval workflows to ensure proper governance before campaign activation.')
  if (answers[28] === 'Yes') lines.push('Automate the order-to-billing process to reduce manual effort and billing errors.')
  if (answers[31] === 'No') lines.push('Establish a dedicated internal implementation lead to drive adoption and project success.')
  if (answers[24] === 'Yes' || answers[25] === 'Yes') lines.push('Gain real-time visibility into margin, financial performance, and campaign profitability.')
  if (answers[22] === 'Yes') lines.push('Support multiple business units or brands within a single platform with appropriate access controls.')
  if (!lines.length) lines.push('Streamline order management and workflow operations using the Adflo platform.')
  return lines.join('\n')
}

function autoRisks(answers: Record<number, 'Yes' | 'No'>): string {
  const risks: string[] = []
  if (answers[31] === 'No') risks.push('No dedicated internal implementation lead identified — increases coordination risk and may extend timeline.')
  if (answers[32] === 'No') risks.push('No dedicated technical resource for integrations — may delay integration milestones.')
  if (answers[33] === 'No') risks.push('Current workflows not documented — discovery phase will require additional time to map current state.')
  if (answers[34] === 'No') risks.push('Stakeholder alignment on future workflows not confirmed — risk of scope changes mid-project.')
  if (answers[17] === 'Yes') risks.push('Bi-directional sync requires careful API mapping — specs must be confirmed during discovery.')
  if (answers[5] === 'Yes') risks.push('Historical data import complexity is unknown until a data audit is completed.')
  if (!risks.length) risks.push('No significant risks identified based on current questionnaire answers.')
  return risks.join('\n')
}

function autoOOS(questions: Question[], levers: number[]): string {
  const lines = [
    'Order, Line Item, or Flight data migration (unless explicitly agreed via scope change)',
    'Custom reporting or analytics beyond standard Tap Reporting integration',
    'Campaign trafficking or ad server management',
    'Media buying, planning, or vendor negotiation',
    'Scope changes discovered post-SRD sign-off (managed via Change Request process)',
  ]
  levers.forEach(id => {
    const q = questions.find(x => x.id === id)
    if (q?.lever_name) lines.push(`${q.lever_name} — ${q.lever_desc} (removed from scope via lever)`)
  })
  return lines.join('\n')
}

export default function SRDPanel({ session, questions, logic, estimate }: Props) {
  const { answers, activated_levers: levers } = session
  const excl = new Set(levers)

  const [clientName, setClientName] = useState(session.client_name)
  const [contact, setContact] = useState('')
  const [background, setBackground] = useState('')
  const [objectives, setObjectives] = useState(() => autoObjectives(answers, session.client_name))
  const [oos, setOos] = useState(() => autoOOS(questions, levers))
  const [risks, setRisks] = useState(() => autoRisks(answers))
  const [parking, setParking] = useState('')
  const [nextsteps, setNextsteps] = useState(
    '1. Client reviews and signs this SRD\n2. Kickoff call scheduled within 5 business days of signing\n3. Implementation workbook shared by TapClicks\n4. Discovery sessions begin — current-state process review\n5. Milestone 1: Documentation & form design sign-off\n6. Milestone 2: Configuration, UAT, and go-live'
  )
  const [startDate, setStartDate] = useState('')
  const [golive, setGolive] = useState('')
  const [milestones, setMilestones] = useState(
    'Milestone 1: Discovery & Documentation sign-off\nMilestone 2: Platform Configuration\nMilestone 3: UAT & Acceptance Criteria\nMilestone 4: Go-live & Handover'
  )
  const [tcSig, setTcSig] = useState('')
  const [tcTitle, setTcTitle] = useState('')
  const [clSig, setClSig] = useState('')
  const [clTitle, setClTitle] = useState('')
  const [exporting, setExporting] = useState(false)

  // Re-sync auto fields when answers change
  useEffect(() => {
    setObjectives(autoObjectives(answers, session.client_name))
    setOos(autoOOS(questions, levers))
    setRisks(autoRisks(answers))
    setClientName(session.client_name)
  }, [JSON.stringify(answers), JSON.stringify(levers)])

  function featureIncluded(f: typeof FEATURES[0]) {
    if (f.always) return true
    return (f.qIds ?? []).some(id => {
      const q = questions.find(x => x.id === id)
      return q && answers[id] === q.trigger && !excl.has(id)
    })
  }

  async function exportDocx() {
    setExporting(true)
    try {
      // Dynamically load docx from CDN
      if (!(window as any).docx) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js'
          s.onload = () => res()
          s.onerror = () => rej(new Error('Failed to load docx library'))
          document.head.appendChild(s)
        })
      }

      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
              HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
              LevelFormat, VerticalAlign } = (window as any).docx

      const border = { style: BorderStyle.SINGLE, size: 1, color: 'D0D7E3' }
      const borders = { top: border, bottom: border, left: border, right: border }
      const hBorder = { style: BorderStyle.SINGLE, size: 1, color: '2F6FED' }
      const hBorders = { top: hBorder, bottom: hBorder, left: hBorder, right: hBorder }

      const srdDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const h1 = (text: string) => new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 120 },
        children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', color: '18212B' })]
      })
      const h2 = (text: string) => new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text, bold: true, size: 22, font: 'Arial', color: '2F6FED' })]
      })
      const body = (text: string, opts: any = {}) => new Paragraph({
        spacing: { before: 60, after: 100 },
        children: [new TextRun({ text, size: 22, font: 'Arial', color: '455468', ...opts })]
      })
      const bullet = (text: string) => new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text, size: 22, font: 'Arial', color: '455468' })]
      })
      const spacer = () => new Paragraph({ spacing: { before: 120, after: 0 }, children: [new TextRun('')] })
      const rule = () => new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7E3' } },
        spacing: { before: 0, after: 240 },
        children: [new TextRun('')]
      })

      let sNum = 0
      const sec = (title: string) => { sNum++; return h1(`${sNum}. ${title}`) }

      const children: any[] = []

      // Title
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 720, after: 120 },
        children: [new TextRun({ text: 'Solution Requirements Definition', bold: true, size: 52, font: 'Arial', color: '18212B' })]
      }))
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: clientName, bold: true, size: 36, font: 'Arial', color: '2F6FED' })]
      }))
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480 },
        children: [new TextRun({ text: `Prepared ${srdDate} · ${estimate.tier.name} Implementation`, size: 22, font: 'Arial', color: '7B8A9A' })]
      }))
      children.push(rule())

      // 1. Purpose
      children.push(sec('Solution Requirements Definition Purpose'))
      children.push(body(`The purpose of this Solutions Requirements Definition (SRD) document is to drive alignment between the Customer needs and requirements for engaging with TapClicks' products and services. This document will detail all items to be delivered in the implementation process, along with an initial project schedule.`))
      children.push(body(`${clientName}'s receipt and signed acknowledgement will confirm scope of the TapClicks implementation project. This SRD will be attached to the Master Service Agreement (MSA) as an exhibit.`))
      children.push(spacer())

      // 2. Definitions
      children.push(sec('Definitions'))
      children.push(body('AdFlo is TapClicks\' outcome-based, end-to-end advertising operating system designed to replace fragmented workflows with a compounding, AI-driven platform for planning, selling, activating, and reporting across digital and linear media.'))
      children.push(body('AdFlo consists of 4 modular components:', { bold: true }))
      for (const m of ['Proposal Front-end', 'Media Marketplace', 'Order Management & Kanban Workflow Management', 'Reporting']) children.push(bullet(m))
      children.push(body('AdFlo is currently in closed beta and Customer agrees to participate based on acknowledgement of this SRD.'))
      children.push(spacer())

      // 3. Background
      children.push(sec('Customer Background'))
      const bgLines = background.trim() || 'To be provided by client during project kickoff.'
      bgLines.split('\n').filter((l: string) => l.trim()).forEach((l: string) => children.push(body(l)))
      children.push(spacer())

      // 4. Methodology
      children.push(sec('TapClicks Methodology'))
      children.push(body(`TapClicks provided demos of AdFlo and conducted a business process discovery focused on ${clientName}'s orders, workflow processes, and advertising-related systems. TapClicks reviewed where its technology can fit into ${clientName}'s ecosystem and offered technical solutions to problems uncovered during pre-sales discovery.`))
      children.push(body('Scope may be refined during post-sale project discovery. Any material changes will be handled via the Change Request process.'))
      children.push(spacer())

      // 5. Objectives
      children.push(sec('Customer Objectives'))
      children.push(body(`${clientName} has the following business objectives:`, { bold: true }))
      objectives.split('\n').filter((l: string) => l.trim()).forEach((l: string) => {
        children.push(bullet(l.replace(/^[\d.\-•*]\s*/, '')))
      })
      children.push(spacer())

      // 6. Feature scope table
      children.push(sec('TapClicks Technical Solutions — Feature Scope'))
      const featureRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ borders: hBorders, width: { size: 3600, type: WidthType.DXA }, shading: { fill: '2F6FED', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Feature', bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })] })] }),
            new TableCell({ borders: hBorders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: '2F6FED', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Included', bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })] })] }),
            new TableCell({ borders: hBorders, width: { size: 4560, type: WidthType.DXA }, shading: { fill: '2F6FED', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Notes', bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })] })] }),
          ]
        }),
        ...FEATURES.map((f, i) => {
          const included = featureIncluded(f)
          const rowFill = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC'
          const removedViaLever = (f.qIds ?? []).some(id => excl.has(id))
          return new TableRow({
            children: [
              new TableCell({ borders, width: { size: 3600, type: WidthType.DXA }, shading: { fill: rowFill, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: f.name, bold: true, size: 20, font: 'Arial', color: '18212B' })] }), new Paragraph({ spacing: { before: 30 }, children: [new TextRun({ text: f.desc, size: 18, font: 'Arial', color: '7B8A9A' })] })] }),
              new TableCell({ borders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: rowFill, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: included ? '✓ Yes' : '— No', bold: true, size: 20, font: 'Arial', color: included ? '1F9D55' : '9CA3AF' })] })] }),
              new TableCell({ borders, width: { size: 4560, type: WidthType.DXA }, shading: { fill: rowFill, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: removedViaLever ? 'Removed from scope via lever' : '', size: 18, font: 'Arial', color: '7B8A9A' })] })] }),
            ]
          })
        })
      ]
      children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3600, 1200, 4560], rows: featureRows }))
      children.push(spacer())

      // 7. OOS
      children.push(sec('Out of Scope'))
      oos.split('\n').filter((l: string) => l.trim()).forEach((l: string) => children.push(bullet(l.replace(/^[\d.\-•*]\s*/, ''))))
      children.push(spacer())

      // 8. Estimate
      children.push(sec('Estimate & Project Timeline'))
      children.push(new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [2340, 2340, 2340, 2340],
        rows: [
          new TableRow({ children: ['Expected Hours', 'Range', 'Tier', 'Timeline'].map(label => new TableCell({ borders: hBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: '2F6FED', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Arial', color: 'FFFFFF' })] })] })) }),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: 'EAF1FF', type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: `${estimate.expected} hrs`, bold: true, size: 26, font: 'Arial', color: '2F6FED' })] })] }),
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: 'EAF1FF', type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: `${estimate.best}–${estimate.worst} hrs`, size: 22, font: 'Arial', color: '455468' })] })] }),
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: 'EAF1FF', type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: estimate.tier.name, bold: true, size: 22, font: 'Arial', color: '455468' })] })] }),
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: 'EAF1FF', type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: estimate.tier.timeline, size: 22, font: 'Arial', color: '455468' })] })] }),
          ] })
        ]
      }))
      if (milestones) {
        children.push(spacer())
        children.push(h2('Project Milestones'))
        milestones.split('\n').filter((l: string) => l.trim()).forEach((l: string) => children.push(bullet(l.replace(/^[\d.\-•*]\s*/, ''))))
      }
      if (startDate || golive) children.push(body(`Estimated start: ${startDate || 'TBD'} · Estimated go-live: ${golive || 'TBD'}`, { color: '7B8A9A' }))
      children.push(spacer())

      // 9. Customer Expectations
      children.push(sec('Customer Expectations'))
      for (const l of ['Designated internal implementation lead with decision-making authority', 'Access to key stakeholders for discovery sessions and sign-off checkpoints', 'Documentation of current-state workflows (if available)', 'Timely review and sign-off at each project checkpoint', 'User Acceptance Testing participation and written approval']) children.push(bullet(l))
      children.push(spacer())

      // 10. Deliverables & Acceptance
      children.push(sec('Implementation Deliverables & Acceptance Criteria'))
      children.push(body('TapClicks will provide:', { bold: true }))
      for (const l of ['Project Plan, Scope, and Delivery Plan based on Discovery', 'Documentation details for Milestone 1', 'Acceptance Criteria and UAT scripts for Milestone 2', 'Training materials and go-live support']) children.push(bullet(l))
      children.push(spacer())
      children.push(h2('Acceptance Criteria'))
      children.push(body('Acceptance Criteria will be agreed upon by both parties and written in "Given, When, Then" format. Customer confirmation must be handled via email and TapClicks will need 5 work days to review and respond.'))
      children.push(spacer())

      // 11. Project Cadence
      children.push(sec('Project Cadence'))
      children.push(h2('Checkpoint 1: Documentation Sign-Off'))
      for (const l of ['Written approval of Product and Order Form fields', 'Delivery of project plan and estimated go-live date']) children.push(bullet(l))
      children.push(h2('Checkpoint 2: UAT Sign-Off'))
      for (const l of ['Written approval of configured Product and Order Forms', 'Updated project plan with live date', 'User Acceptance Testing based on UAT scripts provided by TapClicks']) children.push(bullet(l))
      children.push(h2('Change Requests'))
      children.push(body('Any material change to scope, level of effort, or schedule will require an amendment to this SRD and Customer\'s signed acknowledgement.'))
      children.push(spacer())

      // 12. Risks
      children.push(sec('Risks'))
      risks.split('\n').filter((l: string) => l.trim()).forEach((l: string) => children.push(bullet(l.replace(/^[\d.\-•*]\s*/, ''))))
      children.push(spacer())

      // 13. Parking Lot
      if (parking.trim()) {
        children.push(sec('Parking Lot / Open Items'))
        parking.split('\n').filter((l: string) => l.trim()).forEach((l: string) => children.push(bullet(l.replace(/^[\d.\-•*]\s*/, ''))))
        children.push(spacer())
      }

      // 14. Next Steps
      children.push(sec('Next Steps'))
      nextsteps.split('\n').filter((l: string) => l.trim()).forEach((l: string) => children.push(bullet(l.replace(/^[\d.\-•*]\s*/, ''))))
      children.push(spacer())

      // 15. Signatures
      children.push(sec('Signatures'))
      children.push(body('By signing below, both parties agree to the scope, terms, and conditions outlined in this document.'))
      children.push(spacer())
      children.push(new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
        rows: [new TableRow({ children: [
          new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: 'F8FAFC', type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 180, right: 180 }, children: [
            new Paragraph({ children: [new TextRun({ text: 'TapClicks', bold: true, size: 22, font: 'Arial', color: '18212B' })] }),
            new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: `Name: ${tcSig || '_______________________'}`, size: 20, font: 'Arial', color: '455468' })] }),
            new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: `Title: ${tcTitle || '_______________________'}`, size: 20, font: 'Arial', color: '455468' })] }),
            new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Signature: _______________________', size: 20, font: 'Arial', color: '7B8A9A' })] }),
            new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'Date: _______________________', size: 20, font: 'Arial', color: '7B8A9A' })] }),
          ] }),
          new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: 'F8FAFC', type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 180, right: 180 }, children: [
            new Paragraph({ children: [new TextRun({ text: clientName, bold: true, size: 22, font: 'Arial', color: '18212B' })] }),
            new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: `Name: ${clSig || '_______________________'}`, size: 20, font: 'Arial', color: '455468' })] }),
            new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: `Title: ${clTitle || '_______________________'}`, size: 20, font: 'Arial', color: '455468' })] }),
            new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Signature: _______________________', size: 20, font: 'Arial', color: '7B8A9A' })] }),
            new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'Date: _______________________', size: 20, font: 'Arial', color: '7B8A9A' })] }),
          ] }),
        ] })]
      }))

      const doc = new Document({
        numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
        styles: {
          default: { document: { run: { font: 'Arial', size: 22 } } },
          paragraphStyles: [
            { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Arial', color: '18212B' }, paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
            { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, font: 'Arial', color: '2F6FED' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
          ]
        },
        sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } }, children }]
      })

      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Adflo_SRD_${clientName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const textareaClass = 'w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-base placeholder:text-muted-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 resize-y'

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      {/* Export header */}
      <div className="card flex items-center justify-between">
        <div>
          <h2 className="font-bold text-text-base">SRD Generator</h2>
          <p className="text-xs text-muted mt-0.5">Auto-populated from questionnaire answers. Edit any field, then export.</p>
        </div>
        <button onClick={exportDocx} disabled={exporting} className="btn btn-primary gap-2">
          {exporting ? '⏳ Generating…' : '⬇ Export SRD (.docx)'}
        </button>
      </div>

      {/* 1. Client info */}
      <div className="card space-y-4">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">1. Client Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="field-group"><label>Client / Company Name</label><input className="field-input" value={clientName} onChange={e => setClientName(e.target.value)} /></div>
          <div className="field-group"><label>Primary Client Contact</label><input className="field-input" placeholder="e.g. Jane Smith, VP Operations" value={contact} onChange={e => setContact(e.target.value)} /></div>
          <div className="field-group"><label>Estimated Start Date</label><input type="date" className="field-input" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div className="field-group"><label>Estimated Go-Live Date</label><input type="date" className="field-input" value={golive} onChange={e => setGolive(e.target.value)} /></div>
          <div className="field-group col-span-2"><label>Client Background</label><textarea className={textareaClass} rows={3} placeholder="Describe who the client is, their market, size, and what they do…" value={background} onChange={e => setBackground(e.target.value)} /></div>
        </div>
      </div>

      {/* 2. Estimate summary */}
      <div className="card bg-accent-soft border-blue-200">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest mb-3">2. Estimate Summary</h3>
        <div className="flex items-center gap-6 flex-wrap">
          <div><div className="text-xs text-muted-3 mb-0.5">Expected Hours</div><div className="text-3xl font-bold text-accent">{estimate.expected}</div></div>
          <div><div className="text-xs text-muted-3 mb-0.5">Range</div><div className="text-base font-semibold text-text-base">{estimate.best}–{estimate.worst} hrs</div></div>
          <div><div className="text-xs text-muted-3 mb-0.5">Tier</div><span className={`badge badge-${estimate.tier.name.toLowerCase()} text-sm px-3 py-1.5`}>● {estimate.tier.name}</span></div>
          <div><div className="text-xs text-muted-3 mb-0.5">Timeline</div><div className="text-base font-semibold text-text-base">{estimate.tier.timeline}</div></div>
        </div>
      </div>

      {/* 3. Objectives */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">3. Business Objectives</h3>
        <p className="text-xs text-muted">Auto-generated from answers. Edit to tailor.</p>
        <textarea className={textareaClass} rows={6} value={objectives} onChange={e => setObjectives(e.target.value)} />
      </div>

      {/* 4. Feature scope table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">4. Feature Scope</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
              <th className="text-left px-5 py-3">Feature</th>
              <th className="text-left px-5 py-3 w-24">Included</th>
              <th className="text-left px-5 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FEATURES.map(f => {
              const inc = featureIncluded(f)
              const removedViaLever = (f.qIds ?? []).some(id => excl.has(id))
              return (
                <tr key={f.name} className="hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <div className="font-medium text-text-base">{f.name}</div>
                    <div className="text-[11px] text-muted-3 mt-0.5">{f.desc}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge border ${inc ? 'bg-green-soft text-green-brand border-green-200' : 'bg-surface-3 text-muted-3 border-border'}`}>
                      {inc ? '✓ Yes' : '— No'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-2">
                    {removedViaLever ? 'Removed via lever' : f.always ? 'Standard' : inc ? '' : 'Not required'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Out of scope */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">5. Out of Scope</h3>
        <textarea className={textareaClass} rows={5} value={oos} onChange={e => setOos(e.target.value)} />
      </div>

      {/* 6. Milestones */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">6. Project Milestones</h3>
        <textarea className={textareaClass} rows={4} value={milestones} onChange={e => setMilestones(e.target.value)} />
      </div>

      {/* 7. Risks */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">7. Risks</h3>
        <textarea className={textareaClass} rows={4} value={risks} onChange={e => setRisks(e.target.value)} />
      </div>

      {/* 8. Parking lot */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">8. Parking Lot / Open Items</h3>
        <textarea className={textareaClass} rows={3} placeholder="Any open questions or items to revisit…" value={parking} onChange={e => setParking(e.target.value)} />
      </div>

      {/* 9. Next steps */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">9. Next Steps</h3>
        <textarea className={textareaClass} rows={5} value={nextsteps} onChange={e => setNextsteps(e.target.value)} />
      </div>

      {/* 10. Signatures */}
      <div className="card space-y-4">
        <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">10. Signature Block</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="field-group"><label>TapClicks Signatory Name</label><input className="field-input" placeholder="e.g. Michael Jolly" value={tcSig} onChange={e => setTcSig(e.target.value)} /></div>
          <div className="field-group"><label>TapClicks Signatory Title</label><input className="field-input" placeholder="e.g. SVP Enterprise Solutions" value={tcTitle} onChange={e => setTcTitle(e.target.value)} /></div>
          <div className="field-group"><label>Client Signatory Name</label><input className="field-input" placeholder="e.g. Jane Smith" value={clSig} onChange={e => setClSig(e.target.value)} /></div>
          <div className="field-group"><label>Client Signatory Title</label><input className="field-input" placeholder="e.g. VP Operations" value={clTitle} onChange={e => setClTitle(e.target.value)} /></div>
        </div>
      </div>

      <div className="flex gap-3 pb-8">
        <button onClick={exportDocx} disabled={exporting} className="btn btn-primary py-3 px-8 text-base">
          {exporting ? '⏳ Generating…' : '⬇ Export SRD (.docx)'}
        </button>
      </div>
    </div>
  )
}
