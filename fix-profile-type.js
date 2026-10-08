const fs = require('fs');
let content = fs.readFileSync('src/components/profile/exchange-details-drawer.tsx', 'utf8');

const startStr = 'type Profile = {';
const endStr = 'isDefault: boolean;\r\n};';
const endStr2 = 'isDefault: boolean;\n};';

let startIndex = content.indexOf(startStr);
let endIndex = content.indexOf(endStr);
if (endIndex === -1) endIndex = content.indexOf(endStr2);

if (startIndex > -1 && endIndex > -1) {
  // Find the exact closing brace
  const actualEndIndex = content.indexOf('}', startIndex) + 1;
  const oldType = content.substring(startIndex, actualEndIndex);
  const newType = `type Profile = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  isDefault: boolean;
};`;
  content = content.replace(oldType, newType);
}

// Line 294 issue: Argument of type 'string | null' is not assignable to parameter of type 'SetStateAction<string>'.
// This is because `defaultProfile.id` might be `string | null`? No, id is `string`.
// Wait, `setSelectedProfileId(defaultProfile.id || "");`
// Maybe `setSelectedProfileId(val)` where `val` is `string | null`?
// Let's replace `setSelectedProfileId(val)` with `setSelectedProfileId(val || "")`.
content = content.replace('setSelectedProfileId(val);', 'setSelectedProfileId(val || "");');

fs.writeFileSync('src/components/profile/exchange-details-drawer.tsx', content);
console.log('Fixed Profile type');
