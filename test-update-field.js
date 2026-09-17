fetch("http://localhost:3000/api/setup-project/fields/1/value", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ is_completed: true })
}).then(r => r.text()).then(console.log);
