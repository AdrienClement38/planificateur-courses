import fetch from 'node-fetch';

async function testGenerate() {
  console.log("Sending POST to /api/generate...");
  const startTime = Date.now();
  try {
    const response = await fetch("http://localhost:3001/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData: {
          budget: 180,
          persons: 2,
          mealType: "dinner",
          period: "1 week",
          drive: "leclerc",
          zipCode: "38000",
          selectedStore: "E.Leclerc DRIVE Echirolles",
          selectedStoreUrl: "https://fd11-courses.leclercdrive.fr/magasin-063801-063801-echirolles---comboire.aspx",
          preferences: [],
          exclusions: [],
          cuisineStyle: ""
        }
      })
    });
    
    console.log(`Response Status: ${response.status} (${Date.now() - startTime}ms)`);
    const data = await response.json();
    console.log(data.summary ? data.summary.substring(0, 100) : "No summary");
  } catch (err) {
    console.error("Error:", err);
  }
}

testGenerate();
