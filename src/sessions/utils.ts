const EMAIL_REGEX = new RegExp(
  '[a-zA-Z0-9.!#$%&\'*+=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*',
);
const LONG_NUMBER_REGEX = new RegExp('[0-9]{9,16}'); // unformatted ssn, phone numbers, or credit card numbers
const SSN_REGEX = new RegExp('[0-9]{3}-?[0-9]{2}-?[0-9]{4}');
const PHONE_NUMBER_REGEX = new RegExp(
  '[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}',
);
const CREDIT_CARD_REGEX = new RegExp('[0-9]{4}-?[0-9]{4}-?[0-9]{4}-?[0-9]{4}');
const ADDRESS_REGEX = new RegExp(
  '[0-9]{1,5}.?[0-9]{0,3}s[a-zA-Z]{2,30}s[a-zA-Z]{2,15}',
);
const IP_REGEX = new RegExp('(?:[0-9]{1,3}.){3}[0-9]{1,3}');

export const defaultMaskText = (text: string) => {
  return text
    .replace(EMAIL_REGEX, '***@***.***')
    .replace(LONG_NUMBER_REGEX, '************')
    .replace(SSN_REGEX, '***-**-****')
    .replace(PHONE_NUMBER_REGEX, '***-***-****')
    .replace(CREDIT_CARD_REGEX, '****-****-****-****')
    .replace(ADDRESS_REGEX, '*** *** ***')
    .replace(IP_REGEX, '***.***.***.***');
};