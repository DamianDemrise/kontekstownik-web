// Wejście podstrony materiału: style marki, przyciski platform, karty „Więcej”, zgoda + analityka, udostępnianie.
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/cta.css';
import '../styles/consent.css';
import '../styles/materials.css';
import '../styles/legal.css';
import '../styles/material-page.css';
import '../styles/lang.css';
import { initConsent } from './consent.js';
import { initShare } from './share.js';

initConsent();
initShare();
