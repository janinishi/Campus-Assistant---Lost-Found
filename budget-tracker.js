const budgetForm = document.getElementById("budgetForm");
const budgetList = document.getElementById("budgetList");

budgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;

  await db.collection("budget").add({ amount, category, type, time: new Date() });
  alert("Entry added!");
  budgetForm.reset();
  loadBudget();
});

async function loadBudget() {
  const snapshot = await db.collection("budget").orderBy("time", "desc").get();
  budgetList.innerHTML = "";
  let total = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    const sign = data.type === "income" ? "+" : "-";
    const amount = (sign === "+" ? 1 : -1) * data.amount;
    total += amount;
    budgetList.innerHTML += `<p>${sign}৳${data.amount} (${data.category})</p>`;
  });
  budgetList.innerHTML += `<hr><strong>Total Balance: ৳${total}</strong>`;
}

loadBudget();
