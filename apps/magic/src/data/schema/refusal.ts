// A refusal: "no, and here is why", in a shape a screen can show.
//
// WHO DECIDES WHAT. We decide whether something is WELL-FORMED — is it a number, is it
// filled in, is the date real, does the arithmetic add up. They decide whether it is
// ALLOWED — does this GSTIN exist, is the party over its credit limit, is there stock to
// sell. An invented business rule in here is a rule the dev team has to find and delete
// later, so there are none.
//
// THIS TYPE CANNOT BE CONSTRUCTED BY A COMPONENT. The brand below is a symbol nothing else
// can name, so an object literal will not satisfy the type, and `refuse` is the only way to
// make one. A lint rule stops anything outside the schema layer and the adapter from
// importing it. Every screen may SHOW a refusal; none may invent one.

declare const wellFormed: unique symbol

export type Refusal = {
  readonly [wellFormed]: true
  /** Stable, for the code to branch on. Never shown to anybody. */
  readonly code: string
  /** Shown as it is. Says what to correct, in the words of the person correcting it. */
  readonly message: string
  /** Which field to put the cursor in, when the refusal is about one. */
  readonly field?: string
}

/** The only way to make a Refusal. Importable only by the schema layer and the adapter. */
export function refuse(code: string, message: string, field?: string): Refusal {
  return { code, message, ...(field === undefined ? {} : { field }) } as Refusal
}

export function isRefusal(value: unknown): value is Refusal {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value
}
