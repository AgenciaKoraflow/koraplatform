import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function EmpresaServicos() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const { theme } = useTheme();

  useEffect(() => {
    fetch('/src/components/empresa/playbook-full.html')
      .then(res => res.text())
      .then(html => setHtmlContent(html))
      .catch(err => console.error('Failed to load playbook:', err));
  }, []);

  if (!htmlContent) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>Loading playbook...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        srcDoc={htmlContent}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Koraflow Playbook"
        data-theme={theme}
      />
    </div>
  );
}