const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Gérer OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Vérifier POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parser les données
    const { prix, email, bookingNumber, trajet, date, heure } = JSON.parse(event.body);

    console.log('Création session Stripe:', bookingNumber);

    // Créer session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Course MIRAJ Chauffeur Privé',
            description: `${trajet.depart} → ${trajet.arrivee}\nDate: ${date} à ${heure}`,
            images: ['https://images.squarespace-cdn.com/content/v1/6967647be4bf060f81a98e69/7ef7c811-4c1c-4d01-aff8-2e2eecd29539/Logo+miraj+long+arriere+plan+transparent.png'],
          },
          unit_amount: Math.round(prix * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: email,
      success_url: 'https://www.mirajchauffeurprive.fr/confirmation-paiement?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.mirajchauffeurprive.fr/reserver',
      metadata: {
        booking_number: bookingNumber,
        depart: trajet.depart,
        arrivee: trajet.arrivee,
        date: date,
        heure: heure,
        distance: trajet.distance,
        duree: trajet.duree,
        passagers: trajet.passagers,
      },
    });

    console.log('Session créée:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {
    console.error('Erreur Stripe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
