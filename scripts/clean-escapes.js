const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let cleaned = content.split('\\`').join('`');
  cleaned = cleaned.split('\\${').join('${');
  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log('Cleaned:', filePath);
}

const files = [
  'app/hub/broker-onboarding/components/support/AIChatWidget.tsx',
  'app/hub/broker-onboarding/components/support/DepartmentCards.tsx',
  'app/hub/broker-onboarding/components/support/EscalationModal.tsx',
  'app/hub/broker-onboarding/components/support/FAQSection.tsx',
  'app/hub/broker-onboarding/components/support/TicketDetail.tsx',
  'app/hub/broker-onboarding/components/support/TicketList.tsx',
  'lib/ai/gemini.ts',
  'lib/ai/knowledge-base.ts',
  'lib/ai/prompts.ts',
  'lib/services/support-service.ts'
];

files.forEach(f => cleanFile(path.join('D:/Bibliotecas/Desktop/Development/e360-hub-2', f)));
