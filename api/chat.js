import talkFlowData from './talk_flow_data.json' assert { type: 'json' };

export default async function handler(req, res) {
  // CORSヘッダー設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { scenarioId = 'mortgage', step = 1 } = req.body || {};

  // シナリオの検索
  const scenario = talkFlowData.scenarios.find((s) => s.id === scenarioId);

  if (!scenario) {
    return res.status(404).json({ error: '指定されたシナリオが存在しません。' });
  }

  const stepKey = `step_${step}`;
  const message = scenario.steps[stepKey] || 'こちらのテーマに関するご相談対話は完了いたしました。別のテーマを選択して引き続きご相談いただくことも可能です。';

  return res.status(200).json({
    scenarioId,
    category: scenario.category,
    currentStep: step,
    message,
    isCompleted: step >= 4
  });
}
