export type MemberImportColumnKey =
  | 'fullName'
  | 'mobileNumber'
  | 'alternateContact'
  | 'email'
  | 'gender'
  | 'age'
  | 'dateOfBirth'
  | 'profession'
  | 'address'
  | 'familyDetails'
  | 'existingMemberId'
  | 'programName'
  | 'durationLabel'
  | 'membershipStartDate'
  | 'membershipEndDate'
  | 'trainerEmail'
  | 'discountAmount'
  | 'amountPaid'
  | 'paymentMode'
  | 'paymentDate'
  | 'paymentNotes'
  | 'heightCm'
  | 'weightKg'
  | 'medicalHistory'
  | 'allergies'
  | 'dietType'
  | 'fitnessGoals';

export const MEMBER_IMPORT_COLUMNS: Array<{
  key: MemberImportColumnKey;
  header: string;
  width: number;
  required?: boolean;
}> = [
  { key: 'fullName', header: 'Full Name', width: 22, required: true },
  { key: 'mobileNumber', header: 'Mobile Number', width: 16, required: true },
  { key: 'alternateContact', header: 'Alternate Contact', width: 16 },
  { key: 'email', header: 'Email', width: 24 },
  { key: 'gender', header: 'Gender', width: 16 },
  { key: 'age', header: 'Age', width: 8 },
  { key: 'dateOfBirth', header: 'Date of Birth', width: 16 },
  { key: 'profession', header: 'Profession', width: 16 },
  { key: 'address', header: 'Address', width: 28 },
  { key: 'familyDetails', header: 'Family Details', width: 20 },
  { key: 'existingMemberId', header: 'Existing Member ID', width: 20 },
  { key: 'programName', header: 'Program Name', width: 22, required: true },
  { key: 'durationLabel', header: 'Duration', width: 14, required: true },
  { key: 'membershipStartDate', header: 'Membership Start Date', width: 22, required: true },
  { key: 'membershipEndDate', header: 'Membership End Date', width: 20 },
  { key: 'trainerEmail', header: 'Trainer Email', width: 24 },
  { key: 'discountAmount', header: 'Discount Amount', width: 16 },
  { key: 'amountPaid', header: 'Amount Paid', width: 14 },
  { key: 'paymentMode', header: 'Payment Mode', width: 16 },
  { key: 'paymentDate', header: 'Payment Date', width: 16 },
  { key: 'paymentNotes', header: 'Payment Notes', width: 20 },
  { key: 'heightCm', header: 'Height (cm)', width: 12 },
  { key: 'weightKg', header: 'Weight (kg)', width: 12 },
  { key: 'medicalHistory', header: 'Medical History', width: 20 },
  { key: 'allergies', header: 'Allergies', width: 16 },
  { key: 'dietType', header: 'Diet Type', width: 14 },
  { key: 'fitnessGoals', header: 'Fitness Goals', width: 20 },
];

export const HEADER_ALIASES: Record<string, MemberImportColumnKey> = {
  'full name': 'fullName',
  name: 'fullName',
  member: 'fullName',
  'member name': 'fullName',
  'mobile number': 'mobileNumber',
  mobile: 'mobileNumber',
  phone: 'mobileNumber',
  'phone number': 'mobileNumber',
  'alternate contact': 'alternateContact',
  'alternate number': 'alternateContact',
  'alt contact': 'alternateContact',
  email: 'email',
  'email id': 'email',
  gender: 'gender',
  sex: 'gender',
  age: 'age',
  'date of birth': 'dateOfBirth',
  dob: 'dateOfBirth',
  profession: 'profession',
  occupation: 'profession',
  address: 'address',
  'family details': 'familyDetails',
  family: 'familyDetails',
  'existing member id': 'existingMemberId',
  'member id': 'existingMemberId',
  'member number': 'existingMemberId',
  'program name': 'programName',
  program: 'programName',
  duration: 'durationLabel',
  'duration label': 'durationLabel',
  'program duration': 'durationLabel',
  'membership start date': 'membershipStartDate',
  'start date': 'membershipStartDate',
  'join date': 'membershipStartDate',
  'membership end date': 'membershipEndDate',
  'end date': 'membershipEndDate',
  'valid till': 'membershipEndDate',
  'expiry date': 'membershipEndDate',
  'trainer email': 'trainerEmail',
  trainer: 'trainerEmail',
  'discount amount': 'discountAmount',
  discount: 'discountAmount',
  'amount paid': 'amountPaid',
  paid: 'amountPaid',
  payment: 'amountPaid',
  'payment mode': 'paymentMode',
  'mode of payment': 'paymentMode',
  'payment date': 'paymentDate',
  'payment notes': 'paymentNotes',
  'height (cm)': 'heightCm',
  height: 'heightCm',
  'weight (kg)': 'weightKg',
  weight: 'weightKg',
  'medical history': 'medicalHistory',
  allergies: 'allergies',
  'diet type': 'dietType',
  'fitness goals': 'fitnessGoals',
};
