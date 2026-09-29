import whois from "whois-json";

(async () => {
  try {
    const results = await whois("google.co.id", { server: "whois.id" });
    console.log(results);
  } catch (error) {
    console.error(error);
  }
})();
