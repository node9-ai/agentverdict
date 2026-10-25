// The class of each fraud-enabling (high) tag of the PII sources, by the
// source's own tag name, as decided for the official set:
//
//   kept          a guard can recognise the value: it has a known shape or a
//                 check digit (IBAN, SSN, bank routing number, API key,
//                 cookie, password)
//   card          a card number; kept when it passes Luhn, out otherwise
//                 (src/scope/luhn.ts)
//   no-checksum   a plain digit string with no check digit (passport, licence,
//                 ID, tax, account, PIN, CVV, medical numbers): out
//   biometric     no fixed shape: out
//
// A document stays official when any of its high tags is kept (or a valid
// card). Every high tag of each source's rule must be classified here;
// test/scope.test.ts checks the lists against the snapshots, so a new tag is
// classified on purpose rather than by default.

export type PiiClass = 'kept' | 'card' | 'no-checksum' | 'biometric';

export const PII_HIGH_TAGS: Record<string, Record<string, PiiClass>> = {
  'nemotron-pii': {
    ssn: 'kept',
    iban: 'kept',
    bank_routing_number: 'kept',
    api_key: 'kept',
    http_cookie: 'kept',
    password: 'kept',
    credit_debit_card: 'card',
    national_id: 'no-checksum',
    tax_id: 'no-checksum',
    passport_number: 'no-checksum',
    driver_license_number: 'no-checksum',
    certificate_license_number: 'no-checksum',
    cvv: 'no-checksum',
    account_number: 'no-checksum',
    pin: 'no-checksum',
    medical_record_number: 'no-checksum',
    health_plan_beneficiary_number: 'no-checksum',
    biometric_identifier: 'biometric',
  },
  'gretel-pii-finance': {
    ssn: 'kept',
    iban: 'kept',
    bank_routing_number: 'kept',
    api_key: 'kept',
    password: 'kept',
    credit_card_number: 'card',
    credit_card_security_code: 'no-checksum',
    driver_license_number: 'no-checksum',
    passport_number: 'no-checksum',
    bban: 'no-checksum',
    account_pin: 'no-checksum',
  },
  openpii: {
    SOCIALNUM: 'kept',
    CREDITCARDNUMBER: 'card',
    DRIVERLICENSENUM: 'no-checksum',
    IDCARDNUM: 'no-checksum',
    PASSPORTNUM: 'no-checksum',
    TAXNUM: 'no-checksum',
  },
};

/** Tag namespaces the converters write and the scope rules read. */
export const TAG = {
  pii: (tag: string) => `pii:${tag}`,
  creddata: (category: string) => `creddata:${category}`,
  cardValid: 'card:luhn-valid',
  cardInvalid: 'card:luhn-invalid',
} as const;
