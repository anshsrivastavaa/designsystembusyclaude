// The kinds of document this screen can be, in the order the switcher offers them.
//
// ONE LIST, because the title reads from it, the switcher offers from it, and anything that
// later wants to know what a voucher can be reads the same names. Two lists of document types
// disagree the first time one of them learns about a sixth.
//
// TAKEN FROM v2 RATHER THAN RE-DECIDED. Its switcher offers exactly these five and Invoice is in
// the list so there is a way back — the menu drops whichever one you are already on, so "Switch
// to Invoice" appears only when you are not on an invoice.

export const VOUCHER_TYPES = ['Invoice', 'Sale Return', 'Quotation', 'Order', 'Challan'] as const

export type VoucherType = (typeof VOUCHER_TYPES)[number]
