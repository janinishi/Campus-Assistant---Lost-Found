// Use existing db and storage from firebase-config.js

const form = document.getElementById("lostForm");
const itemList = document.getElementById("itemList");
const toggleBtn = document.getElementById("reported-item-toggle");
const details = document.getElementById("reported-item-details");

// Toggle reported items display
toggleBtn.addEventListener("click", () => {
  if (details.style.display === "none" || details.style.display === "") {
    details.style.display = "block";
  } else {
    details.style.display = "none";
  }
});

// Submit lost item
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = document.getElementById("item").value.trim();
  const location = document.getElementById("location").value.trim();
  const password = document.getElementById("password").value.trim();
  const photoInput = document.getElementById("photo");
  const photoFile = photoInput.files[0];

  let photoURL = "";

  if (photoFile) {
    // Upload photo to Firebase Storage
    const storageRef = storage.ref();
    const photoRef = storageRef.child(`lostItemsPhotos/${Date.now()}_${photoFile.name}`);
    try {
      await photoRef.put(photoFile);
      photoURL = await photoRef.getDownloadURL();
    } catch (error) {
      alert("Photo upload failed: " + error.message);
      return;
    }
  }

  // Save lost item data
  try {
    await db.collection("lostItems").add({
      item,
      location,
      password: password || null,
      photoURL,
      time: new Date(),
      additionalInfo: [],
      sightings: []
    });
    alert("✅ Item submitted!");
    form.reset();
    fetchItems();
  } catch (err) {
    console.error("Error adding item:", err);
  }
});

// Fetch and render lost items
async function fetchItems() {
  itemList.innerHTML = "";

  const snapshot = await db.collection("lostItems").orderBy("time", "desc").get();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const docId = doc.id;

    const li = document.createElement("li");

    // Main info line with photo icon if exists
    li.innerHTML = `
      <strong>${data.item}</strong> (Lost at: ${data.location}) - ${new Date(data.time.seconds * 1000).toLocaleString()}
      ${data.photoURL ? `<br><img src="${data.photoURL}" alt="Photo" style="max-width:120px; margin-top:8px; border-radius:8px;">` : ""}
    `;

    // Add a button to add private info (only if password matches)
    const addInfoBtn = document.createElement("button");
    addInfoBtn.textContent = "Add More Info (Private)";
    addInfoBtn.className = "add-info-btn";

    addInfoBtn.onclick = () => {
      const userPassword = prompt("Enter password to add private info:");
      if (userPassword === data.password) {
        const info = prompt("Add your private info or message:");
        if (info) addPrivateInfo(docId, info);
      } else {
        alert("Wrong password or no password set!");
      }
    };

    li.appendChild(addInfoBtn);

    // Add a button for others to add sightings
    const addSightingBtn = document.createElement("button");
    addSightingBtn.textContent = "Add Sighting Info";
    addSightingBtn.className = "add-sighting-btn";

    addSightingBtn.onclick = () => {
      const sighting = prompt("Where and when did you see this item? Add details:");
      if (sighting) addSightingInfo(docId, sighting);
    };

    li.appendChild(addSightingBtn);

    // Show private info if available (only for owner if password entered correctly)
    if (data.additionalInfo && data.additionalInfo.length > 0) {
      const privateDiv = document.createElement("div");
      privateDiv.className = "private-info";
      privateDiv.textContent = "Private info: " + data.additionalInfo.join(" | ");
      li.appendChild(privateDiv);
    }

    // Show sightings info (public)
    if (data.sightings && data.sightings.length > 0) {
      const sightingsDiv = document.createElement("div");
      sightingsDiv.className = "private-info";
      sightingsDiv.textContent = "Sightings: " + data.sightings.join(" | ");
      li.appendChild(sightingsDiv);
    }

    itemList.appendChild(li);
  });
}

// Add private info for a lost item (only owner with password)
async function addPrivateInfo(docId, info) {
  const itemRef = db.collection("lostItems").doc(docId);

  try {
    await itemRef.update({
      additionalInfo: firebase.firestore.FieldValue.arrayUnion(info),
    });
    alert("Private info added!");
    fetchItems();
  } catch (err) {
    alert("Failed to add private info: " + err.message);
  }
}

// Add sighting info for a lost item (public)
async function addSightingInfo(docId, sighting) {
  const itemRef = db.collection("lostItems").doc(docId);

  try {
    await itemRef.update({
      sightings: firebase.firestore.FieldValue.arrayUnion(sighting),
    });
    alert("Sighting info added!");
    fetchItems();
  } catch (err) {
    alert("Failed to add sighting info: " + err.message);
  }
}

// Initial load
fetchItems();
