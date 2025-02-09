/* docs/script.js */

// Replace with your actual Vercel backend URL (do not include a trailing slash)
const backendUrl = "https://lyrics-translator-app.vercel.app/";

// Event listener for the "Play Song" button
document.getElementById("playSongBtn").addEventListener("click", async () => {
  const artist = document.getElementById("artistInput").value.trim();
  const title = document.getElementById("titleInput").value.trim();

  if (!artist || !title) {
    alert("Please enter both an artist name and a song title.");
    return;
  }

  try {
    const apiUrl = `${backendUrl}/song?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Song not found or an error occurred.");
    }
    const data = await response.json();

    // Update lyrics display
    document.getElementById("lyricsText").textContent = data.lyrics;

    // Embed and autoplay the YouTube video
    const youtubePlayer = document.getElementById("youtubePlayer");
    youtubePlayer.src = `https://www.youtube.com/embed/${data.videoId}?autoplay=1`;

    // Reveal the video container
    document.getElementById("videoContainer").style.display = "block";
  } catch (error) {
    console.error("Error fetching song data:", error);
    alert("Error fetching song data. Please check your inputs or try again later.");
  }
});

// Event listener for the "Submit Feedback" button
document.getElementById("submitFeedbackBtn").addEventListener("click", () => {
  const email = document.getElementById("userEmail").value;
  const feedback = document.getElementById("userFeedback").value;

  if (!email || !feedback) {
    alert("Please provide both email and feedback.");
    return;
  }

  fetch(`${backendUrl}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, feedback })
  })
    .then(response => response.json())
    .then(data => {
      alert("Feedback submitted successfully!");
      // Clear the form fields
      document.getElementById("userEmail").value = "";
      document.getElementById("userFeedback").value = "";
    })
    .catch(error => {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback.");
    });
});
