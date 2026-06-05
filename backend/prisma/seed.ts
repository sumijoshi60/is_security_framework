import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import path from 'path';

const prisma = new PrismaClient();

// Old criticality → numeric weight mapping
const CRITICALITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 3.0,
  HIGH: 2.0,
  MEDIUM: 1.0,
  LOW: 0.5,
};

// Old controlCriticality map (preserved from original scoring-config.json for migration)
const CONTROL_CRITICALITY: Record<string, string> = {
  'A.5.1': 'CRITICAL', 'A.5.2': 'HIGH', 'A.5.3': 'HIGH', 'A.5.4': 'CRITICAL',
  'A.5.5': 'MEDIUM', 'A.5.6': 'MEDIUM', 'A.5.7': 'HIGH', 'A.5.8': 'MEDIUM',
  'A.5.9': 'HIGH', 'A.5.10': 'MEDIUM', 'A.5.11': 'MEDIUM', 'A.5.12': 'HIGH',
  'A.5.13': 'MEDIUM', 'A.5.14': 'CRITICAL', 'A.5.15': 'CRITICAL', 'A.5.16': 'CRITICAL',
  'A.5.17': 'HIGH', 'A.5.18': 'CRITICAL', 'A.5.19': 'HIGH', 'A.5.20': 'HIGH',
  'A.5.21': 'HIGH', 'A.5.22': 'HIGH', 'A.5.23': 'HIGH', 'A.5.24': 'CRITICAL',
  'A.5.25': 'HIGH', 'A.5.26': 'HIGH', 'A.5.27': 'MEDIUM', 'A.5.28': 'HIGH',
  'A.5.29': 'HIGH', 'A.5.30': 'HIGH', 'A.5.31': 'MEDIUM', 'A.5.32': 'MEDIUM',
  'A.5.33': 'MEDIUM', 'A.5.34': 'CRITICAL', 'A.5.35': 'MEDIUM', 'A.5.36': 'MEDIUM',
  'A.5.37': 'MEDIUM',
  'A.6.1': 'HIGH', 'A.6.2': 'MEDIUM', 'A.6.3': 'CRITICAL', 'A.6.4': 'MEDIUM',
  'A.6.5': 'HIGH', 'A.6.6': 'MEDIUM', 'A.6.7': 'HIGH', 'A.6.8': 'HIGH',
  'A.7.1': 'CRITICAL', 'A.7.2': 'CRITICAL', 'A.7.3': 'HIGH', 'A.7.4': 'CRITICAL',
  'A.7.5': 'HIGH', 'A.7.6': 'MEDIUM', 'A.7.7': 'MEDIUM', 'A.7.8': 'MEDIUM',
  'A.7.9': 'HIGH', 'A.7.10': 'HIGH', 'A.7.11': 'MEDIUM', 'A.7.12': 'MEDIUM',
  'A.7.13': 'MEDIUM', 'A.7.14': 'LOW',
  'A.8.1': 'CRITICAL', 'A.8.2': 'CRITICAL', 'A.8.3': 'CRITICAL', 'A.8.4': 'CRITICAL',
  'A.8.5': 'CRITICAL', 'A.8.6': 'MEDIUM', 'A.8.7': 'HIGH', 'A.8.8': 'CRITICAL',
  'A.8.9': 'CRITICAL', 'A.8.10': 'MEDIUM', 'A.8.11': 'MEDIUM', 'A.8.12': 'CRITICAL',
  'A.8.13': 'HIGH', 'A.8.14': 'HIGH', 'A.8.15': 'CRITICAL', 'A.8.16': 'CRITICAL',
  'A.8.17': 'MEDIUM', 'A.8.18': 'HIGH', 'A.8.19': 'HIGH', 'A.8.20': 'CRITICAL',
  'A.8.21': 'HIGH', 'A.8.22': 'HIGH', 'A.8.23': 'MEDIUM', 'A.8.24': 'CRITICAL',
  'A.8.25': 'HIGH', 'A.8.26': 'HIGH', 'A.8.27': 'HIGH', 'A.8.28': 'HIGH',
  'A.8.29': 'HIGH', 'A.8.30': 'MEDIUM', 'A.8.31': 'HIGH', 'A.8.32': 'HIGH',
  'A.8.33': 'MEDIUM', 'A.8.34': 'MEDIUM',
};

const DOMAIN_WEIGHTS: Record<string, number> = {
  A5: 0.30,
  A6: 0.15,
  A7: 0.20,
  A8: 0.35,
};

const MATURITY_DEFINITIONS = [
  { level: '? Unknown', numericValue: 0, description: 'Has not even been checked yet', sortOrder: 0 },
  { level: 'Nonexistent', numericValue: 1, description: 'Totally absent — not even planned', sortOrder: 1 },
  { level: 'Initial', numericValue: 2, description: 'Development has barely started and will require significant work to fulfill the requirements', sortOrder: 2 },
  { level: 'Limited', numericValue: 3, description: 'Progressing nicely but not yet complete', sortOrder: 3 },
  { level: 'Defined', numericValue: 4, description: 'Development is more or less complete although detail is lacking and/or it is not yet implemented, enforced and actively supported by top management', sortOrder: 4 },
  { level: 'Managed', numericValue: 5, description: 'Development is complete, the process/control has been implemented and recently started operating', sortOrder: 5 },
  { level: 'Optimized', numericValue: 6, description: 'The requirement is fully satisfied, is operating fully as expected, is being actively monitored and improved, and there is substantial evidence to prove all that to the auditors', sortOrder: 6 },
  { level: 'Not Applicable', numericValue: -1, description: 'Control is not applicable to this organization', sortOrder: 7 },
];

const DOMAIN_ROWS: Record<string, { code: string; name: string; sortOrder: number }> = {
  'A5': { code: 'A5', name: 'Organizational controls', sortOrder: 1 },
  'A6': { code: 'A6', name: 'People controls', sortOrder: 2 },
  'A7': { code: 'A7', name: 'Physical controls', sortOrder: 3 },
  'A8': { code: 'A8', name: 'Technological controls', sortOrder: 4 },
};

async function main() {
  console.log('Seeding database...');

  // 1. Upsert maturity definitions
  for (const def of MATURITY_DEFINITIONS) {
    await prisma.maturityDefinition.upsert({
      where: { level: def.level },
      update: def,
      create: def,
    });
  }
  console.log(`Seeded ${MATURITY_DEFINITIONS.length} maturity definitions`);

  // 2. Upsert domains (with numeric weights)
  const domainMap: Record<string, string> = {};
  for (const d of Object.values(DOMAIN_ROWS)) {
    const weight = DOMAIN_WEIGHTS[d.code] ?? 1.0;
    const domain = await prisma.domain.upsert({
      where: { code: d.code },
      update: { name: d.name, sortOrder: d.sortOrder, weight },
      create: { ...d, weight },
    });
    domainMap[d.code] = domain.id;
  }
  console.log(`Seeded ${Object.keys(DOMAIN_ROWS).length} domains (with weights)`);

  // 3. Read Excel and import controls
  const workbook = new ExcelJS.Workbook();
  const excelPath = path.resolve(__dirname, '../../ISO27k ISMS Self Assessment Workshop Sheet (1).xlsx');
  await workbook.xlsx.readFile(excelPath);

  const sheet = workbook.worksheets[0];
  let currentDomainId: string | null = null;
  let controlCount = 0;
  const controlsData: Array<{
    controlId: string;
    name: string;
    domainId: string;
    maturity: string;
    notes: string;
    sortOrder: number;
  }> = [];

  for (let r = 3; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const colB = row.getCell(2).value?.toString().trim() ?? '';
    const colC = row.getCell(3).value?.toString().trim() ?? '';
    const colD = row.getCell(4).value?.toString().trim() ?? '';
    const colE = row.getCell(5).value?.toString().trim() ?? '';

    if (DOMAIN_ROWS[colB]) {
      currentDomainId = domainMap[colB];
      continue;
    }

    if (colB.match(/^A\.\d+\.\d+$/) && currentDomainId) {
      controlCount++;
      controlsData.push({
        controlId: colB,
        name: colC,
        domainId: currentDomainId,
        maturity: colD,
        notes: colE,
        sortOrder: controlCount,
      });
    }
  }

  // Upsert controls with numeric weight (converted from old criticality)
  for (const c of controlsData) {
    const critLevel = CONTROL_CRITICALITY[c.controlId] ?? 'MEDIUM';
    const weight = CRITICALITY_WEIGHTS[critLevel] ?? 1.0;

    await prisma.control.upsert({
      where: { controlId: c.controlId },
      update: { name: c.name, domainId: c.domainId, sortOrder: c.sortOrder, weight },
      create: {
        controlId: c.controlId,
        name: c.name,
        domainId: c.domainId,
        sortOrder: c.sortOrder,
        weight,
      },
    });
  }
  console.log(`Seeded ${controlCount} controls (with weights)`);

  // 4. Create default admin user
  const adminEmail = 'admin@isms.local';
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log(`Admin user: ${adminEmail} / admin123`);

  // 5. Create an initial assessment from the Excel data
  const existingAssessment = await prisma.assessment.findFirst({
    where: { title: 'ISO 27001 Initial Assessment (Excel Import)' },
  });

  let assessment = existingAssessment;
  if (!assessment) {
    assessment = await prisma.assessment.create({
      data: {
        title: 'ISO 27001 Initial Assessment (Excel Import)',
        status: 'DRAFT',
        createdBy: admin.id,
      },
    });
  }

  // 6. Create responses from Excel data (directly with controlId)
  for (const c of controlsData) {
    const control = await prisma.control.findUnique({
      where: { controlId: c.controlId },
    });
    if (!control) continue;

    await prisma.response.upsert({
      where: {
        assessmentId_controlId: {
          assessmentId: assessment.id,
          controlId: control.id,
        },
      },
      update: {
        maturityLevel: c.maturity,
        notes: c.notes,
      },
      create: {
        assessmentId: assessment.id,
        controlId: control.id,
        maturityLevel: c.maturity,
        notes: c.notes,
      },
    });
  }
  console.log(`Created assessment with ${controlsData.length} responses`);

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
