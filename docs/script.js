/* frontend/script.js */

document.getElementById('playSongBtn').addEventListener('click', () => {
  // TODO: Call backend API to play song and fetch lyrics & translations.
  alert('Play song button clicked! (API integration pending)');
});

document.getElementById('submitFeedbackBtn').addEventListener('click', () => {
  const email = document.getElementById('userEmail').value;
  const feedback = document.getElementById('userFeedback').value;

  // Basic validation
  if (!email || !feedback) {
    alert('Please provide both email and feedback.');
    return;
  }

  // TODO: Replace with real API endpoint when implemented.
  fetch('/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, feedback })
  })
  .then(response => response.json())
  .then(data => {
    alert('Feedback submitted successfully!');
    // Clear form fields
    document.getElementById('userEmail').value = '';
    document.getElementById('userFeedback').value = '';
  })
  .catch(error => {
    console.error('Error submitting feedback:', error);
    alert('Error submitting feedback.');
  });
});
