function toCSV(incidents) {
  const headers = [
    'id', 'timestamp', 'user_id', 'department',
    'ai_platform', 'risk_level', 'action',
    'threat_types', 'prompt_preview', 'sanitized', 'device_id',
  ];

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows = incidents.map((inc) =>
    headers.map((h) => escape(inc[h])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

module.exports = { toCSV };
