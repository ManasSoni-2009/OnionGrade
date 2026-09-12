const fs = require('fs');
const path = require('path');

const dir = 'D:/Projects/SIH/src/pages';

let p1 = path.join(dir, 'ReportDetail.tsx');
let c1 = fs.readFileSync(p1, 'utf-8');
c1 = c1.replace(/export interface ReportDetailProps \{\n  reports: LotAssessment\[\]\n  notify: \(m: string, k\?: 'success' \| 'plain'\) => void\n\}\n\nexport function ReportDetail\(\{ reports, notify \}: ReportDetailProps\) \{/, 
  'import { useStore } from "../store"\n\nexport function ReportDetail() {\n  const reports = useStore(state => state.reports)\n  const notify = useStore(state => state.notify)');
c1 = c1.replace(/const existing = loadReports\(\) \?\? \[\]\n        localStorage\.setItem\(storageKey, JSON\.stringify\(\[final, \.\.\.existing\]\)\)\n        window\.location\.reload\(\)/,
  'useStore.getState().addReport(final)');
fs.writeFileSync(p1, c1);

let p2 = path.join(dir, 'DealerVerify.tsx');
let c2 = fs.readFileSync(p2, 'utf-8');
c2 = c2.replace(/export interface DealerVerifyProps \{\n  reports: LotAssessment\[\]\n  notify: \(m: string\) => void\n\}\n\nexport function DealerVerify\(\{ reports, notify \}: DealerVerifyProps\) \{/,
  'import { useStore } from "../store"\n\nexport function DealerVerify() {\n  const reports = useStore(state => state.reports)\n  const notify = useStore(state => state.notify)');
fs.writeFileSync(p2, c2);

let p3 = path.join(dir, 'Settings.tsx');
let c3 = fs.readFileSync(p3, 'utf-8');
c3 = c3.replace(/export interface SettingsProps \{\n  notify: \(m: string\) => void\n\}\n\nexport function Settings\(\{ notify \}: SettingsProps\) \{/,
  'import { useStore } from "../store"\n\nexport function Settings() {\n  const notify = useStore(state => state.notify)\n  const clearReports = useStore(state => state.clearReports)');
c3 = c3.replace(/localStorage\.removeItem\('oniongrade-reports'\)/g, 'clearReports()');
fs.writeFileSync(p3, c3);

let p4 = path.join(dir, 'Login.tsx');
let c4 = fs.readFileSync(p4, 'utf-8');
c4 = c4.replace(/export interface LoginProps \{\n  onComplete: \(name: string\) => void\n\}\n\nexport function Login\(\{ onComplete \}: LoginProps\) \{/,
  'import { useStore } from "../store"\n\nexport function Login() {\n  const setProfile = useStore(state => state.setProfile)\n  const onComplete = (name: string) => setProfile(name)');
fs.writeFileSync(p4, c4);

let p5 = path.join(dir, 'ProfileSetup.tsx');
let c5 = fs.readFileSync(p5, 'utf-8');
c5 = c5.replace(/export interface ProfileSetupProps \{\n  onComplete: \(name: string\) => void\n\}\n\nexport function ProfileSetup\(\{ onComplete \}: ProfileSetupProps\) \{/,
  'import { useStore } from "../store"\n\nexport function ProfileSetup() {\n  const setProfile = useStore(state => state.setProfile)\n  const onComplete = (name: string) => setProfile(name)');
fs.writeFileSync(p5, c5);
