import type { Question, LogicSettings, TierConfig, EstimateResult } from '../types'

export const DEFAULT_LOGIC: LogicSettings = {
  id: 'default',
  base_hours: 24,
  best_case_multiplier: 0.8,
  worst_case_multiplier: 1.3,
  learning_blend_cap: 0.6,
  min_projects_for_full_learning: 20,
  tiers: [
    { name: 'Bronze',     min_hours: 24,  timeline: '3–5 weeks'  },
    { name: 'Silver',     min_hours: 60,  timeline: '5–8 weeks'  },
    { name: 'Gold',       min_hours: 110, timeline: '8–12 weeks' },
    { name: 'Enterprise', min_hours: 180, timeline: '12–16 weeks' },
  ],
  updated_at: '',
  updated_by: '',
}

export const DEFAULT_QUESTIONS: Question[] = [
  { id:1,  cat:'Data & Structure',              q:'Do you currently use more than one system to manage orders or campaign data?',       trigger:'Yes', weight:8,  can_remove:false, lever_name:null, lever_desc:null, sort_order:1,  active:true },
  { id:2,  cat:'Data & Structure',              q:'Will Adflo be the single source of truth for data?',                               trigger:'Yes', weight:10, can_remove:false, lever_name:null, lever_desc:null, sort_order:2,  active:true },
  { id:3,  cat:'Data & Structure',              q:'Do you have more than 5 unique products or service types?',                        trigger:'Yes', weight:6,  can_remove:false, lever_name:null, lever_desc:null, sort_order:3,  active:true },
  { id:4,  cat:'Data & Structure',              q:'Do different products require different fields or data structures?',                trigger:'Yes', weight:8,  can_remove:false, lever_name:null, lever_desc:null, sort_order:4,  active:true },
  { id:5,  cat:'Data & Structure',              q:'Do you need to import historical campaign/order data?',                            trigger:'Yes', weight:12, can_remove:true,  lever_name:'Historical Data Import',       lever_desc:'Skip migrating historical data; start fresh',         sort_order:5,  active:true },
  { id:6,  cat:'Data & Structure',              q:'Do campaigns typically include multiple flights or phases?',                       trigger:'Yes', weight:4,  can_remove:false, lever_name:null, lever_desc:null, sort_order:6,  active:true },
  { id:7,  cat:'Data & Structure',              q:'Do multiple departments contribute different data inputs during campaign setup?',   trigger:'Yes', weight:6,  can_remove:false, lever_name:null, lever_desc:null, sort_order:7,  active:true },
  { id:8,  cat:'Data & Structure',              q:'Do different teams currently follow different processes for the same campaign type?',trigger:'Yes', weight:12, can_remove:false, lever_name:null, lever_desc:null, sort_order:8,  active:true },
  { id:9,  cat:'Workflow & Approvals',          q:'Do orders require more than one approval step before activation?',                 trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Multi-Step Approvals',         lever_desc:'Use single-step approval flow instead',              sort_order:9,  active:true },
  { id:10, cat:'Workflow & Approvals',          q:'Do approvals involve multiple departments (Sales, Finance, Ops, etc.)?',           trigger:'Yes', weight:8,  can_remove:true,  lever_name:'Cross-Dept Approvals',         lever_desc:'Limit approvals to one department',                  sort_order:10, active:true },
  { id:11, cat:'Workflow & Approvals',          q:'Do you require conditional workflow routing (if/then rules)?',                     trigger:'Yes', weight:10, can_remove:true,  lever_name:'Conditional Routing',           lever_desc:'Use standard linear workflow only',                  sort_order:11, active:true },
  { id:12, cat:'Workflow & Approvals',          q:'Do you require automated SLA tracking or deadlines in workflows?',                 trigger:'Yes', weight:6,  can_remove:true,  lever_name:'SLA Tracking',                 lever_desc:'Manual deadline management instead',                 sort_order:12, active:true },
  { id:13, cat:'Integrations',                  q:'Will Adflo integrate with a CRM system?',                                         trigger:'Yes', weight:12, can_remove:true,  lever_name:'CRM Integration',               lever_desc:'Manual data entry between systems',                  sort_order:13, active:true },
  { id:14, cat:'Integrations',                  q:'Will Adflo integrate with proposal or quoting tools?',                            trigger:'Yes', weight:8,  can_remove:true,  lever_name:'Proposal Tool Integration',    lever_desc:'Remove proposal tool sync',                          sort_order:14, active:true },
  { id:15, cat:'Integrations',                  q:'Will Adflo integrate with billing or finance systems?',                           trigger:'Yes', weight:14, can_remove:true,  lever_name:'Billing System Integration',   lever_desc:'Manual billing export instead',                      sort_order:15, active:true },
  { id:16, cat:'Integrations',                  q:'Will Adflo receive data from external platforms via API/webhook?',                 trigger:'Yes', weight:16, can_remove:true,  lever_name:'Inbound API / Webhooks',        lever_desc:'Remove inbound data feeds; manual import',           sort_order:16, active:true },
  { id:17, cat:'Integrations',                  q:'Do any integrations require bi-directional syncing?',                             trigger:'Yes', weight:18, can_remove:true,  lever_name:'Bi-Directional Sync',          lever_desc:'One-way sync only (Adflo → external)',               sort_order:17, active:true },
  { id:18, cat:'Integrations',                  q:'Will you require push connections to external vendors?',                          trigger:'Yes', weight:12, can_remove:true,  lever_name:'Push Connectors',               lever_desc:'Remove vendor push connections entirely',            sort_order:18, active:true },
  { id:19, cat:'Configuration',                 q:'Will you require multiple custom order forms?',                                   trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Custom Order Forms',            lever_desc:'Use standard order form template',                   sort_order:19, active:true },
  { id:20, cat:'Configuration',                 q:'Will you require custom product forms?',                                          trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Custom Product Forms',         lever_desc:'Use standard product form',                          sort_order:20, active:true },
  { id:21, cat:'Configuration',                 q:'Will you require custom task forms?',                                             trigger:'Yes', weight:5,  can_remove:true,  lever_name:'Custom Task Forms',             lever_desc:'Use default task structure',                         sort_order:21, active:true },
  { id:22, cat:'Configuration',                 q:'Will the platform need to support multiple business units or brands?',            trigger:'Yes', weight:10, can_remove:true,  lever_name:'Multi-BU Support',             lever_desc:'Single business unit configuration',                 sort_order:22, active:true },
  { id:23, cat:'Configuration',                 q:'Will users require different permission levels or roles?',                        trigger:'Yes', weight:6,  can_remove:false, lever_name:null, lever_desc:null, sort_order:23, active:true },
  { id:24, cat:'Reporting & Financial Complexity', q:'Do you require custom margin tracking?',                                       trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Custom Margin Tracking',        lever_desc:'Use standard margin reporting',                      sort_order:24, active:true },
  { id:25, cat:'Reporting & Financial Complexity', q:'Do you require custom financial reporting?',                                   trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Custom Financial Reports',      lever_desc:'Use out-of-box financial reports',                   sort_order:25, active:true },
  { id:26, cat:'Reporting & Financial Complexity', q:'Will campaigns need cost reconciliation?',                                     trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Cost Reconciliation',           lever_desc:'Skip reconciliation workflow',                       sort_order:26, active:true },
  { id:27, cat:'Reporting & Financial Complexity', q:'Will campaigns need COGS tracking?',                                           trigger:'Yes', weight:6,  can_remove:true,  lever_name:'COGS Tracking',                lever_desc:'Remove COGS tracking module',                        sort_order:27, active:true },
  { id:28, cat:'Reporting & Financial Complexity', q:'Do you require billing automation or invoice generation?',                     trigger:'Yes', weight:10, can_remove:true,  lever_name:'Billing Automation',            lever_desc:'Manual invoice creation instead',                    sort_order:28, active:true },
  { id:29, cat:'Reporting & Financial Complexity', q:'Will campaign revenue need to be adjusted via change orders?',                 trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Change Orders',                lever_desc:'No change order module in phase 1',                  sort_order:29, active:true },
  { id:30, cat:'Reporting & Financial Complexity', q:'Will you need pacing data during the campaign?',                               trigger:'Yes', weight:4,  can_remove:true,  lever_name:'Pacing Data',                  lever_desc:'Post-campaign reporting only',                       sort_order:30, active:true },
  { id:31, cat:'Organizational Readiness',      q:'Do you have a dedicated internal implementation lead?',                          trigger:'No',  weight:12, can_remove:false, lever_name:null, lever_desc:null, sort_order:31, active:true },
  { id:32, cat:'Organizational Readiness',      q:'Do you have a dedicated technical resource for integrations?',                   trigger:'No',  weight:10, can_remove:false, lever_name:null, lever_desc:null, sort_order:32, active:true },
  { id:33, cat:'Organizational Readiness',      q:'Do you have documented current workflows?',                                      trigger:'No',  weight:10, can_remove:false, lever_name:null, lever_desc:null, sort_order:33, active:true },
  { id:34, cat:'Organizational Readiness',      q:'Do stakeholders agree on how workflows should operate in the future?',           trigger:'No',  weight:12, can_remove:false, lever_name:null, lever_desc:null, sort_order:34, active:true },
  { id:35, cat:'Scale',                         q:'Will more than 20 users access the platform?',                                   trigger:'Yes', weight:4,  can_remove:false, lever_name:null, lever_desc:null, sort_order:35, active:true },
  { id:36, cat:'Scale',                         q:'Will more than one team or department use the system?',                          trigger:'Yes', weight:6,  can_remove:false, lever_name:null, lever_desc:null, sort_order:36, active:true },
  { id:37, cat:'Scale',                         q:'Will the platform support more than one geographic market or region?',           trigger:'Yes', weight:6,  can_remove:true,  lever_name:'Multi-Region Support',         lever_desc:'Single region launch first',                         sort_order:37, active:true },
]

export function calcEstimate(
  answers: Record<number, 'Yes' | 'No'>,
  activatedLevers: number[],
  questions: Question[],
  logic: LogicSettings
): EstimateResult {
  const removed = new Set(activatedLevers)
  let addedHours = 0
  const triggeredIds: number[] = []

  for (const q of questions) {
    if (!q.active) continue
    if (removed.has(q.id)) continue
    if (answers[q.id] === q.trigger) {
      addedHours += q.weight
      triggeredIds.push(q.id)
    }
  }

  const total = logic.base_hours + addedHours
  const best = Math.round(total * logic.best_case_multiplier)
  const worst = Math.round(total * logic.worst_case_multiplier)
  const expected = total

  const sorted = [...logic.tiers].sort((a, b) => b.min_hours - a.min_hours)
  const tierConfig = sorted.find(t => expected >= t.min_hours) ?? logic.tiers[0]

  return { expected, best, worst, tier: tierConfig, triggeredIds }
}

export function getTier(hours: number, tiers: TierConfig[]): TierConfig {
  const sorted = [...tiers].sort((a, b) => b.min_hours - a.min_hours)
  return sorted.find(t => hours >= t.min_hours) ?? tiers[0]
}

export const TIER_COLORS: Record<string, string> = {
  Bronze: '#c87532',
  Silver: '#6b7280',
  Gold: '#b7791f',
  Enterprise: '#2f6fed',
}
