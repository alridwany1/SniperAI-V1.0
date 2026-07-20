const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace declarations
content = content.replace(
  /const \[isAuthenticated, setIsAuthenticated\] = useState<boolean>\(\(\) => {[\s\S]*?}\);/,
  ''
);

content = content.replace(
  /const \[userEmail, setUserEmail\] = useState<string>\(\(\) => {[\s\S]*?}\);/,
  ''
);

content = content.replace(
  /const \[language, setLanguage\] = useState<Language>\(\(\) => {[\s\S]*?}\);/,
  ''
);

content = content.replace(
  /const \[tenants, setTenants\] = useState<Tenant\[\]>\(\[\]\);/,
  ''
);

content = content.replace(
  /const \[activeTenant, setActiveTenant\] = useState<Tenant \| null>\(null\);/,
  ''
);

content = content.replace(
  /const \[selectedTenantId, setSelectedTenantId\] = useState\('root'\);/,
  ''
);

// Inject useApp
content = content.replace(
  /const \{ showToast \} = useToast\(\);/,
  `const { showToast } = useToast();
  const {
    userEmail, setUserEmail,
    isAuthenticated, setIsAuthenticated,
    activeTenant, setActiveTenant,
    selectedTenantId, setSelectedTenantId,
    tenants, setTenants,
    language, setLanguage
  } = useApp();`
);

fs.writeFileSync('src/App.tsx', content);
