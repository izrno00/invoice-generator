type Named = { fullName: string | null; companyName: string | null }

/** The sender in email subjects and the From line: Company → Full name. */
export function senderName({ companyName, fullName }: Named): string | null {
  return companyName?.trim() || fullName?.trim() || null
}

/** Who "Hi …," greets: a person first, then the company. Null means just "Hi,". */
export function greetingName({ fullName, companyName }: Named): string | null {
  return fullName?.trim() || companyName?.trim() || null
}
