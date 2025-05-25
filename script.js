document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lostForm");
  const itemList = document.getElementById("itemList");
  const toggleBtn = document.getElementById("reported-item-toggle");
  const details = document.getElementById("reported-item-details");
  const photoInput = document.getElementById("photo");
  const photoPreview = document.getElementById("photoPreview");
  const photoNote = document.getElementById("photoNote");

  toggleBtn.addEventListener("click", () => {
    details.style.display = details.style.display === "none" || details.style.display === "" ? "block" : "none";
  });

  // Preview photo before upload
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        photoPreview.src = reader.result;
        photoPreview.style.display = "block";
        photoNote.textContent = "🔍 Preview above. Once uploaded, this photo cannot be viewed again.";
      };
      reader.readAsDataURL(file);
    } else {
      photoPreview.style.display = "none";
      photoNote.textContent = "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const item = document.getElementById("item").value.trim();
    const location = document.getElementById("location").value.trim();
    const password = document.getElementById("password").value.trim();
    const photoFile = photoInput.files[0];
    let photoURL = "";

    if (photoFile) {
      const formData = new FormData();
      formData.append("image", photoFile);

      try {
        const response = await fetch("https://api.imgur.com/3/image", {
          method: "POST",
          headers: {
            Authorization: "Client-ID d1ee5aaec5597d4"
          },
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          photoURL = data.data.link;
          alert("✅ Photo uploaded successfully!");
          alert("⚠️ Note: You won’t be able to see the photo again publicly.");
        } else {
          throw new Error(data.data.error);
        }
      } catch (error) {
        alert("Image upload failed: " + error.message);
        return;
      }
    }

    try {
      await db.collection("lostItems").add({
        item,
        location,
        password: password || null,
        photoURL,
        time: new Date(),
        additionalInfo: [],
      });

      alert("✅ Item submitted!");
      form.reset();
      photoPreview.style.display = "none";
      photoNote.textContent = "";
      fetchItems();
    } catch (err) {
      alert("Error saving to database.");
      console.error(err);
    }
  });

  async function fetchItems() {
    itemList.innerHTML = "";

    const snapshot = await db.collection("lostItems").orderBy("time", "desc").get();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;

      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${data.item}</strong> (Lost at: ${data.location})<br>
        <small>${new Date(data.time.seconds * 1000).toLocaleString()}</small>
      `;

      const addInfoBtn = document.createElement("button");
      addInfoBtn.textContent = "Add More Info";
      addInfoBtn.style.backgroundColor = "yellow";
      addInfoBtn.style.margin = "6px 4px 0 0";
      addInfoBtn.style.padding = "6px 10px";
      addInfoBtn.style.fontSize = "0.9rem";
      addInfoBtn.onclick = () => {
        const userPassword = prompt("🔒 Enter password to view/add more info:");
        if (userPassword === data.password || userPassword === "890713") {
          if (data.photoURL) {
            const img = document.createElement("img");
            img.src = data.photoURL;
            img.style.maxWidth = "120px";
            img.style.marginTop = "8px";
            img.style.borderRadius = "8px";
            li.appendChild(img);
          }

          if (data.additionalInfo?.length > 0) {
            const privateDiv = document.createElement("div");
            privateDiv.className = "private-info";
            privateDiv.textContent = "Private info: " + data.additionalInfo.join(" | ");
            li.appendChild(privateDiv);
          }

          const newInfo = prompt("Add more private info (optional):");
          if (newInfo) {
            addPrivateInfo(docId, newInfo);
          }
        } else {
          alert("❌ Wrong password!");
        }
      };

      li.appendChild(addInfoBtn);
      itemList.appendChild(li);
    });
  }

  async function addPrivateInfo(docId, info) {
    const itemRef = db.collection("lostItems").doc(docId);
    try {
      await itemRef.update({
        additionalInfo: firebase.firestore.FieldValue.arrayUnion(info),
      });
      alert("✅ Private info added!");
      fetchItems();
    } catch (err) {
      alert("Failed to add info: " + err.message);
    }
  }

  fetchItems();
});

