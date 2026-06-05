import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

interface ParsedControl {
  controlId: string;
  maturity: string;
  notes: string;
}

export async function importExcelAssessment(
  filePath: string,
  title: string,
  userId: string
): Promise<{ assessmentId: string; importedCount: number }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.worksheets[0];
  const parsed: ParsedControl[] = [];

  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const colB = row.getCell(2).value?.toString().trim() ?? '';
    const colD = row.getCell(4).value?.toString().trim() ?? '';
    const colE = row.getCell(5).value?.toString().trim() ?? '';

    if (colB.match(/^A\.\d+\.\d+$/)) {
      parsed.push({ controlId: colB, maturity: colD, notes: colE });
    }
  }

  const assessment = await prisma.assessment.create({
    data: { title, status: 'DRAFT', createdBy: userId },
  });

  let importedCount = 0;
  for (const p of parsed) {
    const control = await prisma.control.findUnique({
      where: { controlId: p.controlId },
    });
    if (!control) continue;

    await prisma.response.create({
      data: {
        assessmentId: assessment.id,
        controlId: control.id,
        maturityLevel: p.maturity,
        notes: p.notes,
      },
    });
    importedCount++;
  }

  // Snapshot global weights into assessment
  const allDomains = await prisma.domain.findMany();
  const allControls = await prisma.control.findMany();

  await prisma.assessmentDomainWeight.createMany({
    data: allDomains.map((d) => ({
      assessmentId: assessment.id,
      domainId: d.id,
      weight: d.weight,
    })),
  });
  await prisma.assessmentControlWeight.createMany({
    data: allControls.map((c) => ({
      assessmentId: assessment.id,
      controlId: c.id,
      weight: c.weight,
    })),
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: assessment.id,
      userId,
      action: 'EXCEL_IMPORT',
      details: { fileName: filePath.split('/').pop(), controlCount: importedCount },
    },
  });

  return { assessmentId: assessment.id, importedCount };
}

export async function exportAssessmentToExcel(assessmentId: string): Promise<ExcelJS.Workbook> {
  const assessment = await prisma.assessment.findUniqueOrThrow({
    where: { id: assessmentId },
    include: {
      responses: {
        include: {
          control: { include: { domain: true } },
        },
        orderBy: { control: { sortOrder: 'asc' } },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ISO 27001 Controls');

  // Header row
  sheet.getRow(1).values = ['', 'Statement of Applicability and Status of Information Security Controls'];
  sheet.getRow(2).values = ['', 'Section', 'Information security control', 'Status', 'Notes'];
  sheet.getRow(2).font = { bold: true };

  let currentDomain = '';
  let rowIdx = 3;

  for (const resp of assessment.responses) {
    const control = resp.control;
    const domain = control.domain;

    if (domain.code !== currentDomain) {
      currentDomain = domain.code;
      const domainRow = sheet.getRow(rowIdx);
      domainRow.getCell(2).value = domain.code;
      domainRow.getCell(3).value = domain.name;
      domainRow.getCell(4).value = domain.name;
      domainRow.getCell(5).value = domain.name;
      domainRow.font = { bold: true };
      rowIdx++;
    }

    const row = sheet.getRow(rowIdx);
    row.getCell(2).value = control.controlId;
    row.getCell(3).value = control.name;
    row.getCell(4).value = resp.maturityLevel;
    row.getCell(5).value = resp.notes;
    rowIdx++;
  }

  // Auto-width columns
  sheet.columns.forEach((col) => {
    col.width = 30;
  });

  return workbook;
}
