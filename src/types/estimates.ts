import { z } from 'zod';
import type { Customer } from './business';

export type EstimateStatus =
  | 'Draft'
  | 'Sent'
  | 'Approved'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Converted';

export type EstimateCategory =
  | 'Material'
  | 'Labour'
  | 'Electrical'
  | 'Plumbing'
  | 'Interior'
  | 'Other';

export const ESTIMATE_CATEGORIES: EstimateCategory[] = [
  'Material',
  'Labour',
  'Electrical',
  'Plumbing',
  'Interior',
  'Other',
];

export const ESTIMATE_UNITS = [
  { value: 'sq.ft', label: 'Sq.ft (Square Feet)' },
  { value: 'rft', label: 'R.ft (Running Feet)' },
  { value: 'nos', label: 'Nos (Units / Pieces)' },
  { value: 'lumpsum', label: 'Lumpsum (LS)' },
  { value: 'bags', label: 'Bags (Cement / Adhesive)' },
  { value: 'ton', label: 'Ton (Steel / TMT)' },
  { value: 'cum', label: 'Cum (Cubic Metre)' },
  { value: 'cft', label: 'Cft (Cubic Feet / Timber)' },
  { value: 'brass', label: 'Brass (Aggregates / Sand)' },
] as const;

export interface EstimateItem {
  id: string;
  company_id: string;
  estimate_id: string;
  category: EstimateCategory;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  sort_order: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Estimate {
  id: string;
  company_id: string;
  customer_id: string;
  enquiry_id?: string | null;
  estimate_number: string;
  estimate_date: string;
  valid_until?: string | null;
  title?: string | null;
  notes?: string | null;
  status: EstimateStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'address' | 'email'> | null;
  enquiry?: {
    id: string;
    description: string | null;
    status: string;
  } | null;
  items?: EstimateItem[];
}

export const estimateItemFormSchema = z.object({
  id: z.string().optional(),
  category: z.enum(['Material', 'Labour', 'Electrical', 'Plumbing', 'Interior', 'Other']),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.coerce.number().min(0, 'Unit price cannot be negative'),
  amount: z.number().min(0),
  sort_order: z.number().default(0),
  notes: z.string().optional().nullable(),
});

export const estimateFormSchema = z.object({
  customer_id: z.string().min(1, 'Customer selection is required'),
  enquiry_id: z.string().optional().nullable(),
  estimate_date: z.string().min(1, 'Estimate date is required'),
  valid_until: z.string().optional().nullable(),
  title: z.string().min(1, 'Estimate title or project scope heading is required'),
  notes: z.string().optional().nullable(),
  status: z.enum(['Draft', 'Sent', 'Approved', 'Accepted', 'Rejected', 'Expired', 'Converted']),
  items: z.array(estimateItemFormSchema).min(1, 'At least one line item is required'),
});

export type EstimateItemFormData = z.infer<typeof estimateItemFormSchema>;
export type EstimateFormData = z.infer<typeof estimateFormSchema>;

/**
 * Utility to convert numbers to Indian Rupee Words representation
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000)
      return (
        inWords(Math.floor(n / 100)) +
        ' Hundred' +
        (n % 100 === 0 ? '' : ' and ' + inWords(n % 100))
      );
    return '';
  }

  const integerPart = Math.floor(num);
  let words = '';

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundred = remainder;

  if (crore > 0) {
    words += inWords(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += inWords(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += inWords(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += inWords(hundred);
  }

  return `Rupees ${words.trim()} Only`;
}
