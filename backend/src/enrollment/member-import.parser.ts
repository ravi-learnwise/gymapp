import ExcelJS from 'exceljs';
import { Gender, PaymentMode } from '@prisma/client';
import { HEADER_ALIASES, MEMBER_IMPORT_COLUMNS, type MemberImportColumnKey } from './member-import.columns';

export type ParsedImportRow = {
  excelRow: number;
  fullName: string;
  mobileNumber: string;
  alternateContact?: string;
  email?: string;
  gender?: Gender;
  age?: number;
  dateOfBirth?: string;
  profession?: string;
  address?: string;
  familyDetails?: string;
  existingMemberId?: string;
  programName: string;
  durationLabel: string;
  membershipStartDate: string;
  membershipEndDate?: string;
  trainerEmail?: string;
  discountAmount?: number;
  amountPaid?: number;
  paymentMode?: PaymentMode;
  paymentDate?: string;
  paymentNotes?: string;
  height?: number;
  weight?: number;
  medicalHistory?: string;
  allergies?: string;
  dietType?: string;
  fitnessGoals?: string;
};

export type ParsedWorkbook = {
  rows: ParsedImportRow[];
  rowErrors: Array<{ excelRow: number; error: string }>;
};

const GENDER_MAP: Record<string, Gender> = {
  m: Gender.MALE,
  male: Gender.MALE,
  f: Gender.FEMALE,
  female: Gender.FEMALE,
  other: Gender.OTHER,
  o: Gender.OTHER,
  prefer_not_to_say: Gender.PREFER_NOT_TO_SAY,
  'prefer not to say': Gender.PREFER_NOT_TO_SAY,
  pnts: Gender.PREFER_NOT_TO_SAY,
};

const PAYMENT_MODE_MAP: Record<string, PaymentMode> = {
  cash: PaymentMode.CASH,
  upi: PaymentMode.UPI,
  card: PaymentMode.CARD,
  'credit card': PaymentMode.CARD,
  'debit card': PaymentMode.CARD,
  bank_transfer: PaymentMode.BANK_TRANSFER,
  'bank transfer': PaymentMode.BANK_TRANSFER,
  neft: PaymentMode.BANK_TRANSFER,
  rtgs: PaymentMode.BANK_TRANSFER,
  imps: PaymentMode.BANK_TRANSFER,
  cheque: PaymentMode.CHEQUE,
  check: PaymentMode.CHEQUE,
  other: PaymentMode.OTHER,
};

export async function parseMemberImportWorkbook(buffer: Buffer): Promise<ParsedWorkbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheet =
    wb.getWorksheet('Members') ??
    wb.worksheets.find((s) => s.name.toLowerCase() !== 'instructions' && s.name.toLowerCase() !== 'reference') ??
    wb.worksheets[0];

  if (!sheet) {
    return { rows: [], rowErrors: [{ excelRow: 0, error: 'Workbook has no worksheets' }] };
  }

  const headerMap = readHeaderMap(sheet);
  if (!headerMap.fullName || !headerMap.mobileNumber || !headerMap.programName || !headerMap.durationLabel || !headerMap.membershipStartDate) {
    return {
      rows: [],
      rowErrors: [
        {
          excelRow: 1,
          error:
            'Members sheet is missing required headers. Keep: Full Name, Mobile Number, Program Name, Duration, Membership Start Date.',
        },
      ],
    };
  }

  const rows: ParsedImportRow[] = [];
  const rowErrors: Array<{ excelRow: number; error: string }> = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = Object.fromEntries(
      MEMBER_IMPORT_COLUMNS.map((col) => [col.key, cellValue(row.getCell(headerMap[col.key] ?? 0))]),
    ) as Record<MemberImportColumnKey, unknown>;

    const fullName = asString(values.fullName);
    const mobileNumber = asString(values.mobileNumber);
    const programName = asString(values.programName);
    const durationLabel = asString(values.durationLabel);
    const startRaw = values.membershipStartDate;

    if (!fullName && !mobileNumber && !programName && !durationLabel && isEmpty(startRaw)) {
      return;
    }

    const errors: string[] = [];
    if (!fullName) errors.push('Full Name is required');
    if (!mobileNumber) errors.push('Mobile Number is required');
    if (!programName) errors.push('Program Name is required');
    if (!durationLabel) errors.push('Duration is required');

    const membershipStartDate = parseDateToIso(startRaw);
    if (!membershipStartDate) errors.push('Membership Start Date is required (YYYY-MM-DD or DD/MM/YYYY)');

    const gender = parseGender(values.gender);
    if (!isEmpty(values.gender) && !gender) errors.push('Gender must be MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY');

    const paymentMode = parsePaymentMode(values.paymentMode);
    if (!isEmpty(values.paymentMode) && !paymentMode) {
      errors.push('Payment Mode must be CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, or OTHER');
    }

    const amountPaid = parseNumber(values.amountPaid);
    if (amountPaid != null && amountPaid < 0) errors.push('Amount Paid cannot be negative');
    if ((amountPaid ?? 0) > 0 && !paymentMode) errors.push('Payment Mode is required when Amount Paid is greater than 0');

    const discountAmount = parseNumber(values.discountAmount);
    if (discountAmount != null && discountAmount < 0) errors.push('Discount Amount cannot be negative');

    const age = parseNumber(values.age);
    if (age != null && (age < 1 || age > 120)) errors.push('Age must be between 1 and 120');

    const height = parseNumber(values.heightCm);
    const weight = parseNumber(values.weightKg);

    const dateOfBirth = parseDateToIso(values.dateOfBirth);
    if (!isEmpty(values.dateOfBirth) && !dateOfBirth) errors.push('Date of Birth is invalid');

    const membershipEndDate = parseDateToIso(values.membershipEndDate);
    if (!isEmpty(values.membershipEndDate) && !membershipEndDate) errors.push('Membership End Date is invalid');

    const paymentDate = parseDateToIso(values.paymentDate);
    if (!isEmpty(values.paymentDate) && !paymentDate) errors.push('Payment Date is invalid');

    const email = asString(values.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email is invalid');

    if (errors.length) {
      rowErrors.push({ excelRow: rowNumber, error: errors.join('; ') });
      return;
    }

    rows.push({
      excelRow: rowNumber,
      fullName,
      mobileNumber,
      alternateContact: asString(values.alternateContact) || undefined,
      email: email || undefined,
      gender,
      age: age ?? undefined,
      dateOfBirth: dateOfBirth || undefined,
      profession: asString(values.profession) || undefined,
      address: asString(values.address) || undefined,
      familyDetails: asString(values.familyDetails) || undefined,
      existingMemberId: asString(values.existingMemberId) || undefined,
      programName,
      durationLabel,
      membershipStartDate: membershipStartDate!,
      membershipEndDate: membershipEndDate || undefined,
      trainerEmail: asString(values.trainerEmail) || undefined,
      discountAmount: discountAmount ?? undefined,
      amountPaid: amountPaid ?? undefined,
      paymentMode,
      paymentDate: paymentDate || undefined,
      paymentNotes: asString(values.paymentNotes) || undefined,
      height: height ?? undefined,
      weight: weight ?? undefined,
      medicalHistory: asString(values.medicalHistory) || undefined,
      allergies: asString(values.allergies) || undefined,
      dietType: asString(values.dietType) || undefined,
      fitnessGoals: asString(values.fitnessGoals) || undefined,
    });
  });

  return { rows, rowErrors };
}

function readHeaderMap(sheet: ExcelJS.Worksheet): Partial<Record<MemberImportColumnKey, number>> {
  const headerRow = sheet.getRow(1);
  const map: Partial<Record<MemberImportColumnKey, number>> = {};
  headerRow.eachCell((cell, colNumber) => {
    const label = asString(cell.value).toLowerCase().replace(/\s+/g, ' ').trim();
    const key = HEADER_ALIASES[label];
    if (key) map[key] = colNumber;
  });
  return map;
}

function cellValue(cell: ExcelJS.Cell | undefined): unknown {
  if (!cell) return undefined;
  const v = cell.value;
  if (v && typeof v === 'object' && 'text' in v) return (v as { text: string }).text;
  if (v && typeof v === 'object' && 'result' in v) return (v as { result: unknown }).result;
  if (v && typeof v === 'object' && 'hyperlink' in v && 'text' in (v as object)) {
    return (v as { text?: string }).text;
  }
  return v;
}

function asString(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return formatIsoDate(value);
  return String(value).trim();
}

function isEmpty(value: unknown): boolean {
  return value == null || asString(value) === '';
}

function parseNumber(value: unknown): number | undefined {
  if (isEmpty(value)) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/[,₹\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function parseGender(value: unknown): Gender | undefined {
  if (isEmpty(value)) return undefined;
  return GENDER_MAP[asString(value).toLowerCase()];
}

function parsePaymentMode(value: unknown): PaymentMode | undefined {
  if (isEmpty(value)) return undefined;
  const raw = asString(value).toLowerCase();
  const underscored = raw.replace(/[\s-]+/g, '_');
  return PAYMENT_MODE_MAP[underscored] ?? PAYMENT_MODE_MAP[raw];
}

function parseDateToIso(value: unknown): string | undefined {
  if (isEmpty(value)) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return formatIsoDate(value);
  if (typeof value === 'number' && Number.isFinite(value)) {
    const utc = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!Number.isNaN(utc.getTime())) return formatIsoDate(utc);
  }
  const s = asString(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    const d = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return `${year}-${month}-${day}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return formatIsoDate(parsed);
  return undefined;
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
