async function testApi() {
  try {
    const res = await fetch("http://localhost:3001/api/stores?drive=leclerc&zipCode=38000");
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
testApi();
