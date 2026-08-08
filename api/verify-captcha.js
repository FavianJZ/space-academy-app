
export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { token, action } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is missing' });
  }

  const PROJECT_ID = 'my-project-example-samples'; 
  const SITE_KEY = '6LeqqHstAAAAAOZJk-wusa0Cxq5n7vQyi4rvRFJ9';

  const API_KEY = process.env.GOOGLE_API_KEY; 

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: {
          token: token,
          expectedAction: action,
          siteKey: SITE_KEY,
        }
      })
    });

    const data = await response.json();

    if (data.tokenProperties && data.tokenProperties.valid) {
      if (data.riskAnalysis && data.riskAnalysis.score >= 0.5) {
        return res.status(200).json({ success: true, score: data.riskAnalysis.score, message: 'Human verified' });
      } else {
        return res.status(403).json({ success: false, score: data.riskAnalysis?.score, message: 'Bot behavior detected' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid token', details: data });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}