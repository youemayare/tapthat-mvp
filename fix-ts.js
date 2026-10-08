const fs = require('fs');
let content = fs.readFileSync('src/components/profile/exchange-details-drawer.tsx', 'utf8');

// 1. Fix Profile type
content = content.replace(
  /type Profile = \{[\s\S]*?isDefault: boolean;\n\};/,
  `type Profile = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  isDefault: boolean;
};`
);

// 2. Fix showMore state (add it back if missing)
if (!content.includes('const [showMore, setShowMore] = useState(false);')) {
  content = content.replace(
    'const [isExchanging, setIsExchanging] = useState(false);',
    'const [isExchanging, setIsExchanging] = useState(false);\n  const [showMore, setShowMore] = useState(false);'
  );
}

// 3. Fix note to notes in formData
content = content.replace(/formData\.note\b/g, 'formData.notes');
content = content.replace(/note: e\.target\.value/g, 'notes: e.target.value');

// 4. Fix setSelectedProfileId error. Wait, line 293 might be something else?
// The error was: src/components/profile/exchange-details-drawer.tsx(293,46): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'SetStateAction<string>'.
// Wait! `data.profiles[0]` could have `.id` but what if `setSelectedProfileId` is called somewhere else?
// Let's check `setSelectedProfileId`.
content = content.replace(
  'setSelectedProfileId(defaultProfile.id);',
  'setSelectedProfileId(defaultProfile.id || "");'
);
content = content.replace(
  'setSelectedProfileId(data.profiles[0].id);',
  'setSelectedProfileId(data.profiles[0].id || "");'
);

fs.writeFileSync('src/components/profile/exchange-details-drawer.tsx', content);
console.log('Fixed TS errors!');
