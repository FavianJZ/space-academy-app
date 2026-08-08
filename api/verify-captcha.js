export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is missing' });
  }

  const PROJECT_ID = 'my-project-example-samples'; 
  const SITE_KEY = '6Lf6snstAAAAAITdD8GWZkYM3cg4piXdOwA0zTb5'; // Key Checkbox Baru
  
  const API_KEY = process.env.GOOGLE_API_KEY; 

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: {
          token: token,
          siteKey: SITE_KEY,
        }
      })
    });

    const data = await response.json();

    // Untuk versi Checkbox, kita hanya perlu mengecek apakah token valid
    if (data.tokenProperties && data.tokenProperties.valid) {
        return res.status(200).json({ success: true, message: 'Human verified' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid token', details: data });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
