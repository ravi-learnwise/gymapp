import ExcelJS from 'exceljs';
import { Gender, PaymentMode, ProgramEnrollmentType } from '@prisma/client';
import { MEMBER_IMPORT_COLUMNS } from './member-import.columns';

type ProgramRef = {
  name: string;
  enrollmentType: ProgramEnrollmentType;
  durations: { label: string; months: number; price: unknown }[];
};

type TrainerRef = { email: string; firstName: string | null; lastName: string | null };

export async function buildMemberImportWorkbook(
  programs: ProgramRef[],
  trainers: TrainerRef[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GymApp';
  wb.created = new Date();

  addInstructionsSheet(wb);
  addMembersSheet(wb, programs);
  addReferenceSheet(wb, programs, trainers);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function addInstructionsSheet(wb: ExcelJS.Workbook) {
  const sheet = wb.addWorksheet('Instructions', { views: [{ showGridLines: false }] });
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 92;

  const title = sheet.getRow(1);
  title.getCell(1).value = 'GymApp — Active Member Import';
  title.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
  sheet.mergeCells('A1:B1');

  sheet.getRow(2).getCell(1).value =
    'Use this workbook to load currently active members only. Elapsed / lapsed members should not be imported — treat them as new enquiries if they return.';
  sheet.mergeCells('A2:B2');
  sheet.getRow(2).getCell(1).alignment = { wrapText: true };
  sheet.getRow(2).height = 36;

  const rows: Array<[string, string]> = [
    ['Who to include', 'Only members whose primary membership is still valid today. Do not add expired or cancelled members.'],
    ['How it works', 'Each row creates a member record. The system silently creates a paired enquiry and converts it to a member, membership, and payment so data stays consistent with the live CRM flow.'],
    ['Required columns', 'Full Name, Mobile Number (10-digit India mobile starting 6–9), Program Name, Duration, Membership Start Date.'],
    ['Program & duration', 'Values must match the Reference sheet exactly (same spelling). Duration can be the label (e.g. 3 Months) or the number of months (e.g. 3).'],
    ['End date', 'Leave blank to calculate from start date + duration. If you know the actual expiry, fill Membership End Date. Rows with an end date already in the past are rejected.'],
    ['Payments', 'Amount Paid is the money already collected for this current membership. If the fee was discounted, put the reduction in Discount Amount so Amount Paid can equal the final fee. Leave Amount Paid blank if payment is still pending.'],
    ['Payment mode', 'Required when Amount Paid is greater than 0. Allowed: CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, OTHER.'],
    ['Existing Member ID', 'Optional. Use the gym’s current ID if you want to keep it. Leave blank to auto-generate (MEM-YYYY-0001).'],
    ['Gender', 'MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY (Male/Female also accepted).'],
    ['Dates', 'Use YYYY-MM-DD or DD/MM/YYYY. Excel date cells are also accepted.'],
    ['Duplicates', 'A mobile number can only belong to one member. Duplicate rows or numbers already in the system are skipped with an error.'],
    ['Sheet to fill', 'Enter data on the Members sheet. Do not rename column headers. The Reference sheet is a lookup list — do not type members there.'],
  ];

  rows.forEach(([label, text], i) => {
    const row = sheet.getRow(4 + i);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = text;
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    row.height = 42;
  });

  const exampleRow = 4 + rows.length + 1;
  sheet.getRow(exampleRow).getCell(1).value = 'Example';
  sheet.getRow(exampleRow).getCell(1).font = { bold: true };
  sheet.getRow(exampleRow).getCell(2).value =
    'Rahul Sharma | 9876543210 | General Fitness | 12 Months | start 2026-03-01 | discount 1000 | amount paid 14000 | UPI';
  sheet.getRow(exampleRow).getCell(2).alignment = { wrapText: true };
}

function addMembersSheet(wb: ExcelJS.Workbook, programs: ProgramRef[]) {
  const sheet = wb.addWorksheet('Members', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const header = sheet.getRow(1);
  header.height = 22;
  MEMBER_IMPORT_COLUMNS.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width;
    const cell = header.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? 'FF1D4ED8' : 'FF334155' },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });

  const programNames = programs
    .filter((p) => p.enrollmentType !== ProgramEnrollmentType.ADD_ON)
    .map((p) => p.name);
  const durationLabels = [
    ...new Set(programs.flatMap((p) => p.durations.map((d) => d.label))),
  ];
  const genderList = 'MALE,FEMALE,OTHER,PREFER_NOT_TO_SAY';
  const paymentList = 'CASH,UPI,CARD,BANK_TRANSFER,CHEQUE,OTHER';

  const colIndex = (key: string) => MEMBER_IMPORT_COLUMNS.findIndex((c) => c.key === key) + 1;

  for (let row = 2; row <= 201; row++) {
    addListValidation(sheet, row, colIndex('gender'), genderList);
    addListValidation(sheet, row, colIndex('paymentMode'), paymentList);
    if (programNames.length) {
      addListValidation(sheet, row, colIndex('programName'), programNames.join(','));
    }
    if (durationLabels.length) {
      addListValidation(sheet, row, colIndex('durationLabel'), durationLabels.join(','));
    }
  }
}

function addListValidation(sheet: ExcelJS.Worksheet, row: number, col: number, csv: string) {
  if (col < 1 || !csv || csv.length > 240 || csv.includes('"')) return;
  sheet.getCell(row, col).dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`"${csv}"`],
    showErrorMessage: true,
    errorTitle: 'Invalid value',
    error: 'Pick a value from the list, or type an allowed value from the Instructions sheet.',
  };
}

function addReferenceSheet(
  wb: ExcelJS.Workbook,
  programs: ProgramRef[],
  trainers: TrainerRef[],
) {
  const sheet = wb.addWorksheet('Reference');
  sheet.columns = [
    { header: 'Program Name', width: 24 },
    { header: 'Duration', width: 16 },
    { header: 'Months', width: 10 },
    { header: 'Price (₹)', width: 14 },
    { header: 'Type', width: 16 },
    { header: 'Trainer Email', width: 28 },
    { header: 'Trainer Name', width: 24 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  const programRows = programs.flatMap((p) =>
    p.durations.map((d) => ({
      name: p.name,
      label: d.label,
      months: d.months,
      price: Number(d.price),
      type: p.enrollmentType,
    })),
  );

  const max = Math.max(programRows.length, trainers.length, 1);
  for (let i = 0; i < max; i++) {
    const row = sheet.getRow(i + 2);
    const prog = programRows[i];
    const trainer = trainers[i];
    if (prog) {
      row.getCell(1).value = prog.name;
      row.getCell(2).value = prog.label;
      row.getCell(3).value = prog.months;
      row.getCell(4).value = prog.price;
      row.getCell(5).value = prog.type;
    }
    if (trainer) {
      row.getCell(6).value = trainer.email;
      row.getCell(7).value = [trainer.firstName, trainer.lastName].filter(Boolean).join(' ') || trainer.email;
    }
  }
}
