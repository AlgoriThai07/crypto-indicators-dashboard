import NodeCache from "node-cache";

// Cache with 120 second TTL
const cache = new NodeCache({ stdTTL: 120, checkperiod: 100 });

export default cache;
