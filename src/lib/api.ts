// frontend/lib/api.ts
export async function startCvOptimization(params: {
  userId: string,
  userEmail: string,
  cvPath: string,
  jobInput: string
}) {
    const url = process.env.AI_BACKEND_URL || 'http://localhost:8000';
  const response = await fetch(`${url}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      user_email: params.userEmail,
      cv_file_path: params.cvPath,
      job_input: params.jobInput,
    }),
  });

  if (!response.ok) throw new Error('AI Optimization failed');
  return response.json();
}