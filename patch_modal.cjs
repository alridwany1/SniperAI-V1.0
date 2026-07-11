const fs = require('fs');
let code = fs.readFileSync('src/components/TenantSettingsModal.tsx', 'utf8');

const refreshState = `
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);

  const handleRefreshSchema = async () => {
    setIsRefreshingSchema(true);
    setError('');
    try {
      const response = await fetch(\`/api/tenants/\${tenant?.id}/refresh-schema\`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(language === 'ar' ? 'فشل تحديث المخطط.' : 'Failed to refresh schema.');
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء تحديث المخطط.' : 'An error occurred while refreshing schema.'));
    } finally {
      setIsRefreshingSchema(false);
    }
  };
`;

code = code.replace(
  "const [success, setSuccess] = useState(false);",
  "const [success, setSuccess] = useState(false);\n" + refreshState
);

code = code.replace(
  "import { X, Settings, CheckCircle, AlertCircle } from 'lucide-react';",
  "import { X, Settings, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';"
);

const refreshButton = `
              {tenant?.dataSource?.provider === 'PostgreSQL' && (
                <button
                  type="button"
                  onClick={handleRefreshSchema}
                  disabled={isRefreshingSchema || isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 mr-auto"
                >
                  <RefreshCw className={\`w-3.5 h-3.5 \${isRefreshingSchema ? 'animate-spin' : ''}\`} />
                  {language === 'ar' ? 'تحديث المخطط' : 'Refresh Schema'}
                </button>
              )}
`;

code = code.replace(
  "<div className=\"flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60 mt-4\">",
  "<div className=\"flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60 mt-4\">\n" + refreshButton
);

fs.writeFileSync('src/components/TenantSettingsModal.tsx', code);
