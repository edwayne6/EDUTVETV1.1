import config from './config.json';

document.addEventListener("DOMContentLoaded", () => {
  // Form Validation
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const inputs = form.querySelectorAll("input[required]");
      let isValid = true;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add("border-red-500");
          input.nextElementSibling?.classList.add("text-red-500");
        } else {
          input.classList.remove("border-red-500");
          input.nextElementSibling?.classList.remove("text-red-500");
        }
      });

      if (!isValid) {
        e.preventDefault();
        alert("Please fill in all required fields.");
      }
    });
  });

  // (Removed: legacy sign-up / login / OAuth handlers — not used in current site)

  // Handle Upload Form Submission
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById("file");
      const formData = new FormData(uploadForm);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload document.");
        }

        alert("Document uploaded successfully!");
        uploadForm.reset();
      } catch (err) {
        console.error("Upload error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Handle Password Visibility Toggle
  const togglePasswordButtons = document.querySelectorAll("#togglePassword");
  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const passwordInput = button.previousElementSibling;
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        button.textContent = "Hide";
      } else {
        passwordInput.type = "password";
        button.textContent = "Show";
      }
    });
  });

  // (Removed: legacy auth check and logout handlers — site uses local/session storage and page-specific auth flows)

  // Mobile Menu Toggle
  const nav = document.querySelector("header nav");
  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Menu";
  toggleButton.classList.add("bg-blue-600", "text-white", "px-4", "py-2", "rounded", "md:hidden");
  toggleButton.addEventListener("click", () => {
    nav.classList.toggle("hidden");
  });

  nav.parentElement.insertBefore(toggleButton, nav);
  nav.classList.add("hidden", "md:flex");

  const recentDocumentsContainer = document.getElementById("recentDocuments");

  // Mock data for recently uploaded documents (replace with API call if needed)
  const recentlyUploadedDocuments = [
    { title: "Crop Notes Level 4", type: "Notes", level: "4", link: "#" },
    { title: "TVET Curriculum Level 5", type: "Curriculum", level: "5", link: "#" },
    { title: "Safety Standards Level 6", type: "Occupational Standards", level: "6", link: "#" },
    { title: "Business Plan Template", type: "Planning Documents", level: "5", link: "#" },
    { title: "Electrical Engineering Notes", type: "Notes", level: "4", link: "#" },
    { title: "Hospitality Curriculum", type: "Curriculum", level: "6", link: "#" },
  ];

  // Render the documents
  recentlyUploadedDocuments.forEach((doc) => {
    const documentCard = `
      <div class="document-card bg-white p-4 rounded shadow">
        <h4 class="font-bold text-lg mb-2">${doc.title}</h4>
        <p class="text-sm mb-2">Type: ${doc.type} | Level: ${doc.level}</p>
        <a href="${doc.link}" class="text-blue-600 hover:underline">Download</a>
      </div>
    `;
    recentDocumentsContainer.innerHTML += documentCard;
  });
});

// Simple Slider for Featured Documents
let currentSlide = 0;
const slides = document.querySelectorAll(".featured-slide");
const totalSlides = slides.length;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("hidden", i !== index);
  });
}

document.getElementById("prevSlide").addEventListener("click", () => {
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  showSlide(currentSlide);
});

document.getElementById("nextSlide").addEventListener("click", () => {
  currentSlide = (currentSlide + 1) % totalSlides;
  showSlide(currentSlide);
});

// API Call Example for Document Search
async function searchDocuments(query) {
  try {
    const response = await fetch(`${config.api.baseUrl}/search?query=${query}`);
    if (!response.ok) throw new Error("Failed to fetch documents");

    const documents = await response.json();
    const resultsContainer = document.getElementById("searchResults");
    resultsContainer.innerHTML = "";

    documents.forEach((doc) => {
      const docElement = `
        <div class="bg-gray-100 p-4 rounded shadow">
          <h4 class="font-bold text-lg mb-2">${doc.title}</h4>
          <p class="text-sm mb-2">By ${doc.author} • ${doc.category}</p>
          <a href="${doc.link}" class="text-blue-600 hover:underline">Download</a>
        </div>
      `;
      resultsContainer.innerHTML += docElement;
    });
  } catch (error) {
    console.error(error);
    alert("An error occurred while searching for documents.");
  }
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (query.length > 2) searchDocuments(query);
});

// Local Document Filtering
const documents = [
  { title: "Crop Protection Guide", author: "Edwin chesaro", category: "Agriculture", link: "#" },
  { title: "TVET Curriculum Outline", author: "Edwin Chesaro", category: "Curriculum", link: "#" },
  { title: "Lesson Plan Template", author: "Edwin Chesaro", category: "Teaching Aids", link: "#" },
];

function filterDocuments() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = ""; // Clear previous results

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(query) || 
    doc.author.toLowerCase().includes(query) || 
    doc.category.toLowerCase().includes(query)
  );

  if (filteredDocs.length === 0) {
    resultsContainer.innerHTML = "<p class='text-gray-500'>No documents found.</p>";
    return;
  }

  filteredDocs.forEach(doc => {
    const docElement = `
      <div class="bg-gray-100 p-4 rounded shadow">
        <h4 class="font-bold text-lg mb-2">${doc.title}</h4>
        <p class="text-sm mb-2">By ${doc.author} • ${doc.category}</p>
        <a href="${doc.link}" class="text-blue-600 hover:underline">Download</a>
      </div>
    `;
    resultsContainer.innerHTML += docElement;
  });
}

// (Removed: legacy password-reset handler — site uses simpler local submission flow)

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelector(".slides");
  const slideCount = document.querySelectorAll(".slide").length;
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");

  let currentIndex = 0;

  // Function to update the slider position
  function updateSliderPosition() {
    slides.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  // Move to the next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % slideCount; // Loop back to the first slide
    updateSliderPosition();
  }

  // Move to the previous slide
  function prevSlide() {
    currentIndex = (currentIndex - 1 + slideCount) % slideCount; // Loop back to the last slide
    updateSliderPosition();
  }

  // Event listeners for navigation buttons
  prevButton.addEventListener("click", prevSlide);
  nextButton.addEventListener("click", nextSlide);

  // Auto-slide every 3 seconds
  setInterval(nextSlide, 3000);
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// (Removed: particle.js background configuration — no particles container present in pages)

document.querySelectorAll("button, a").forEach((element) => {
  element.addEventListener("click", (e) => {
    element.classList.add("clicked");
    setTimeout(() => {
      element.classList.remove("clicked");
    }, 150); // Reset after 150ms
  });
});